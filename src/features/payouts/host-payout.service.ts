import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { createRazorpayXPayout, validateHostBankAccount } from '@/lib/payments/razorpayx'

const payoutSettingsSchema = z.object({
  beneficiaryName: z.string().min(2).max(160),
  bankName: z.string().min(2).max(120),
  accountNumber: z.string().regex(/^\d{6,20}$/),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/),
  autoPayout: z.boolean().default(true),
  payoutDelayDays: z.coerce.number().int().min(0).max(30).default(1),
})

export type PayoutSettingsInput = z.infer<typeof payoutSettingsSchema>

export interface HostPayoutSettings {
  hostId: string
  status: string
  beneficiaryName: string | null
  bankName: string | null
  bankAccountLast4: string | null
  ifscCode: string | null
  autoPayout: boolean
  payoutDelayDays: number
  validationStatus: string | null
  validationUtr: string | null
  failureReason: string | null
  lastVerifiedAt: string | null
}

export interface HostPayoutSummary {
  pending: number
  scheduled: number
  paid: number
  processing: number
  failed: number
  cancelled: number
  gross: number
  commission: number
  net: number
}

export interface HostPayoutLedgerRow {
  id: string
  bookingId: string
  bookingReference: string | null
  propertyName: string | null
  checkIn: string | null
  checkOut: string | null
  grossAmount: number
  platformCommission: number
  paymentCost: number
  refundAdjustment: number
  netAmount: number
  status: string
  scheduledAt: string | null
  paidAt: string | null
  createdAt: string
  providerTransferId: string | null
  providerTransferStatus: string | null
  providerSettlementStatus: string | null
  providerUtr: string | null
  failureReason: string | null
}

export class HostPayoutService {
  constructor(private db: SupabaseClient) {}

  async getCurrentHostId(): Promise<string | null> {
    const { data: { user } } = await this.db.auth.getUser()
    if (!user) return null
    const { data } = await this.db.from('host_profiles').select('id').eq('user_id', user.id).maybeSingle()
    return data?.id ?? null
  }

  async getSettings(hostId: string): Promise<HostPayoutSettings> {
    const { data } = await this.db
      .from('host_payout_settings')
      .select('host_id,status,beneficiary_name,bank_name,bank_account_last4,ifsc_code,auto_payout,payout_delay_days,provider_validation_status,provider_validation_utr,failure_reason,last_verified_at')
      .eq('host_id', hostId)
      .maybeSingle()

    return {
      hostId,
      status: data?.status ?? 'NOT_CONFIGURED',
      beneficiaryName: data?.beneficiary_name ?? null,
      bankName: data?.bank_name ?? null,
      bankAccountLast4: data?.bank_account_last4 ?? null,
      ifscCode: data?.ifsc_code ?? null,
      autoPayout: data?.auto_payout ?? true,
      payoutDelayDays: Number(data?.payout_delay_days ?? 1),
      validationStatus: data?.provider_validation_status ?? null,
      validationUtr: data?.provider_validation_utr ?? null,
      failureReason: data?.failure_reason ?? null,
      lastVerifiedAt: data?.last_verified_at ?? null,
    }
  }

