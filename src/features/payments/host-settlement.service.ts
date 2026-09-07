import { randomUUID } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createRazorpayXPayout } from '@/lib/payments/razorpayx'

const IST_DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' })

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
}

type SettlementResult = { id: string; ok: boolean; status?: string; error?: string }

function todayIST() {
  return IST_DATE_FORMATTER.format(new Date())
}

function nextIdempotencyKey(batchId: string) {
  return `settlement-${batchId}-${randomUUID()}`
}

export class HostSettlementService {
  constructor(private readonly db: SupabaseClient) {}

  async getHostSettlementSummary(hostId: string) {
    const today = todayIST()
    const { data, error } = await this.db
      .from('host_settlement_batches')
      .select('id,host_id,settlement_date,gross_amount,platform_fee_amount,refund_adjustment,net_amount,status,provider_transfer_id,provider_transfer_status,provider_utr,idempotency_key,failure_reason,attempt_count')
      .eq('host_id', hostId)
      .order('settlement_date', { ascending: false })
      .limit(50)
    if (error) throw new Error(error.message)
    const rows = (data ?? []) as SettlementBatch[]
    const next = rows.find((row) => row.status === 'SCHEDULED' && row.settlement_date >= today)
    return {
      batches: rows,
      nextSettlementDate: next?.settlement_date ?? null,
      scheduled: rows.filter((r) => r.status === 'SCHEDULED').reduce((s, r) => s + Number(r.net_amount ?? 0), 0),
      paid: rows.filter((r) => r.status === 'PAID').reduce((s, r) => s + Number(r.net_amount ?? 0), 0),
      processing: rows.filter((r) => r.status === 'PROCESSING').reduce((s, r) => s + Number(r.net_amount ?? 0), 0),
      failed: rows.filter((r) => r.status === 'FAILED').reduce((s, r) => s + Number(r.net_amount ?? 0), 0),
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
    const { data, error } = await this.db
      .from('host_settlement_batches')
      .select('id,host_id,settlement_date,gross_amount,platform_fee_amount,refund_adjustment,net_amount,status,provider_transfer_id,provider_transfer_status,provider_utr,idempotency_key,failure_reason,attempt_count')
      .eq('id', batchId)
      .single()
    if (error || !data) throw new Error('Settlement batch not found.')
    const batch = data as SettlementBatch
    if (!['SCHEDULED', 'FAILED'].includes(batch.status)) return null
    if (batch.settlement_date > todayIST()) return null

    const { data: settings, error: settingsError } = await this.db
      .from('host_payout_settings')
      .select('provider_fund_account_id,status,auto_payout')
      .eq('host_id', batch.host_id)
      .maybeSingle()
    if (settingsError) throw new Error(settingsError.message)
    if (!settings || settings.status !== 'ACTIVE' || !settings.auto_payout || !settings.provider_fund_account_id) throw new Error('Host payout account is not active.')

    const key = batch.status === 'FAILED' ? nextIdempotencyKey(batch.id) : (batch.idempotency_key ?? nextIdempotencyKey(batch.id))
    const { data: claimed, error: claimError } = await this.db
      .from('host_settlement_batches')
      .update({ status: 'PROCESSING', idempotency_key: key, attempt_count: Number(batch.attempt_count ?? 0) + 1, last_attempt_at: new Date().toISOString(), updated_at: new Date().toISOString(), failure_reason: null })
      .eq('id', batch.id)
      .in('status', ['SCHEDULED', 'FAILED'])
      .select('id')
      .maybeSingle()
    if (claimError || !claimed) return null

    try {
      const provider = await createRazorpayXPayout({
        fundAccountId: settings.provider_fund_account_id,
        amountInSubunits: Math.round(Number(batch.net_amount ?? 0) * 100),
        referenceId: `SETTLE-${batch.id}`,
        narration: `MizoramStay ${batch.id.slice(0, 12)}`,
        mode: 'IMPS',
        idempotencyKey: key,
      })
      const providerStatus = String(provider.status).toLowerCase()
      const status = providerStatus === 'processed' ? 'PAID' : ['failed', 'reversed', 'rejected'].includes(providerStatus) ? 'FAILED' : providerStatus === 'cancelled' ? 'CANCELLED' : 'PROCESSING'
      const now = new Date().toISOString()
      const { error: batchUpdateError } = await this.db.from('host_settlement_batches').update({ status, provider: 'RAZORPAY_X', provider_transfer_id: provider.id, provider_transfer_status: provider.status, provider_utr: provider.utr ?? null, failure_reason: provider.status_details?.description ?? null, initiated_at: now, settled_at: status === 'PAID' ? now : null, paid_at: status === 'PAID' ? now : null, updated_at: now }).eq('id', batch.id)
      if (batchUpdateError) throw new Error(batchUpdateError.message)
      await this.db.from('host_payouts').update({ status, provider: 'RAZORPAY_X', scheduled_at: now, paid_at: status === 'PAID' ? now : null, settled_at: status === 'PAID' ? now : null, updated_at: now }).eq('settlement_batch_id', batch.id)
      return provider
    } catch (error) {
      await this.db.from('host_settlement_batches').update({ status: 'SCHEDULED', failure_reason: error instanceof Error ? error.message : 'RazorpayX payout request failed.', updated_at: new Date().toISOString() }).eq('id', batch.id)
      throw error
    }
  }
}
