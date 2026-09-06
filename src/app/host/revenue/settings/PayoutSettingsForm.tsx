'use client'

import { useActionState } from 'react'
import { Building2, CheckCircle2, Landmark, ShieldCheck } from 'lucide-react'
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
              <div><p className="text-sm font-black text-[#17332e]">Bank account</p><p className="mt-1 text-xs leading-5 text-[#6c7d75]">Your bank details are sent to RazorpayX for account validation. MizoramStay stores only the last four digits and provider identifiers.</p></div>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${configured ? 'bg-[#e6f2ea] text-[#21684e]' : 'bg-[#fbefd9] text-[#94621b]'}`}>{statusLabel}</span>
          </div>

          {configured && settings.bankAccountLast4 ? (
            <div className="mt-5 flex items-center justify-between rounded-2xl border border-[#dfe7e2] bg-[#f8faf8] p-4">
              <div><p className="text-sm font-bold text-[#17332e]">{settings.bankName || 'Verified bank account'}</p><p className="mt-1 text-xs text-[#71817a]">•••• {settings.bankAccountLast4} · {settings.ifscCode}</p><p className="mt-1 text-xs text-[#71817a]">Beneficiary: {settings.beneficiaryName}</p></div>
              <ShieldCheck className="size-5 text-[#2f8a67]" />
            </div>
          ) : null}

          <form action={action} className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5"><span className="text-xs font-bold text-[#4e6259]">Beneficiary name</span><Input required name="beneficiaryName" defaultValue={settings.beneficiaryName ?? ''} placeholder="Name as per bank account" /></label>
            <label className="space-y-1.5"><span className="text-xs font-bold text-[#4e6259]">Bank name</span><Input required name="bankName" defaultValue={settings.bankName ?? ''} placeholder="e.g. SBI" /></label>
            <label className="space-y-1.5"><span className="text-xs font-bold text-[#4e6259]">Account number</span><Input required name="accountNumber" inputMode="numeric" autoComplete="off" minLength={6} maxLength={20} pattern="[0-9]{6,20}" placeholder={configured ? 'Enter again to replace account' : '6–20 digits'} /></label>
            <label className="space-y-1.5"><span className="text-xs font-bold text-[#4e6259]">IFSC code</span><Input required name="ifscCode" defaultValue={settings.ifscCode ?? ''} className="uppercase" maxLength={11} placeholder="e.g. SBIN0001234" /></label>
            <label className="space-y-1.5 sm:col-span-2"><span className="text-xs font-bold text-[#4e6259]">Payout delay after checkout</span><select name="payoutDelayDays" defaultValue={settings.payoutDelayDays} className="h-10 w-full rounded-xl border border-[#d6dfda] bg-white px-3 text-sm text-[#17332e] outline-none focus:ring-2 focus:ring-[#0f5a45]/20"><option value="0">Same day eligibility</option><option value="1">1 day after checkout</option><option value="2">2 days after checkout</option><option value="3">3 days after checkout</option><option value="7">7 days after checkout</option></select></label>
            <label className="sm:col-span-2 flex items-center gap-3 rounded-2xl border border-[#e0e7e2] bg-[#fafcf9] p-3.5"><input type="checkbox" name="autoPayout" defaultChecked={settings.autoPayout} className="size-4 accent-[#0f5a45]" /><span><span className="block text-sm font-bold text-[#17332e]">Automatically release eligible payouts</span><span className="block text-xs text-[#71817a]">The hourly settlement worker will send eligible payouts after the configured delay.</span></span></label>
            <div className="sm:col-span-2 flex flex-col gap-3 rounded-2xl bg-[#edf4ef] p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 size-4 text-[#2b7a5c]" /><p className="text-xs leading-5 text-[#536760]">Changing your bank account starts a new validation. Payouts remain blocked until the new fund account is active.</p></div><Button disabled={pending} type="submit" className="shrink-0 rounded-xl bg-[#154637] text-white hover:bg-[#103b2f]">{pending ? 'Validating…' : configured ? 'Replace account' : 'Save & validate'}</Button></div>
            {state.message ? <p className={`sm:col-span-2 rounded-xl px-3 py-2.5 text-sm ${state.ok ? 'bg-[#e7f1ea] text-[#21684e]' : 'bg-red-50 text-red-700'}`}>{state.message}</p> : null}
          </form>
        </div>

        <div className="space-y-4">
          <div className="rounded-[24px] border border-[#d8e1dc] bg-[#154637] p-5 text-white">
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/55">How settlement works</p>
            <div className="mt-4 space-y-4">
              {[['01','Guest pays','Payment is captured and the host payout is created.'],['02','Stay completes','The booking must reach Completed status.'],['03','Eligibility','The configured post-checkout delay expires.'],['04','Bank transfer','RazorpayX initiates the IMPS payout and sends status webhooks.']].map(([n,t,d]) => <div key={n} className="flex gap-3"><span className="text-[10px] font-black text-[#e4b35b]">{n}</span><div><p className="text-sm font-bold">{t}</p><p className="mt-1 text-xs leading-5 text-white/65">{d}</p></div></div>)}
            </div>
          </div>
          <div className="rounded-[24px] border border-[#d8e1dc] bg-[#fbf5e8] p-5"><div className="flex items-center gap-2 text-[#9a651e]"><Building2 className="size-4" /><p className="text-[10px] font-bold uppercase tracking-[.18em]">Provider</p></div><p className="mt-2 text-sm font-black text-[#4d402e]">RazorpayX Payouts</p><p className="mt-1 text-xs leading-5 text-[#6e6251]">Bank account validation and actual IMPS/NEFT/RTGS transfers are handled by the payment provider. API access requires an activated RazorpayX account and IP allowlisting.</p></div>
        </div>
      </div>
    </div>
  )
}
