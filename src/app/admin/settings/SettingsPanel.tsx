'use client'

import { useMemo, useState, useTransition } from 'react'
import { Bell, CheckCircle2, CreditCard, Globe2, LockKeyhole, Save, Settings2, ShieldCheck } from 'lucide-react'
import { updatePlatformSettings, type AdminSettingsState } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export type { AdminSettingsState } from './actions'

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

export function SettingsPanel({ initial }: { initial?: Partial<AdminSettingsState> }) {
  const initialState = useMemo(() => ({ ...defaults, ...initial }), [initial])
  const [state, setState] = useState<AdminSettingsState>(initialState)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const dirty = useMemo(() => JSON.stringify(state) !== JSON.stringify(initialState), [state, initialState])

  function update<K extends keyof AdminSettingsState>(key: K, value: AdminSettingsState[K]) {
    setSaved(false)
    setError(null)
    setState((current) => ({ ...current, [key]: value }))
  }

  function save() {
    setError(null)
    startTransition(async () => {
      try {
        const result = await updatePlatformSettings(state)
        setState(result)
        setSaved(true)
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : 'Unable to save settings.')
      }
    })
  }

  const toggleItems = [
    { key: 'requireMfaForAdmins' as const, title: 'Require MFA for administrator accounts', detail: 'Recommended for production operator access.' },
    { key: 'notifyBookingEmail' as const, title: 'Booking notifications', detail: 'Email hosts and operations when booking state changes.' },
    { key: 'notifyVerificationEmail' as const, title: 'Verification notifications', detail: 'Email hosts when verification decisions or change requests are made.' },
    { key: 'notifyPayoutEmail' as const, title: 'Payout notifications', detail: 'Email hosts when payout status changes.' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[28px] border border-[#d9e2dd] bg-white p-5 shadow-[0_12px_36px_rgba(20,55,44,.05)] sm:flex-row sm:items-center sm:justify-between md:p-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#7c8c85]">Configuration control</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-[#183a31]">Platform settings</h2>
          <p className="mt-1 text-sm text-muted-foreground">Centralize the operational defaults used across bookings, verification and notifications.</p>
        </div>
        <Button onClick={save} disabled={pending || !dirty} className="bg-[#183a31] hover:bg-[#183a31]/90">
          {pending ? <Save className="size-4 animate-pulse" /> : <Save className="size-4" />}
          {pending ? 'Saving…' : saved ? 'Saved' : 'Save changes'}
        </Button>
      </div>

      {saved && <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><CheckCircle2 className="mt-0.5 size-4 shrink-0" /> Settings saved to the platform configuration.</div>}
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-[28px] border border-[#d9e2dd] bg-white shadow-sm">
          <div className="border-b border-[#edf1ee] px-5 py-4 md:px-6"><div className="flex items-center gap-3"><CreditCard className="size-5 text-[#2b7a5c]" /><div><h3 className="font-black">Marketplace economics</h3><p className="text-xs text-muted-foreground">Commercial defaults from the MVP operating model.</p></div></div></div>
          <div className="grid gap-4 p-5 md:grid-cols-2 md:p-6">
            <label className="space-y-2 text-sm font-semibold">Platform commission (%)<Input type="number" min="0" max="30" step="0.5" value={state.commissionRate} onChange={(e) => update('commissionRate', Number(e.target.value))} /></label>
            <label className="space-y-2 text-sm font-semibold">Default currency<Input value={state.defaultCurrency} maxLength={3} onChange={(e) => update('defaultCurrency', e.target.value.toUpperCase())} /></label>
            <label className="space-y-2 text-sm font-semibold md:col-span-2">Booking hold duration (minutes)<Input type="number" min="1" max="60" value={state.defaultHoldMinutes} onChange={(e) => update('defaultHoldMinutes', Number(e.target.value))} /><span className="text-xs font-normal text-muted-foreground">The transactional booking flow enforces a 1–60 minute limit.</span></label>
          </div>
        </section>

        <section className="rounded-[28px] border border-[#d9e2dd] bg-white shadow-sm">
          <div className="border-b border-[#edf1ee] px-5 py-4 md:px-6"><div className="flex items-center gap-3"><Globe2 className="size-5 text-[#2b7a5c]" /><div><h3 className="font-black">Cancellation defaults</h3><p className="text-xs text-muted-foreground">Reference windows for flexible, moderate and strict policies.</p></div></div></div>
          <div className="grid gap-4 p-5 md:grid-cols-3 md:p-6">
            <label className="space-y-2 text-sm font-semibold">Flexible (hours)<Input type="number" min="0" value={state.flexibleFreeCancelHours} onChange={(e) => update('flexibleFreeCancelHours', Number(e.target.value))} /></label>
            <label className="space-y-2 text-sm font-semibold">Moderate (hours)<Input type="number" min="0" value={state.moderateFreeCancelHours} onChange={(e) => update('moderateFreeCancelHours', Number(e.target.value))} /></label>
            <label className="space-y-2 text-sm font-semibold">Strict (hours)<Input type="number" min="0" value={state.strictFreeCancelHours} onChange={(e) => update('strictFreeCancelHours', Number(e.target.value))} /></label>
          </div>
        </section>

        <section className="rounded-[28px] border border-[#d9e2dd] bg-white shadow-sm">
          <div className="border-b border-[#edf1ee] px-5 py-4 md:px-6"><div className="flex items-center gap-3"><ShieldCheck className="size-5 text-[#2b7a5c]" /><div><h3 className="font-black">Trust & verification</h3><p className="text-xs text-muted-foreground">Operator expectations while preserving the audit trail.</p></div></div></div>
          <div className="space-y-4 p-5 md:p-6"><label className="space-y-2 text-sm font-semibold">Verification SLA (hours)<Input type="number" min="1" value={state.verificationSlaHours} onChange={(e) => update('verificationSlaHours', Number(e.target.value))} /></label><div className="rounded-2xl bg-[#f4f8f5] p-4 text-xs leading-5 text-[#5d6e67]">Government registration remains distinct from platform verification and must never be presented as government endorsement.</div></div>
        </section>

        <section className="rounded-[28px] border border-[#d9e2dd] bg-white shadow-sm">
          <div className="border-b border-[#edf1ee] px-5 py-4 md:px-6"><div className="flex items-center gap-3"><Bell className="size-5 text-[#2b7a5c]" /><div><h3 className="font-black">Notifications</h3><p className="text-xs text-muted-foreground">Operational notification preferences.</p></div></div></div>
          <div className="space-y-2 p-5 md:p-6">{toggleItems.map(({ key, title, detail }) => <label key={key} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#edf1ee] p-4 transition hover:bg-[#fafcf9]"><input type="checkbox" checked={state[key]} onChange={(e) => update(key, e.target.checked)} className="mt-1 size-4 accent-[#2b7a5c]" /><span><span className="block text-sm font-semibold">{title}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{detail}</span></span></label>)}</div>
        </section>

        <section className="rounded-[28px] border border-[#d9e2dd] bg-white shadow-sm xl:col-span-2">
          <div className="border-b border-[#edf1ee] px-5 py-4 md:px-6"><div className="flex items-center gap-3"><LockKeyhole className="size-5 text-[#2b7a5c]" /><div><h3 className="font-black">Security baseline</h3><p className="text-xs text-muted-foreground">Administrative controls to validate before production launch.</p></div></div></div>
          <div className="grid gap-3 p-5 md:grid-cols-3 md:p-6"><div className="rounded-2xl bg-[#f7f9f7] p-4"><Settings2 className="size-4 text-[#2b7a5c]" /><p className="mt-2 text-sm font-bold">RBAC enforced</p><p className="mt-1 text-xs text-muted-foreground">Admin pages require ADMIN or SUPER_ADMIN.</p></div><div className="rounded-2xl bg-[#f7f9f7] p-4"><ShieldCheck className="size-4 text-[#2b7a5c]" /><p className="mt-2 text-sm font-bold">Audit-ready verification</p><p className="mt-1 text-xs text-muted-foreground">Verification decisions record the operator identity.</p></div><div className="rounded-2xl bg-[#f7f9f7] p-4"><LockKeyhole className="size-4 text-[#2b7a5c]" /><p className="mt-2 text-sm font-bold">Session controls</p><p className="mt-1 text-xs text-muted-foreground">Use MFA and session policy before production admin access.</p></div></div>
        </section>
      </div>
    </div>
  )
}