  async saveSettings(hostId: string, input: PayoutSettingsInput): Promise<HostPayoutSettings> {
    const parsed = payoutSettingsSchema.parse({ ...input, ifscCode: input.ifscCode.toUpperCase() })
    const { data: host, error: hostError } = await this.db
      .from('host_profiles')
      .select('id,display_name,user_id')
      .eq('id', hostId)
      .single()
    if (hostError || !host) throw new Error('Host profile could not be loaded.')

    const { data: profile } = await this.db.from('profiles').select('phone').eq('id', host.user_id).maybeSingle()
    const { data: authData } = await this.db.auth.getUser()
    const email = authData.user?.email
    if (!email) throw new Error('Your account email is required for payout setup.')
    if (!profile?.phone) throw new Error('Add and verify a phone number before setting up payouts.')

    let validationStatus = 'created'
    let validationId: string | null = null
    let validationUtr: string | null = null
    let providerFundAccountId: string | null = null
    let providerContactId: string | null = null
    let failureReason: string | null = null

    try {
      const validation = await validateHostBankAccount({
        beneficiaryName: parsed.beneficiaryName,
        email,
        phone: profile.phone,
        accountNumber: parsed.accountNumber,
        ifsc: parsed.ifscCode,
        referenceId: `HOST-${hostId}`,
      })
      validationStatus = validation.status
      validationId = validation.id
      validationUtr = validation.utr ?? null
      providerFundAccountId = validation.fund_account?.id ?? null
      providerContactId = validation.fund_account?.contact?.id ?? null
      failureReason = validation.status_details?.description ?? null
    } catch (error) {
      failureReason = error instanceof Error ? error.message : 'Bank account validation failed.'
    }

    const status = validationStatus === 'completed' && providerFundAccountId ? 'ACTIVE' : failureReason ? 'ACTION_REQUIRED' : 'UNDER_REVIEW'
    const verifiedAt = status === 'ACTIVE' ? new Date().toISOString() : null

    const { error } = await this.db.from('host_payout_settings').upsert({
      host_id: hostId,
      provider: 'RAZORPAY_X',
      provider_contact_id: providerContactId,
      provider_fund_account_id: providerFundAccountId,
      provider_validation_id: validationId,
      provider_validation_status: validationStatus,
      provider_validation_utr: validationUtr,
      beneficiary_name: parsed.beneficiaryName,
      bank_name: parsed.bankName,
      bank_account_last4: parsed.accountNumber.slice(-4),
      ifsc_code: parsed.ifscCode,
      status,
      auto_payout: parsed.autoPayout,
      payout_delay_days: parsed.payoutDelayDays,
      last_verified_at: verifiedAt,
      failure_reason: failureReason,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'host_id' })
    if (error) throw new Error(error.message)

    await this.db.from('host_profiles').update({ bank_account_status: status === 'ACTIVE' ? 'VERIFIED' : 'PENDING', updated_at: new Date().toISOString() }).eq('id', hostId)
    return this.getSettings(hostId)
  }

  async getSummary(hostId: string): Promise<HostPayoutSummary> {
    const { data } = await this.db.from('host_payouts').select('status,gross_amount,platform_commission,net_amount').eq('host_id', hostId)
    const rows = data ?? []
    return rows.reduce<HostPayoutSummary>((summary, row) => {
      const amount = Number(row.net_amount ?? 0)
      summary.pending += row.status === 'PENDING' ? 1 : 0
      summary.scheduled += row.status === 'SCHEDULED' ? 1 : 0
      summary.paid += row.status === 'PAID' ? 1 : 0
      summary.processing += row.status === 'PROCESSING' ? 1 : 0
      summary.failed += row.status === 'FAILED' ? 1 : 0
      summary.cancelled += row.status === 'CANCELLED' ? 1 : 0
      summary.gross += Number(row.gross_amount ?? 0)
      summary.commission += Number(row.platform_commission ?? 0)
      summary.net += amount
      return summary
    }, { pending: 0, scheduled: 0, paid: 0, processing: 0, failed: 0, cancelled: 0, gross: 0, commission: 0, net: 0 })
  }

  async listPayouts(hostId: string): Promise<HostPayoutLedgerRow[]> {
    const { data, error } = await this.db
      .from('host_payouts')
      .select('id,booking_id,gross_amount,platform_commission,payment_cost,refund_adjustment,net_amount,status,scheduled_at,paid_at,created_at,provider_transfer_id,provider_transfer_status,provider_settlement_status,provider_utr,failure_reason,bookings:booking_id(booking_reference,check_in,check_out,properties:property_id(name))')
      .eq('host_id', hostId)
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) throw new Error(error.message)

