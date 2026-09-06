'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'

export type AdminSettingsState = {
  commissionRate: number
  flexibleFreeCancelHours: number
  moderateFreeCancelHours: number
  strictFreeCancelHours: number
  defaultHoldMinutes: number
  verificationSlaHours: number
  requireMfaForAdmins: boolean
  notifyBookingEmail: boolean
  notifyVerificationEmail: boolean
  notifyPayoutEmail: boolean
  defaultCurrency: string
}

export async function updatePlatformSettings(input: AdminSettingsState): Promise<AdminSettingsState> {
  const admin = await requireAdmin()
  const currency = input.defaultCurrency.trim().toUpperCase()
  if (currency.length !== 3) throw new Error('Currency must be a 3-letter ISO code.')
  if (input.commissionRate < 0 || input.commissionRate > 30) throw new Error('Commission must be between 0% and 30%.')
  if (input.defaultHoldMinutes < 1 || input.defaultHoldMinutes > 60) throw new Error('Booking hold must be between 1 and 60 minutes.')
  if (input.verificationSlaHours < 1) throw new Error('Verification SLA must be at least 1 hour.')

  const db = createAdminClient()
  const payload = {
    id: true,
    commission_rate: input.commissionRate,
    flexible_free_cancel_hours: input.flexibleFreeCancelHours,
    moderate_free_cancel_hours: input.moderateFreeCancelHours,
    strict_free_cancel_hours: input.strictFreeCancelHours,
    default_hold_minutes: input.defaultHoldMinutes,
    verification_sla_hours: input.verificationSlaHours,
    require_mfa_for_admins: input.requireMfaForAdmins,
    notify_booking_email: input.notifyBookingEmail,
    notify_verification_email: input.notifyVerificationEmail,
    notify_payout_email: input.notifyPayoutEmail,
    default_currency: currency,
    updated_by: admin.id,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await db.from('platform_settings').upsert(payload, { onConflict: 'id' }).select('*').single()
  if (error || !data) throw new Error(error?.message ?? 'Unable to save platform settings.')

  await db.from('audit_logs').insert({
    actor_identity: admin.id,
    entity_type: 'platform_settings',
    entity_id: admin.id,
    action: 'UPDATED',
    new_values: payload,
    created_at: new Date().toISOString(),
  })

  revalidatePath('/admin/settings')
  return {
    commissionRate: Number(data.commission_rate),
    flexibleFreeCancelHours: Number(data.flexible_free_cancel_hours),
    moderateFreeCancelHours: Number(data.moderate_free_cancel_hours),
    strictFreeCancelHours: Number(data.strict_free_cancel_hours),
    defaultHoldMinutes: Number(data.default_hold_minutes),
    verificationSlaHours: Number(data.verification_sla_hours),
    requireMfaForAdmins: Boolean(data.require_mfa_for_admins),
    notifyBookingEmail: Boolean(data.notify_booking_email),
    notifyVerificationEmail: Boolean(data.notify_verification_email),
    notifyPayoutEmail: Boolean(data.notify_payout_email),
    defaultCurrency: data.default_currency,
  }
}
