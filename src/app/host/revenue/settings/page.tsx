import Link from 'next/link'
import { ArrowLeft, CalendarClock, CheckCircle2, CircleAlert, WalletCards } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PortalShell } from '@/components/host/portal-shell'
import { HostPayoutService } from '@/features/payments/host-payout.service'
import { requireHost } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { PayoutSettingsForm } from './PayoutSettingsForm'

export const dynamic = 'force-dynamic'

function formatINR(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`
}

export default async function HostPayoutSettingsPage() {
  await requireHost()
  const db = await createClient()
  const service = new HostPayoutService(db)
  const hostId = await service.getHostProfileId()

  if (!hostId) {
    return <PortalShell><Card className="mx-auto max-w-[900px] rounded-[28px]"><CardContent className="p-8 text-center"><CircleAlert className="mx-auto size-10 text-[#9a651e]" /><p className="mt-3 text-lg font-black">Host profile required</p><p className="mt-1 text-sm text-muted-foreground">Complete your host profile before configuring settlement details.</p></CardContent></Card></PortalShell>
  }

  const [settings, summary] = await Promise.all([service.getSettings(hostId), service.getSummary(hostId)])
  const eligibleValue = summary.pending + summary.scheduled

  return (
    <PortalShell>
      <div className="mx-auto w-full max-w-[1240px] space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Link href="/host/revenue"><Button variant="ghost" size="sm" className="mt-1 rounded-xl text-[#17332e]"><ArrowLeft className="size-4" /> Revenue</Button></Link>
            <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#81918a]">Settlement centre</p><h1 className="mt-2 text-3xl font-black tracking-[-.04em] text-[#17332e] sm:text-[40px]">Payout settings</h1><p className="mt-2 text-sm leading-6 text-[#66776f]">Set the bank account used for host settlements and control automatic payout timing.</p></div>
          </div>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['Pending', summary.pending, 'Bookings waiting for settlement'],
            ['Scheduled', summary.scheduled, 'Queued for the settlement worker'],
            ['Processing', summary.processing, 'Provider is moving funds'],
            ['Paid', summary.paid, 'Successfully settled payouts'],
          ].map(([label, value, sub]) => <Card key={String(label)} className="rounded-[24px] border-[#d6ded9] shadow-[0_8px_24px_rgba(21,70,55,.04)]"><CardContent className="p-5"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#83918b]">{label}</p><p className="mt-2 text-3xl font-black text-[#17332e]">{formatINR(Number(value))}</p><p className="mt-1 text-xs text-[#708078]">{sub}</p></CardContent></Card>)}
        </section>

        <PayoutSettingsForm settings={settings} />

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-[24px] border-[#d8e1dc]"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><WalletCards className="size-4 text-[#154637]" /> Lifetime host earnings</CardTitle></CardHeader><CardContent><p className="text-2xl font-black text-[#17332e]">{formatINR(summary.net)}</p><p className="mt-1 text-xs text-muted-foreground">Net payout ledger after platform commission and adjustments.</p></CardContent></Card>
          <Card className="rounded-[24px] border-[#d8e1dc]"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><CalendarClock className="size-4 text-[#154637]" /> Current schedule</CardTitle></CardHeader><CardContent><p className="text-2xl font-black text-[#17332e]">{settings.payoutDelayDays} day{settings.payoutDelayDays === 1 ? '' : 's'}</p><p className="mt-1 text-xs text-muted-foreground">After checkout, before payout becomes eligible.</p></CardContent></Card>
          <Card className="rounded-[24px] border-[#d8e1dc] bg-[#edf4ef]"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><CheckCircle2 className="size-4 text-[#2b7a5c]" /> Automation</CardTitle></CardHeader><CardContent><p className="text-2xl font-black text-[#17332e]">{settings.autoPayout ? 'On' : 'Off'}</p><p className="mt-1 text-xs text-muted-foreground">{settings.autoPayout ? 'Eligible payouts are processed automatically.' : 'Payouts remain pending until automation is enabled.'}</p></CardContent></Card>
        </div>

        {eligibleValue > 0 ? <p className="text-xs text-muted-foreground">Current queue contains {formatINR(eligibleValue)} across pending and scheduled payout records.</p> : null}
      </div>
    </PortalShell>
  )
}
