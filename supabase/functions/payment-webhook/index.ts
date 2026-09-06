// payment-webhook — Razorpay webhook receiver.
//
// verify_jwt = false (see supabase/config.toml): Razorpay does not send a
// Supabase JWT, so this function authenticates the request by verifying the
// Razorpay webhook signature (HMAC-SHA256 of the raw body using
// RAZORPAY_WEBHOOK_SECRET) against the X-Razorpay-Signature header.
//
// It persists every event idempotently into public.payment_events (unique on
// provider + event_id) and then reacts to the events that matter:
//   - payment.captured  -> confirm the booking via
//                          confirm_booking_payment_transaction (SECURITY
//                          DEFINER, service-role only)
//   - payment.failed    -> mark the payment FAILED
//   - refund.processed  -> mark the payment REFUNDED
//
// The function returns 200 as fast as possible (Razorpay expects a quick ack);
// heavy work is done after the event has been durably recorded.

import { json } from '../_shared/http.ts'

const PROVIDER = 'RAZORPAY'

function verifySignature(rawBody: string, signature: string | null): Promise<boolean> {
  const secret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')
  if (!secret) return Promise.resolve(false)
  if (!signature) return Promise.resolve(false)
  const key = new TextEncoder().encode(secret)
  const data = new TextEncoder().encode(rawBody)
  return crypto.subtle
    .importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    .then((cryptoKey) => crypto.subtle.sign('HMAC', cryptoKey, data))
    .then((sig) => {
      const expected = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('')
      return expected === signature
    })
}

async function getServiceClient() {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) throw new Error('Supabase service credentials are not configured.')
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
  return createClient(url, key, { auth: { persistSession: false } })
}

async function recordEvent(supabase: Awaited<ReturnType<typeof getServiceClient>>, event: {
  id: string
  event: string
  payload: unknown
}) {
  const { error } = await supabase.from('payment_events').insert({
    provider: PROVIDER,
    event_id: event.id,
    event_type: event.event,
    payload: event.payload,
    status: 'RECEIVED',
  })
  if (error) {
    // Unique violation (provider, event_id) means we already saw this event.
    if (error.code === '23505') return { duplicate: true }
    throw error
  }
  return { duplicate: false }
}

async function handleCaptured(supabase: Awaited<ReturnType<typeof getServiceClient>>, payload: {
  payment?: {
    id?: string
    order_id?: string
    amount?: number
    currency?: string
    method?: string
    status?: string
  }
}) {
  const payment = payload.payment
  const orderId = payment?.order_id
  if (!orderId) return

  const { data: stored, error: lookupError } = await supabase
    .from('payments')
    .select('id, booking_id, amount, currency, status')
    .eq('provider', PROVIDER)
    .eq('provider_order_id', orderId)
    .maybeSingle()
  if (lookupError) throw lookupError
  if (!stored) return

  const amount = payment.amount != null ? Number(payment.amount) / 100 : Number(stored.amount)
  const { data: result, error: confirmError } = await supabase.rpc('confirm_booking_payment_transaction', {
    p_booking_id: stored.booking_id,
    p_provider: PROVIDER,
    p_provider_order_id: orderId,
    p_provider_transaction_id: payment.id ?? null,
    p_amount: amount,
    p_payment_method: payment.method ?? null,
    p_metadata: { source: 'webhook', razorpay_payment_status: payment.status ?? 'captured' },
  })
  if (confirmError) throw confirmError

  const row = result?.[0]
  if (row?.refund_required) {
    // Payment arrived after the booking hold expired — the RPC cancelled the
    // booking and recorded the payment; issue a refund back to the guest.
    const keyId = Deno.env.get('RAZORPAY_KEY_ID')
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
    if (!keyId || !keySecret) throw new Error('Razorpay credentials are not configured for refunds.')
    const refund = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(payment.id ?? '')}/refund`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: Math.round(amount * 100) }),
    })
    const refundBody = await refund.json().catch(() => null)
    if (!refund.ok) throw new Error(`Refund failed: ${refundBody?.error?.description ?? refund.statusText}`)
    await supabase.from('refunds').insert({
      booking_id: stored.booking_id,
      payment_id: row.payment_id,
      provider: PROVIDER,
      provider_refund_id: refundBody?.id ?? null,
      amount: Number(stored.amount),
      currency: stored.currency,
      reason: 'Payment arrived after booking hold expiry',
      status: 'PROCESSED',
      processed_at: new Date().toISOString(),
    })
    await supabase.from('payments').update({ status: 'REFUNDED' }).eq('id', row.payment_id)
  }
}

async function handleFailed(supabase: Awaited<ReturnType<typeof getServiceClient>>, payload: {
  payment?: { order_id?: string }
}) {
  const orderId = payload.payment?.order_id
  if (!orderId) return
  const { error } = await supabase
    .from('payments')
    .update({ status: 'FAILED' })
    .eq('provider', PROVIDER)
    .eq('provider_order_id', orderId)
    .in('status', ['INITIATED', 'AUTHORIZED'])
  if (error) throw error
}

async function handleRefundProcessed(supabase: Awaited<ReturnType<typeof getServiceClient>>, payload: {
  refund?: { id?: string; payment_id?: string }
}) {
  const refundId = payload.refund?.id
  if (!refundId) return
  const { data: refundRow, error: refundError } = await supabase
    .from('refunds')
    .select('payment_id')
    .eq('provider', PROVIDER)
    .eq('provider_refund_id', refundId)
    .maybeSingle()
  if (refundError) throw refundError
  if (!refundRow) return
  await supabase.from('refunds').update({ status: 'PROCESSED', processed_at: new Date().toISOString() }).eq('provider_refund_id', refundId)
  await supabase.from('payments').update({ status: 'REFUNDED' }).eq('id', refundRow.payment_id)
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const rawBody = await req.text()
  const signature = req.headers.get('X-Razorpay-Signature')

  const valid = await verifySignature(rawBody, signature)
  if (!valid) return json({ error: 'INVALID_SIGNATURE', message: 'Webhook signature verification failed.' }, 401)

  let event: { id?: string; event?: string; payload?: unknown }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return json({ error: 'INVALID_PAYLOAD', message: 'Webhook body is not valid JSON.' }, 400)
  }

  if (!event.id || !event.event) {
    return json({ error: 'INVALID_EVENT', message: 'Webhook event is missing id or event type.' }, 400)
  }

  try {
    const supabase = await getServiceClient()
    const { duplicate } = await recordEvent(supabase, { id: event.id, event: event.event, payload: event.payload })

    if (!duplicate) {
      const payload = (event.payload ?? {}) as Record<string, unknown>
      switch (event.event) {
        case 'payment.captured':
          await handleCaptured(supabase, payload as Parameters<typeof handleCaptured>[1])
          break
        case 'payment.failed':
          await handleFailed(supabase, payload as Parameters<typeof handleFailed>[1])
          break
        case 'refund.processed':
          await handleRefundProcessed(supabase, payload as Parameters<typeof handleRefundProcessed>[1])
          break
        default:
          // Other events (order.paid, payment.authorized, ...) are recorded
          // for the audit trail but need no side effect.
          break
      }
    }

    return json({ received: true, event: event.event })
  } catch (error) {
    console.error('[payment-webhook]', error)
    return json({ error: 'PROCESSING_FAILED', message: error instanceof Error ? error.message : 'Webhook processing failed.' }, 500)
  }
})
