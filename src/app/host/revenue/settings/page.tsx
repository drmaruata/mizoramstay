import Link from 'next/link'
import { ArrowLeft, CalendarClock, CheckCircle2, CircleAlert, WalletCards } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PortalShell } from '@/components/host/portal-shell'
import { HostPayoutService } from '@/features/payments/host-payout.service'
import { HostSettlementService } from '@/features/payments/host-settlement.service'
import { requireHost } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { PayoutSettingsForm } from './PayoutSettingsForm'

export const dynamic = 'force-dynamic'

function formatINR(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`
}

function formatSettlementDate(value: string | null) {
  if (!value) return 'Next 5th or 15th'
  return new Date(`${value}T00:00:00+05:30`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function HostPayoutSettingsPage() {
  await requireHost()
  const db = await createClient()
  const service = new HostPayoutService(db)
  const settlements = new HostSettlementService(db)
  const hostId = await service.getHostProfileId()

  if (!hostId) {
    return <PortalShell><Card className="mx-auto max-w-[900px] rounded-[28px]"><CardContent className="p-8 text-center"><CircleAlert className="mx-auto size-10 text-[#9a651e]" /><p className="mt-3 text-lg font-black">Host profile required</p><p className="mt-1 text-sm text-muted-foreground">Complete your host profile before configuring settlement details.</p></CardContent></Card></PortalShell>
  }

  const [settings, summary, settlementSummary] = await Promise.all([service.getSettings(hostId), service.getSummary(hostId), settlements.getHostSettlementSummary(hostId)])
  const queuedValue = summary.pending + summary.scheduled

  return (
    <PortalShell>
      <div className="mx-auto w-full max-w-[1240px] space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Link href="/host/revenue"><Button variant="ghost" size="sm" className="mt-1 rounded-xl text-[#17332e]"><ArrowLeft className="size-4" /> Revenue</Button></Link>
            <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#81918a]">Settlement centre</p><h1 className="mt-2 text-3xl font-black tracking-[-.04em] text-[#17332e] sm:text-[40px]">Payout settings</h1><p className="mt-2 text-sm leading-6 text-[#66776f]">Manage the bank account used for settlement. Host earnings are paid automatically twice each month.</p></div>
          </div>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['Pending', summary.pending, 'Eligible earnings awaiting the next settlement date'],
            ['Scheduled', summary.scheduled, 'Grouped for an upcoming 5th or 15th settlement'],
            ['Processing', summary.processing, 'Settlement transfer in progress'],
            ['Paid', summary.paid, 'Successfully settled host earnings'],
          ].map(([label, value, sub]) => <Card key={String(label)} className="rounded-[24px] border-[#d6ded9] shadow-[0_8px_24px_rgba(21,70,55,.04)]"><CardContent className="p-5"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#83918b]">{label}</p><p className="mt-2 text-3xl font-black text-[#17332e]">{formatINR(Number(value))}</p><p className="mt-1 text-xs text-[#708078]">{sub}</p></CardContent></Card>)}
        </section>

        <PayoutSettingsForm settings={settings} />

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-[24px] border-[#d8e1dc]"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><WalletCards className="size-4 text-[#154637]" /> Lifetime host earnings</CardTitle></CardHeader><CardContent><p className="text-2xl font-black text-[#17332e]">{formatINR(summary.net)}</p><p className="mt-1 text-xs text-muted-foreground">Net settlement ledger after the recorded platform fee.</p></CardContent></Card>
          <Card className="rounded-[24px] border-[#d8e1dc]"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><CalendarClock className="size-4 text-[#154637]" /> Settlement calendar</CardTitle></CardHeader><CardContent><p className="text-2xl font-black text-[#17332e]">5th & 15th</p><p className="mt-1 text-xs text-muted-foreground">Next settlement: {formatSettlementDate(settlementSummary.nextSettlementDate)}.</p></CardContent></Card>
          <Card className="rounded-[24px] border-[#d8e1dc] bg-[#edf4ef]"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><CheckCircle2 className="size-4 text-[#2b7a5c]" /> Automatic settlement</CardTitle></CardHeader><CardContent><p className="text-2xl font-black text-[#17332e]">Enabled</p><p className="mt-1 text-xs text-muted-foreground">Verified eligible earnings are grouped into the next 5th or 15th cycle.</p></CardContent></Card>
        </div>

        {queuedValue > 0 ? <p className="text-xs text-muted-foreground">Current host queue contains {formatINR(queuedValue)} awaiting a settlement cycle.</p> : null}
      </div>
    </PortalShell>
  )
}