    return (data ?? []).map((row) => {
      const booking = Array.isArray(row.bookings) ? row.bookings[0] : row.bookings
      const property = booking && (Array.isArray(booking.properties) ? booking.properties[0] : booking.properties)
      return {
        id: row.id,
        bookingId: row.booking_id,
        bookingReference: booking?.booking_reference ?? null,
        propertyName: property?.name ?? null,
        checkIn: booking?.check_in ?? null,
        checkOut: booking?.check_out ?? null,
        grossAmount: Number(row.gross_amount ?? 0),
        platformCommission: Number(row.platform_commission ?? 0),
        paymentCost: Number(row.payment_cost ?? 0),
        refundAdjustment: Number(row.refund_adjustment ?? 0),
        netAmount: Number(row.net_amount ?? 0),
        status: row.status,
        scheduledAt: row.scheduled_at,
        paidAt: row.paid_at,
        createdAt: row.created_at,
        providerTransferId: row.provider_transfer_id ?? null,
        providerTransferStatus: row.provider_transfer_status ?? null,
        providerSettlementStatus: row.provider_settlement_status ?? null,
        providerUtr: row.provider_utr ?? null,
        failureReason: row.failure_reason ?? null,
      }
    })
  }

  async processScheduledPayout(payoutId: string) {
    const { data: payout, error } = await this.db.from('host_payouts').select('id,host_id,booking_id,net_amount,status,idempotency_key,attempt_count').eq('id', payoutId).single()
    if (error || !payout) throw new Error('Payout not found.')
    if (!['PENDING', 'SCHEDULED', 'FAILED'].includes(payout.status)) return null

    const { data: settings } = await this.db.from('host_payout_settings').select('provider_fund_account_id,status,auto_payout').eq('host_id', payout.host_id).maybeSingle()
    if (!settings || settings.status !== 'ACTIVE' || !settings.auto_payout || !settings.provider_fund_account_id) throw new Error('Host payout account is not active.')

    const idempotencyKey = payout.idempotency_key ?? `payout-${payout.id}`
    const { data: claimed, error: claimError } = await this.db
      .from('host_payouts')
      .update({ status: 'PROCESSING', idempotency_key: idempotencyKey, attempt_count: Number(payout.attempt_count ?? 0) + 1, last_attempt_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', payoutId)
      .in('status', ['PENDING', 'SCHEDULED', 'FAILED'])
      .select('id')
      .maybeSingle()
    if (claimError || !claimed) return null

    try {
      const provider = await createRazorpayXPayout({
        fundAccountId: settings.provider_fund_account_id,
        amountInSubunits: Math.round(Number(payout.net_amount) * 100),
        referenceId: idempotencyKey,
        narration: `MizoramStay ${String(payout.id).slice(0, 12)}`,
        mode: 'IMPS',
        idempotencyKey,
      })
      const status = ['processed'].includes(provider.status) ? 'PAID' : 'PROCESSING'
      await this.db.from('host_payouts').update({ status, provider: 'RAZORPAY_X', provider_transfer_id: provider.id, provider_transfer_status: provider.status, provider_utr: provider.utr ?? null, failure_reason: provider.status_details?.description ?? null, initiated_at: new Date().toISOString(), settled_at: provider.status === 'processed' ? new Date().toISOString() : null, updated_at: new Date().toISOString() }).eq('id', payoutId)
      return provider
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Payout failed.'
      await this.db.from('host_payouts').update({ status: 'FAILED', failure_reason: message, updated_at: new Date().toISOString() }).eq('id', payoutId)
      throw error
    }
  }

  async processDuePayouts() {
    await this.db.rpc('prepare_host_payouts')
    const { data } = await this.db.from('host_payouts').select('id').in('status', ['SCHEDULED','FAILED']).lte('scheduled_at', new Date().toISOString()).order('scheduled_at', { ascending: true }).limit(25)
    const results: Array<{ id: string; ok: boolean; error?: string }> = []
    for (const row of data ?? []) {
      try {
        await this.processScheduledPayout(row.id)
        results.push({ id: row.id, ok: true })
      } catch (error) {
        results.push({ id: row.id, ok: false, error: error instanceof Error ? error.message : 'Payout failed.' })
      }
    }
    return results
  }
}
