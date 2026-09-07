'use client'

import { useActionState } from 'react'
import { Building2, CalendarDays, CheckCircle2, CircleAlert, Landmark, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { saveHostPayoutSettings, type PayoutSettingsState } from './actions'

const initialState: PayoutSettingsState = { ok: false, message: '' }

type Props = {
  settings: {
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
}

export function PayoutSettingsForm({ settings }: Props) {
  const [state, action, pending] = useActionState(saveHostPayoutSettings, initialState)
  const configured = settings.status === 'ACTIVE'
  const statusLabel = settings.status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-[24px] border border-[#d8e1dc] bg-white p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-[#e7f1ea] text-[#155b45]"><Landmark className="size-5" /></span>
              <div><p className="text-sm font-black text-[#17332e]">Bank account</p><p className="mt-1 text-xs leading-5 text-[#6c7d75]">Your bank details are validated by RazorpayX. MizoramStay stores only the last four digits and provider identifiers.</p></div>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${configured ? 'bg-[#e6f2ea] text-[#21684e]' : settings.status === 'ACTION_REQUIRED' ? 'bg-red-50 text-red-700' : 'bg-[#fbefd9] text-[#94621b]'}`}>{statusLabel}</span>
          </div>

          {settings.status === 'ACTION_REQUIRED' && settings.failureReason ? <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-red-800"><CircleAlert className="mt-0.5 size-4 shrink-0" /><div><p className="text-sm font-bold">Bank validation needs attention</p><p className="mt-1 text-xs leading-5">{settings.failureReason}</p></div></div> : null}

          {settings.status === 'UNDER_REVIEW' ? <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#eadfbe] bg-[#fffaf0] p-4 text-[#7b5a1f]"><CircleAlert className="mt-0.5 size-4 shrink-0" /><div><p className="text-sm font-bold">Validation is still in progress</p><p className="mt-1 text-xs leading-5">RazorpayX has accepted the validation request. Settlements remain blocked until the provider confirms the account.</p>{settings.validationUtr ? <p className="mt-1 text-[11px] font-semibold">Validation UTR: {settings.validationUtr}</p> : null}</div></div> : null}

          {configured && settings.bankAccountLast4 ? <div className="mt-5 flex items-center justify-between rounded-2xl border border-[#dfe7e2] bg-[#f8faf8] p-4"><div><p className="text-sm font-bold text-[#17332e]">{settings.bankName || 'Verified bank account'}</p><p className="mt-1 text-xs text-[#71817a]">•••• {settings.bankAccountLast4} · {settings.ifscCode}</p><p className="mt-1 text-xs text-[#71817a]">Beneficiary: {settings.beneficiaryName}</p></div><ShieldCheck className="size-5 text-[#2f8a67]" /></div> : null}

          <form action={action} className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5"><span className="text-xs font-bold text-[#4e6259]">Beneficiary name</span><Input required name="beneficiaryName" defaultValue={settings.beneficiaryName ?? ''} placeholder="Name as per bank account" /></label>
            <label className="space-y-1.5"><span className="text-xs font-bold text-[#4e6259]">Bank name</span><Input required name="bankName" defaultValue={settings.bankName ?? ''} placeholder="e.g. SBI" /></label>
            <label className="space-y-1.5"><span className="text-xs font-bold text-[#4e6259]">Account number</span><Input required name="accountNumber" inputMode="numeric" autoComplete="off" minLength={6} maxLength={20} pattern="[0-9]{6,20}" placeholder={configured ? 'Enter again to replace account' : '6–20 digits'} /></label>
            <label className="space-y-1.5"><span className="text-xs font-bold text-[#4e6259]">IFSC code</span><Input required name="ifscCode" defaultValue={settings.ifscCode ?? ''} className="uppercase" maxLength={11} placeholder="e.g. SBIN0001234" /></label>
            <div className="sm:col-span-2 rounded-2xl border border-[#dfe7e2] bg-[#f8faf8] p-4"><div className="flex items-start gap-3"><CalendarDays className="mt-0.5 size-4 shrink-0 text-[#155b45]" /><div><p className="text-sm font-bold text-[#17332e]">Automatic settlement schedule</p><p className="mt-1 text-xs leading-5 text-[#71817a]">Eligible host earnings are settled automatically on the <span className="font-bold text-[#536760]">5th and 15th of every month</span>. The schedule is fixed platform-wide.</p></div></div></div>
            <div className="sm:col-span-2 flex flex-col gap-3 rounded-2xl bg-[#edf4ef] p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 size-4 text-[#2b7a5c]" /><p className="text-xs leading-5 text-[#536760]">Bank validation is required before any automatic settlement can be released.</p></div><Button disabled={pending} type="submit" className="shrink-0 rounded-xl bg-[#154637] text-white hover:bg-[#103b2f]">{pending ? 'Validating…' : configured ? 'Replace account' : 'Save & validate'}</Button></div>
            {state.message ? <p className={`sm:col-span-2 rounded-xl px-3 py-2.5 text-sm ${state.ok ? 'bg-[#e7f1ea] text-[#21684e]' : 'bg-red-50 text-red-700'}`}>{state.message}</p> : null}
          </form>
        </div>

        <div className="space-y-4">
          <div className="rounded-[24px] border border-[#d8e1dc] bg-[#154637] p-5 text-white">
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/55">How settlement works</p>
            <div className="mt-4 space-y-4">
              {[['01','Guest pays','Payment is captured and the host earning is recorded.'],['02','Stay completes','The booking must reach Completed status before earnings become payable.'],['03','Settlement date','Eligible earnings are grouped on the next 5th or 15th of the month.'],['04','Bank transfer','MizoramStay sends one consolidated RazorpayX payout to your verified bank account.']].map(([n,t,d]) => <div key={n} className="flex gap-3"><span className="text-[10px] font-black text-[#e4b35b]">{n}</span><div><p className="text-sm font-bold">{t}</p><p className="mt-1 text-xs leading-5 text-white/65">{d}</p></div></div>)}
            </div>
          </div>
          <div className="rounded-[24px] border border-[#d8e1dc] bg-[#fbf5e8] p-5"><div className="flex items-center gap-2 text-[#9a651e]"><Building2 className="size-4" /><p className="text-[10px] font-bold uppercase tracking-[.18em]">Provider</p></div><p className="mt-2 text-sm font-black text-[#4d402e]">RazorpayX Payouts</p><p className="mt-1 text-xs leading-5 text-[#6e6251]">RazorpayX validates the bank account and executes the settlement transfer. MizoramStay controls the settlement calendar and platform fee.</p></div>
        </div>
      </div>
    </div>
  )
}
