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

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-razorpay-signature')
  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  try {
    if (!verifyRazorpayXWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Webhook configuration error' }, { status: 500 })
  }

  let body: { event?: string; payload?: { payout?: { entity?: PayoutWebhookEntity } } }
  try {
    body = JSON.parse(rawBody) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const payout = body.payload?.payout?.entity
  if (!payout?.id) return NextResponse.json({ ok: true, ignored: true })

  const statusMap: Record<string, string> = {
    queued: 'PROCESSING',
    pending: 'PROCESSING',
    processing: 'PROCESSING',
    processed: 'PAID',
    failed: 'FAILED',
    reversed: 'FAILED',
    cancelled: 'CANCELLED',
    rejected: 'FAILED',
  }
  const status = statusMap[payout.status ?? '']
  if (!status) return NextResponse.json({ ok: true, ignored: true })

  const db = createAdminClient()
  const update = {
    status,
    provider: 'RAZORPAY_X',
    provider_transfer_id: payout.id,
    provider_transfer_status: payout.status ?? null,
    provider_utr: payout.utr ?? null,
    failure_reason: payout.status_details?.description ?? null,
    settled_at: status === 'PAID' ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }

  const { data: row } = await db
    .from('host_payouts')
    .update(update)
    .eq('provider_transfer_id', payout.id)
    .select('id,host_id,booking_id,status,net_amount')
    .maybeSingle()

  if (row?.host_id) {
    const subject = status === 'PAID' ? 'Payout completed' : status === 'FAILED' ? 'Payout needs attention' : `Payout ${String(payout.status ?? '').replace(/_/g, ' ')}`
    const message = status === 'PAID'
      ? `Your MizoramStay payout of ₹${Number(row.net_amount).toLocaleString('en-IN')} has been processed${payout.utr ? ` (UTR ${payout.utr}).` : '.'}`
      : `Your MizoramStay payout is now ${String(payout.status ?? '').replace(/_/g, ' ')}. ${payout.status_details?.description ?? ''}`.trim()

    const { data: host } = await db.from('host_profiles').select('user_id').eq('id', row.host_id).maybeSingle()
    if (host?.user_id) {
      await db.from('notifications').insert({ user_id: host.user_id, type: 'PAYOUT', channel: 'IN_APP', subject, body: message, status: 'SENT', sent_at: new Date().toISOString() })
    }
  }

  return NextResponse.json({ ok: true, event: body.event ?? null })
}
