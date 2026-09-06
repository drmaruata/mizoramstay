import Link from 'next/link'
import { ArrowDownRight, ArrowUpRight, Banknote, CalendarDays, IndianRupee, Percent, WalletCards } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PortalShell } from '@/components/host/portal-shell'
import { HostPayoutService } from '@/features/payments/host-payout.service'
import { formatINR } from '@/lib/utils'
import { requireHost } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

function monthLabel(date = new Date()) {
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

function formatDate(value: string | null) {
  if (!value) return 'Not scheduled'
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function statusVariant(status: string) {
  if (status === 'PAID') return 'default' as const
  if (status === 'FAILED' || status === 'CANCELLED') return 'destructive' as const
  return 'secondary' as const
}

export default async function HostRevenuePage() {
  const user = await requireHost()
  const db = await (await import('@/lib/supabase/server')).createClient()
  const payoutService = new HostPayoutService(db)
  const hostId = await payoutService.getHostProfileId()

  const summary = hostId
    ? await payoutService.getRevenueSummary(hostId)
    : { currentMonthGross: 0, previousMonthGross: 0, currentMonthCommission: 0, currentMonthNet: 0, pendingPayout: 0, scheduledPayout: 0, paidPayout: 0, payoutRows: [] }

  const grossDelta = summary.previousMonthGross > 0
    ? Math.round(((summary.currentMonthGross - summary.previousMonthGross) / summary.previousMonthGross) * 100)
    : null
  const payoutReady = summary.pendingPayout + summary.scheduledPayout
  const hostLabel = user.email?.split('@')[0] ?? 'Host'

  return (
    <PortalShell>
      <div className="mx-auto w-full max-w-[1240px] space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#81918a]">Payouts & earnings</p><h1 className="mt-2 text-3xl font-black tracking-[-.04em] text-[#17332e] sm:text-[40px]">Revenue</h1><p className="mt-2 text-sm leading-6 text-[#66776f]">Track booking value, commission, payout status and settlement history for your properties.</p></div>
          <Link href="/host/revenue/settings"><Button variant="outline" className="rounded-xl border-[#d7dfda] bg-white text-[#17332e] hover:bg-[#f7faf7] hover:text-[#17332e]"><Banknote className="size-4" /> Payout settings</Button></Link>
        </div>

        {!hostId ? (
          <Card className="rounded-[28px] border-[#d6ded9] shadow-sm"><CardContent className="p-8 text-center"><WalletCards className="mx-auto size-8 text-[#59736a]" /><p className="mt-3 font-bold text-[#17332e]">Complete your host setup to view earnings.</p><Link href="/host/properties" className="mt-4 inline-flex rounded-xl bg-[#154637] px-4 py-2.5 text-sm font-bold text-white">Manage properties</Link></CardContent></Card>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Revenue summary">
              <Card className="rounded-[24px] border-[#d6ded9] shadow-[0_8px_24px_rgba(21,70,55,.04)]"><CardContent className="p-5 md:p-6"><div className="flex items-center justify-between"><span className="rounded-xl bg-[#e8efe9] p-2 text-[#1b5d47]"><WalletCards className="size-4" /></span><span className="text-[10px] font-bold uppercase text-[#82908a]">{monthLabel()}</span></div><p className="mt-5 text-xs text-muted-foreground">Gross bookings</p><p className="mt-1 flex items-center text-3xl font-black text-[#17332e]"><IndianRupee className="size-6" />{Math.round(summary.currentMonthGross).toLocaleString('en-IN')}</p><p className={`mt-1 text-xs ${grossDelta != null && grossDelta < 0 ? 'text-[#9a651e]' : 'text-[#2b7a5c]'}`}>{grossDelta == null ? 'First recorded month' : `${grossDelta >= 0 ? '+' : ''}${grossDelta}% vs last month`}</p></CardContent></Card>
              <Card className="rounded-[24px] border-[#d6ded9] shadow-[0_8px_24px_rgba(21,70,55,.04)]"><CardContent className="p-5 md:p-6"><div className="flex items-center justify-between"><span className="rounded-xl bg-[#fbefd9] p-2 text-[#9a651e]"><Percent className="size-4" /></span><span className="text-[10px] font-bold uppercase text-[#82908a]">Applied</span></div><p className="mt-5 text-xs text-muted-foreground">Platform commission</p><p className="mt-1 flex items-center text-3xl font-black text-[#17332e]">{formatINR(Math.round(summary.currentMonthCommission))}</p><p className="mt-1 text-xs text-muted-foreground">Recorded against current-month payouts</p></CardContent></Card>
              <Card className="rounded-[24px] border-[#d6ded9] shadow-[0_8px_24px_rgba(21,70,55,.04)]"><CardContent className="p-5 md:p-6"><div className="flex items-center justify-between"><span className="rounded-xl bg-[#e7edf4] p-2 text-[#3d5871]"><ArrowUpRight className="size-4" /></span><span className="text-[10px] font-bold uppercase text-[#82908a]">Net</span></div><p className="mt-5 text-xs text-muted-foreground">Current-month host earnings</p><p className="mt-1 flex items-center text-3xl font-black text-[#17332e]">{formatINR(Math.round(summary.currentMonthNet))}</p><p className="mt-1 text-xs text-[#2b7a5c]">After recorded platform commission</p></CardContent></Card>
              <Card className="rounded-[24px] border-[#d6ded9] bg-[#154637] text-white shadow-[0_12px_28px_rgba(21,70,55,.12)]"><CardContent className="p-5 md:p-6"><div className="flex items-center justify-between"><span className="rounded-xl bg-white/10 p-2 text-white"><Banknote className="size-4" /></span><span className="text-[10px] font-bold uppercase text-white/55">Awaiting payout</span></div><p className="mt-5 text-xs text-white/65">Pending + scheduled</p><p className="mt-1 text-3xl font-black">{formatINR(Math.round(payoutReady))}</p><p className="mt-1 text-xs text-white/65">Paid to date: {formatINR(Math.round(summary.paidPayout))}</p></CardContent></Card>
            </section>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <Card className="rounded-[28px] border-[#d6ded9] shadow-[0_8px_26px_rgba(21,70,55,.045)]"><CardHeader className="border-b border-[#edf0ed] px-5 pb-4 pt-5 md:px-6 md:pt-6"><div className="flex items-center justify-between gap-3"><div><CardTitle className="text-xl text-[#17332e]">Payout statement</CardTitle><p className="mt-1 text-xs text-muted-foreground">Every payout is linked to a booking and property.</p></div><span className="text-xs font-semibold text-[#708079]">{summary.payoutRows.length} record{summary.payoutRows.length === 1 ? '' : 's'}</span></div></CardHeader><CardContent className="p-0">{summary.payoutRows.length === 0 ? <div className="grid min-h-52 place-items-center p-8 text-center"><div><span className="mx-auto grid size-11 place-items-center rounded-2xl bg-[#eaf2ed] text-[#154637]"><WalletCards className="size-5" /></span><p className="mt-3 text-sm font-bold text-[#17332e]">No payout records yet</p><p className="mt-1 text-sm text-[#7c8984]">Payout records are created when paid bookings are confirmed.</p></div></div> : <div className="divide-y divide-[#e8ede9]">{summary.payoutRows.map((row) => <div key={row.id} className="p-5 transition hover:bg-[#fbfcfa]"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-black text-[#17332e]">{row.bookingReference}</p><Badge variant={statusVariant(row.status)}>{row.status.replace(/_/g, ' ')}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{row.propertyName} · {row.checkIn} → {row.checkOut}</p></div><div className="flex items-center gap-4"><div className="text-right"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#82908a]">Host net</p><p className="font-black text-[#17332e]">{formatINR(Math.round(row.netAmount))}</p></div><div className="grid size-10 place-items-center rounded-xl bg-[#f3f6f3] text-[#59736a]"><CalendarDays className="size-4" /></div></div></div><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"><Metric label="Gross" value={formatINR(Math.round(row.grossAmount))} /><Metric label="Commission" value={formatINR(Math.round(row.platformCommission))} /><Metric label="Adjustments" value={formatINR(Math.round(row.refundAdjustment))} /><Metric label="Settlement" value={formatDate(row.paidAt ?? row.scheduledAt)} /></div></div>)}</div>}</CardContent></Card>
              <div className="space-y-6"><Card className="rounded-[28px] border-[#d6ded9] bg-[#f7f2e7] shadow-[0_8px_26px_rgba(21,70,55,.045)]"><CardHeader><CardTitle className="text-xl text-[#17332e]">Payout status</CardTitle></CardHeader><CardContent className="space-y-4"><StatusRow label="Pending" value={summary.pendingPayout} /><StatusRow label="Scheduled" value={summary.scheduledPayout} /><StatusRow label="Paid" value={summary.paidPayout} /></CardContent></Card></div>
            </div>
          </>
        )}
      </div>
    </PortalShell>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-[#f7f9f6] px-3 py-2"><p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#8a9892]">{label}</p><p className="mt-1 text-xs font-bold text-[#354f46]">{value}</p></div>
}

function StatusRow({ label, value }: { label: string; value: number }) {
  return <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3"><span className="text-sm font-semibold text-[#53665f]">{label}</span><span className="font-black text-[#17332e]">{formatINR(Math.round(value))}</span></div>
}
