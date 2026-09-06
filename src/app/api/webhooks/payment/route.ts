import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { refundRazorpayPayment, verifyRazorpayWebhookSignature } from '@/lib/payments/razorpay'

type RazorpayWebhook = {
  event?: string
  payload?: {
    payment?: { entity?: { id?: string; order_id?: string; amount?: number; currency?: string; status?: string; method?: string } }
    order?: { entity?: { id?: string; amount?: number; currency?: string; receipt?: string; status?: string } }
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-razorpay-signature') ?? ''
  const eventId = request.headers.get('x-razorpay-event-id') ?? ''

  if (!signature || !eventId) return NextResponse.json({ error: 'Missing webhook headers.' }, { status: 400 })
  try {
    if (!verifyRazorpayWebhookSignature(rawBody, signature)) return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 401 })
  } catch (error) {
    console.error('[payment-webhook:signature]', error)
    return NextResponse.json({ error: 'Webhook signature validation is not configured.' }, { status: 503 })
  }

  let event: RazorpayWebhook
  try { event = JSON.parse(rawBody) as RazorpayWebhook } catch { return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 }) }

  const eventType = event.event ?? 'unknown'
  const admin = createAdminClient()
  const { data: existing } = await admin
    .from('payment_events')
    .select('id, status')
    .eq('provider', 'RAZORPAY')
    .eq('event_id', eventId)
    .maybeSingle()

  if (existing?.status === 'PROCESSED') return NextResponse.json({ received: true, duplicate: true })
  if (!existing) {
    const { error: insertError } = await admin.from('payment_events').insert({
      provider: 'RAZORPAY', event_id: eventId, event_type: eventType, payload: event, status: 'RECEIVED',
    })
    if (insertError && insertError.code !== '23505') {
      console.error('[payment-webhook:event-insert]', insertError)
      return NextResponse.json({ error: 'Could not record webhook event.' }, { status: 500 })
    }
  }

  try {
    const entity = event.payload?.payment?.entity ?? null
    const orderEntity = event.payload?.order?.entity ?? null
    const orderId = entity?.order_id ?? orderEntity?.id ?? null
    const paymentId = entity?.id ?? null

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      if (!orderId || !paymentId) throw new Error('Webhook does not contain a payment and order identifier.')

      const { data: paymentRecord, error: paymentLookupError } = await admin
        .from('payments')
        .select('id, booking_id, amount, currency')
        .eq('provider', 'RAZORPAY')
        .or(`provider_order_id.eq.${orderId},provider_transaction_id.eq.${paymentId}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (paymentLookupError || !paymentRecord) throw new Error('No matching booking payment record was found.')

      const capturedAmount = Number(entity?.amount ?? orderEntity?.amount ?? 0) / 100
      const currency = entity?.currency ?? orderEntity?.currency ?? paymentRecord.currency
      if (capturedAmount !== Number(paymentRecord.amount) || currency !== paymentRecord.currency) {
        throw new Error('Webhook payment amount or currency does not match the booking payment.')
      }

      const { data: confirmation, error: confirmationError } = await admin.rpc('confirm_booking_payment_transaction', {
        p_booking_id: paymentRecord.booking_id,
        p_provider: 'RAZORPAY',
        p_provider_order_id: orderId,
        p_provider_transaction_id: paymentId,
        p_amount: capturedAmount,
        p_payment_method: entity?.method ?? null,
        p_metadata: { verified_via: 'webhook', event_id: eventId, event_type: eventType },
      })
      if (confirmationError) throw confirmationError

      const result = confirmation?.[0]
      if (!result) throw new Error('Booking confirmation returned no result.')

      if (result.refund_required) {
        const refund = await refundRazorpayPayment(paymentId, Math.round(capturedAmount * 100), `${paymentId}-expired`)
        const { error: refundError } = await admin.from('refunds').insert({
          booking_id: paymentRecord.booking_id,
          payment_id: result.payment_id,
          provider: 'RAZORPAY',
          provider_refund_id: refund.id,
          amount: capturedAmount,
          currency: paymentRecord.currency,
          reason: 'Payment arrived after booking hold expiry',
          status: 'PROCESSED',
          processed_at: new Date().toISOString(),
        })
        if (refundError) console.error('[payment-webhook:refund-record]', refundError)
        await admin.from('payments').update({ status: 'REFUNDED' }).eq('id', result.payment_id)
      }
    } else if (eventType === 'payment.failed') {
      if (paymentId || orderId) {
        let query = admin.from('payments').update({ status: 'FAILED', metadata: { webhook_event_id: eventId } }).eq('provider', 'RAZORPAY')
        if (paymentId) query = query.eq('provider_transaction_id', paymentId)
        else if (orderId) query = query.eq('provider_order_id', orderId)
        const { error } = await query
        if (error) throw error
      }
    }

    await admin.from('payment_events').update({ status: 'PROCESSED', processed_at: new Date().toISOString(), error_message: null }).eq('provider', 'RAZORPAY').eq('event_id', eventId)
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[payment-webhook:process]', error)
    await admin.from('payment_events').update({ status: 'FAILED', error_message: error instanceof Error ? error.message : 'Webhook processing failed.' }).eq('provider', 'RAZORPAY').eq('event_id', eventId)
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 })
  }
}
