import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyRazorpayXWebhookSignature } from '@/lib/payments/razorpayx'

export const dynamic = 'force-dynamic'

type PayoutWebhookEntity = {
  id?: string
  status?: string
  utr?: string | null
  status_details?: { description?: string; reason?: string; source?: string }
}

type WebhookPayload = {
  entity?: string
  account_id?: string
  event?: string
  payload?: { payout?: { entity?: PayoutWebhookEntity } }
  created_at?: number
}

const statusMap: Record<string, string> = {
  queued: 'PROCESSING', pending: 'PROCESSING', processing: 'PROCESSING',
  processed: 'PAID', failed: 'FAILED', reversed: 'FAILED',
  cancelled: 'CANCELLED', rejected: 'FAILED',
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-razorpay-signature')
  const eventId = request.headers.get('x-razorpay-event-id')
  if (!signature || !eventId) return NextResponse.json({ error: 'Missing webhook signature or event id' }, { status: 400 })

  try {
    if (!verifyRazorpayXWebhookSignature(rawBody, signature)) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Webhook configuration error' }, { status: 500 })
  }

  let body: WebhookPayload
  try { body = JSON.parse(rawBody) as WebhookPayload } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const payout = body.payload?.payout?.entity
  const db = createAdminClient()
  const provider = 'RAZORPAY_X'
  const { data: inserted, error: eventError } = await db.from('payout_events').insert({
    provider, event_id: eventId, event_type: body.event ?? 'unknown',
    payout_provider_id: payout?.id ?? null, payload: body, status: 'RECEIVED', received_at: new Date().toISOString(),
  }).select('id').maybeSingle()

  if (eventError?.code === '23505') return NextResponse.json({ ok: true, duplicate: true })
  if (eventError || !inserted) return NextResponse.json({ error: eventError?.message ?? 'Unable to record webhook event' }, { status: 500 })
  if (!payout?.id) {
    await db.from('payout_events').update({ status: 'IGNORED', processed_at: new Date().toISOString() }).eq('id', inserted.id)
    return NextResponse.json({ ok: true, ignored: true })
  }

  const status = statusMap[payout.status ?? '']
  if (!status) {
    await db.from('payout_events').update({ status: 'IGNORED', processed_at: new Date().toISOString() }).eq('id', inserted.id)
    return NextResponse.json({ ok: true, ignored: true })
  }

  const now = new Date().toISOString()
  const common = {
    status,
    provider,
    provider_transfer_id: payout.id,
    provider_transfer_status: payout.status ?? null,
    provider_utr: payout.utr ?? null,
    failure_reason: payout.status_details?.description ?? null,
    settled_at: status === 'PAID' ? now : null,
    paid_at: status === 'PAID' ? now : null,
    updated_at: now,
  }

  const { data: batch, error: batchLookupError } = await db
    .from('host_settlement_batches')
    .select('id,host_id,net_amount,status')
    .eq('provider_transfer_id', payout.id)
    .maybeSingle()

  if (batchLookupError) {
    await db.from('payout_events').update({ status: 'FAILED', error_message: batchLookupError.message, processed_at: now }).eq('id', inserted.id)
    return NextResponse.json({ error: batchLookupError.message }, { status: 500 })
  }

  if (batch) {
    const { error: updateBatchError } = await db.from('host_settlement_batches').update(common).eq('id', batch.id)
    if (updateBatchError) {
      await db.from('payout_events').update({ status: 'FAILED', error_message: updateBatchError.message, processed_at: now }).eq('id', inserted.id)
      return NextResponse.json({ error: updateBatchError.message }, { status: 500 })
    }

    await db.from('host_payouts').update({
      status,
      paid_at: common.paid_at,
      settled_at: common.settled_at,
      updated_at: now,
    }).eq('settlement_batch_id', batch.id)

    const { data: host } = await db.from('host_profiles').select('user_id').eq('id', batch.host_id).maybeSingle()
    if (host?.user_id) {
      const subject = status === 'PAID' ? 'Settlement completed' : status === 'FAILED' ? 'Settlement needs attention' : `Settlement ${String(payout.status ?? '').replace(/_/g, ' ')}`
      const message = status === 'PAID'
        ? `Your MizoramStay settlement of ₹${Number(batch.net_amount ?? 0).toLocaleString('en-IN')} has been credited${payout.utr ? ` (UTR ${payout.utr}).` : '.'}`
        : `Your MizoramStay settlement is now ${String(payout.status ?? '').replace(/_/g, ' ')}. ${payout.status_details?.description ?? ''}`.trim()
      await db.from('notifications').insert({ user_id: host.user_id, type: 'PAYOUT', channel: 'IN_APP', subject, body: message, status: 'SENT', sent_at: now })
    }

    await db.from('payout_events').update({ status: 'PROCESSED', processed_at: now }).eq('id', inserted.id)
    return NextResponse.json({ ok: true, event: body.event ?? null, settlement_batch_id: batch.id })
  }

  // Backward-compatible reconciliation for legacy per-booking payout records.
  const { data: row, error: payoutError } = await db.from('host_payouts').update(common).eq('provider_transfer_id', payout.id).select('id,host_id,booking_id,status,net_amount').maybeSingle()
  if (payoutError) {
    await db.from('payout_events').update({ status: 'FAILED', error_message: payoutError.message, processed_at: now }).eq('id', inserted.id)
    return NextResponse.json({ error: payoutError.message }, { status: 500 })
  }

  if (row?.host_id) {
    const subject = status === 'PAID' ? 'Payout completed' : status === 'FAILED' ? 'Payout needs attention' : `Payout ${String(payout.status ?? '').replace(/_/g, ' ')}`
    const message = status === 'PAID'
      ? `Your MizoramStay payout of ₹${Number(row.net_amount).toLocaleString('en-IN')} has been processed${payout.utr ? ` (UTR ${payout.utr}).` : '.'}`
      : `Your MizoramStay payout is now ${String(payout.status ?? '').replace(/_/g, ' ')}. ${payout.status_details?.description ?? ''}`.trim()
    const { data: host } = await db.from('host_profiles').select('user_id').eq('id', row.host_id).maybeSingle()
    if (host?.user_id) await db.from('notifications').insert({ user_id: host.user_id, type: 'PAYOUT', channel: 'IN_APP', subject, body: message, status: 'SENT', sent_at: now })
  }

  await db.from('payout_events').update({ status: 'PROCESSED', processed_at: now }).eq('id', inserted.id)
  return NextResponse.json({ ok: true, event: body.event ?? null })
}
