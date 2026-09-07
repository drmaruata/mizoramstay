import type { SupabaseClient } from '@supabase/supabase-js'
import { createRazorpayXPayout } from '@/lib/payments/razorpayx'

const IST_DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

type SettlementBatch = {
  id: string
  host_id: string
  settlement_date: string
  gross_amount: number | null
  platform_fee_amount: number | null
  refund_adjustment: number | null
  net_amount: number | null
  status: string
  provider_transfer_id: string | null
  provider_transfer_status: string | null
  provider_utr: string | null
  idempotency_key: string | null
  failure_reason: string | null
  attempt_count: number | null
  scheduled_at?: string | null
}

type SettlementResult = { id: string; ok: boolean; status?: string; error?: string }

function todayIST() {
  return IST_DATE_FORMATTER.format(new Date())
}

function nextIdempotencyKey(batchId: string) {
  return `settlement-${batchId}-${crypto.randomUUID()}`
}

export class HostSettlementService {
  constructor(private readonly db: SupabaseClient) {}

  async getHostSettlementSummary(hostId: string) {
    const today = todayIST()
    const { data: batches, error } = await this.db
      .from('host_settlement_batches')
      .select('id,host_id,settlement_date,gross_amount,platform_fee_amount,refund_adjustment,net_amount,status,provider_transfer_id,provider_transfer_status,provider_utr,idempotency_key,failure_reason,attempt_count')
      .eq('host_id', hostId)
      .order('settlement_date', { ascending: false })
      .limit(50)

    if (error) throw new Error(error.message)

    const rows = (batches ?? []) as SettlementBatch[]
    const next = rows.find((row) => row.status === 'SCHEDULED' && row.settlement_date >= today)
    const scheduled = rows.filter((row) => row.status === 'SCHEDULED').reduce((sum, row) => sum + Number(row.net_amount ?? 0), 0)
    const paid = rows.filter((row) => row.status === 'PAID').reduce((sum, row) => sum + Number(row.net_amount ?? 0), 0)
    const processing = rows.filter((row) => row.status === 'PROCESSING').reduce((sum, row) => sum + Number(row.net_amount ?? 0), 0)
    const failed = rows.filter((row) => row.status === 'FAILED').reduce((sum, row) => sum + Number(row.net_amount ?? 0), 0)

    return {
      batches: rows,
      nextSettlementDate: next?.settlement_date ?? null,
      scheduled,
      paid,
      processing,
      failed,
    }
  }

  async processDueSettlements(): Promise<SettlementResult[]> {
    await this.db.rpc('prepare_host_payouts')
    const today = todayIST()
    const { data, error } = await this.db
      .from('host_settlement_batches')
      .select('id,host_id,settlement_date,gross_amount,platform_fee_amount,refund_adjustment,net_amount,status,provider_transfer_id,provider_transfer_status,provider_utr,idempotency_key,failure_reason,attempt_count')
      .in('status', ['SCHEDULED', 'FAILED'])
      .lte('settlement_date', today)
      .order('settlement_date', { ascending: true })
      .limit(25)

    if (error) throw new Error(error.message)

    const results: SettlementResult[] = []
    for (const row of (data ?? []) as SettlementBatch[]) {
      try {
        const provider = await this.processBatch(row.id)
        results.push({ id: row.id, ok: true, status: provider?.status ?? 'NOOP' })
      } catch (error) {
        results.push({ id: row.id, ok: false, error: error instanceof Error ? error.message : 'Settlement failed.' })
      }
    }
    return results
  }

  async processBatch(batchId: string) {
    const { data: batch, error } = await this.db
      .from('host_settlement_batches')
      .select('id,host_id,settlement_date,gross_amount,platform_fee_amount,refund_adjustment,net_amount,status,provider_transfer_id,provider_transfer_status,provider_utr,idempotency_key,failure_reason,attempt_count')
      .eq('id', batchId)
      .single()

    if (error || !batch) throw new Error('Settlement batch not found.')
    const current = batch as SettlementBatch
    if (!['SCHEDULED', 'FAILED'].includes(current.status)) return null
    if (current.settlement_date > todayIST()) return null

    const { data: settings, error: settingsError } = await this.db
      .from('host_payout_settings')
      .select('provider_fund_account_id,status,auto_payout')
      .eq('host_id', current.host_id)
      .maybeSingle()

    if (settingsError) throw new Error(settingsError.message)
    if (!settings || settings.status !== 'ACTIVE' || !settings.auto_payout || !settings.provider_fund_account_id) {
      throw new Error('Host payout account is not active.')
    }

    const key = current.status === 'FAILED' ? nextIdempotencyKey(current.id) : (current.idempotency_key ?? nextIdempotencyKey(current.id))
    const { data: claimed, error: claimError } = await this.db
      .from('host_settlement_batches')
      .update({
        status: 'PROCESSING',
        idempotency_key: key,
        attempt_count: Number(current.attempt_count ?? 0) + 1,
        last_attempt_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        failure_reason: null,
      })
      .eq('id', current.id)
      .in('status', ['SCHEDULED', 'FAILED'])
      .select('id')
      .maybeSingle()

    if (claimError || !claimed) return null

    try {
      const provider = await createRazorpayXPayout({
        fundAccountId: settings.provider_fund_account_id,
        amountInSubunits: Math.round(Number(current.net_amount ?? 0) * 100),
        referenceId: `SETTLE-${current.id}`,
        narration: `MizoramStay ${current.id.slice(0, 12)}`,
        mode: 'IMPS',
        idempotencyKey: key,
      })

      const normalized = String(provider.status).toLowerCase()
      const status = normalized === 'processed'
        ? 'PAID'
        : ['failed', 'reversed', 'rejected'].includes(normalized)
          ? 'FAILED'
          : normalized === 'cancelled'
            ? 'CANCELLED'
            : 'PROCESSING'
      const now = new Date().toISOString()

      await this.db.from('host_settlement_batches').update({
        status,
        provider: 'RAZORPAY_X',
        provider_transfer_id: provider.id,
        provider_transfer_status: provider.status,
        provider_utr: provider.utr ?? null,
        failure_reason: provider.status_details?.description ?? null,
        initiated_at: now,
        settled_at: status === 'PAID' ? now : null,
        paid_at: status === 'PAID' ? now : null,
        updated_at: now,
      }).eq('id', current.id)

      await this.db.from('host_payouts').update({
        status,
        provider: 'RAZORPAY_X',
        scheduled_at: now,
        paid_at: status === 'PAID' ? now : null,
        settled_at: status === 'PAID' ? now : null,
        updated_at: now,
      }).eq('settlement_batch_id', current.id)

      return provider
    } catch (error) {
      await this.db.from('host_settlement_batches').update({
        status: 'SCHEDULED',
        failure_reason: error instanceof Error ? error.message : 'RazorpayX payout request failed.',
        updated_at: new Date().toISOString(),
      }).eq('id', current.id)
      throw error
    }
  }
}
