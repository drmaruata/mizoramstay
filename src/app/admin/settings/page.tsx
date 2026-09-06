import { requireAdmin } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { SettingsPanel, type AdminSettingsState } from './SettingsPanel'

export const metadata = {
  title: 'Settings | Admin',
}

const defaults: AdminSettingsState = {
  commissionRate: 10,
  flexibleFreeCancelHours: 48,
  moderateFreeCancelHours: 120,
  strictFreeCancelHours: 240,
  defaultHoldMinutes: 15,
  verificationSlaHours: 48,
  requireMfaForAdmins: false,
  notifyBookingEmail: true,
  notifyVerificationEmail: true,
  notifyPayoutEmail: true,
  defaultCurrency: 'INR',
}

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  await requireAdmin()
  const db = createAdminClient()
  const { data } = await db.from('platform_settings').select('*').eq('id', true).maybeSingle()

  const initial: AdminSettingsState = data
    ? {
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
        defaultCurrency: data.default_currency ?? defaults.defaultCurrency,
      }
    : defaults

  return (
    <div className="mx-auto max-w-[1240px] space-y-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#72827b]">Settings</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-[#183a31] md:text-4xl">Platform control</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Manage the commercial, cancellation, verification and notification defaults used by the operations team.</p>
      </div>
      <SettingsPanel initial={initial} />
    </div>
  )
}
