import Link from 'next/link'
import { ArrowUpRight, Banknote, CalendarDays, IndianRupee, Percent, WalletCards } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PortalShell } from '@/components/host/portal-shell'
import { HostPayoutService } from '@/features/payments/host-payout.service'
import { HostSettlementService } from '@/features/payments/host-settlement.service'
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

function formatSettlementDate(value: string | null) {
  if (!value) return 'Next 5th or 15th'
  return new Date(`${value}T00:00:00+05:30`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function statusVariant(status: string) {
  if (status === 'PAID') return 'default' as const
  if (status === 'FAILED' || status === 'CANCELLED') return 'destructive' as const
  return 'secondary' as const
}

export default async function HostRevenuePage() {
  await requireHost()
  const db = await (await import('@/lib/supabase/server')).createClient()
  const payoutService = new HostPayoutService(db)
  const settlementService = new HostSettlementService(db)
  const hostId = await payoutService.getHostProfileId()

  const summary = hostId
    ? await payoutService.getRevenueSummary(hostId)
    : { currentMonthGross: 0, previousMonthGross: 0, currentMonthCommission: 0, currentMonthNet: 0, pendingPayout: 0, scheduledPayout: 0, paidPayout: 0, payoutRows: [] }
  const settlementSummary = hostId ? await settlementService.getHostSettlementSummary(hostId) : { batches: [], nextSettlementDate: null, scheduled: 0, paid: 0, processing: 0, failed: 0 }

  const grossDelta = summary.previousMonthGross > 0 ? Math.round(((summary.currentMonthGross - summary.previousMonthGross) / summary.previousMonthGross) * 100) : null
  const payoutReady = summary.pendingPayout + summary.scheduledPayout

  return (
    <PortalShell>
      <div className="mx-auto w-full max-w-[1240px] space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#81918a]">Payouts & earnings</p><h1 className="mt-2 text-3xl font-black tracking-[-.04em] text-[#17332e] sm:text-[40px]">Revenue</h1><p className="mt-2 text-sm leading-6 text-[#66776f]">Track booking value, host fees, settlement batches and bank-transfer status.</p></div>
          <Link href="/host/revenue/settings"><Button variant="outline" className="rounded-xl border-[#d7dfda] bg-white text-[#17332e] hover:bg-[#f7faf7] hover:text-[#17332e]"><Banknote className="size-4" /> Payout settings</Button></Link>
        </div>

        {!hostId ? (
          <Card className="rounded-[28px] border-[#d6ded9] shadow-sm"><CardContent className="p-8 text-center"><WalletCards className="mx-auto size-8 text-[#59736a]" /><p className="mt-3 font-bold text-[#17332e]">Complete your host setup to view earnings.</p><Link href="/host/properties" className="mt-4 inline-flex rounded-xl bg-[#154637] px-4 py-2.5 text-sm font-bold text-white">Manage properties</Link></CardContent></Card>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Revenue summary">
              <Card className="rounded-[24px] border-[#d6ded9]"><CardContent className="p-5 md:p-6"><div className="flex items-center justify-between"><span className="rounded-xl bg-[#e8efe9] p-2 text-[#1b5d47]"><WalletCards className="size-4" /></span><span className="text-[10px] font-bold uppercase text-[#82908a]">{monthLabel()}</span></div><p className="mt-5 text-xs text-muted-foreground">Gross host earnings</p><p className="mt-1 flex items-center text-3xl font-black text-[#17332e]"><IndianRupee className="size-6" />{Math.round(summary.currentMonthGross).toLocaleString('en-IN')}</p><p className="mt-1 text-xs text-[#2b7a5c]">{grossDelta == null ? 'First recorded month' : `${grossDelta >= 0 ? '+' : ''}${grossDelta}% vs last month`}</p></CardContent></Card>
              <Card className="rounded-[24px] border-[#d6ded9]"><CardContent className="p-5 md:p-6"><div className="flex items-center justify-between"><span className="rounded-xl bg-[#fbefd9] p-2 text-[#9a651e]"><Percent className="size-4" /></span><span className="text-[10px] font-bold uppercase text-[#82908a]">Recorded</span></div><p className="mt-5 text-xs text-muted-foreground">Platform fee</p><p className="mt-1 text-3xl font-black text-[#17332e]">{formatINR(Math.round(summary.currentMonthCommission))}</p><p className="mt-1 text-xs text-muted-foreground">Frozen on each host earning</p></CardContent></Card>
              <Card className="rounded-[24px] border-[#d6ded9]"><CardContent className="p-5 md:p-6"><div className="flex items-center justify-between"><span className="rounded-xl bg-[#e7edf4] p-2 text-[#3d5871]"><ArrowUpRight className="size-4" /></span><span className="text-[10px] font-bold uppercase text-[#82908a]">Next cycle</span></div><p className="mt-5 text-xs text-muted-foreground">Available for settlement</p><p className="mt-1 text-3xl font-black text-[#17332e]">{formatINR(Math.round(payoutReady))}</p><p className="mt-1 text-xs text-muted-foreground">Next: {formatSettlementDate(settlementSummary.nextSettlementDate)}</p></CardContent></Card>
              <Card className="rounded-[24px] border-[#d6ded9] bg-[#154637] text-white"><CardContent className="p-5 md:p-6"><div className="flex items-center justify-between"><span className="rounded-xl bg-white/10 p-2 text-white"><Banknote className="size-4" /></span><span className="text-[10px] font-bold uppercase text-white/55">Settlement calendar</span></div><p className="mt-5 text-xs text-white/65">Automatic bank settlement</p><p className="mt-1 text-3xl font-black">5th & 15th</p><p className="mt-1 text-xs text-white/65">Paid to date: {formatINR(Math.round(summary.paidPayout))}</p></CardContent></Card>
            </section>

            <Card className="rounded-[28px] border-[#d6ded9] bg-[#f7f2e7]"><CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#8a7860]">Next automatic settlement</p><p className="mt-1 text-lg font-black text-[#17332e]">{formatSettlementDate(settlementSummary.nextSettlementDate)}</p><p className="mt-1 text-xs text-[#6e6251]">Eligible completed-stay earnings are grouped into one host settlement and transferred to the verified bank account.</p></div><Link href="/host/revenue/settings"><Button className="rounded-xl bg-[#154637] text-white hover:bg-[#103b2f]">Manage bank account</Button></Link></CardContent></Card>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <Card className="rounded-[28px] border-[#d6ded9]"><CardHeader className="border-b border-[#edf0ed] px-5 pb-4 pt-5 md:px-6 md:pt-6"><div className="flex items-center justify-between gap-3"><div><CardTitle className="text-xl text-[#17332e]">Earning statement</CardTitle><p className="mt-1 text-xs text-muted-foreground">Each booking earning shows the fee rate fixed when the earning was recorded.</p></div><span className="text-xs font-semibold text-[#708079]">{summary.payoutRows.length} record{summary.payoutRows.length === 1 ? '' : 's'}</span></div></CardHeader><CardContent className="p-0">{summary.payoutRows.length === 0 ? <div className="grid min-h-52 place-items-center p-8 text-center"><div><span className="mx-auto grid size-11 place-items-center rounded-2xl bg-[#eaf2ed] text-[#154637]"><WalletCards className="size-5" /></span><p className="mt-3 text-sm font-bold text-[#17332e]">No host earnings yet</p><p className="mt-1 text-sm text-[#7c8984]">Host earning records are created when guest payments are confirmed.</p></div></div> : <div className="divide-y divide-[#e8ede9]">{summary.payoutRows.map((row) => <div key={row.id} className="p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-black text-[#17332e]">{row.bookingReference}</p><Badge variant={statusVariant(row.status)}>{row.status.replace(/_/g, ' ')}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{row.propertyName} · {row.checkIn} → {row.checkOut}</p></div><div className="flex items-center gap-4"><div className="text-right"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#82908a]">Host net</p><p className="font-black text-[#17332e]">{formatINR(Math.round(row.netAmount))}</p></div><div className="grid size-10 place-items-center rounded-xl bg-[#f3f6f3] text-[#59736a]"><CalendarDays className="size-4" /></div></div></div><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"><Metric label="Gross" value={formatINR(Math.round(row.grossAmount))} /><Metric label="Platform fee" value={formatINR(Math.round(row.platformCommission))} /><Metric label="Adjustments" value={formatINR(Math.round(row.refundAdjustment))} /><Metric label="Scheduled" value={formatDate(row.paidAt ?? row.scheduledAt)} /></div></div>)}</div>}</CardContent></Card>
              <Card className="rounded-[28px] border-[#d6ded9]"><CardHeader><CardTitle className="text-xl text-[#17332e]">Settlement status</CardTitle></CardHeader><CardContent className="space-y-3"><StatusRow label="Scheduled" value={settlementSummary.scheduled} /><StatusRow label="Processing" value={settlementSummary.processing} /><StatusRow label="Paid" value={settlementSummary.paid} /><StatusRow label="Failed" value={settlementSummary.failed} /></CardContent></Card>
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
  return <div className="flex items-center justify-between rounded-2xl bg-[#f7f9f7] px-4 py-3"><span className="text-sm font-semibold text-[#53665f]">{label}</span><span className="font-black text-[#17332e]">{formatINR(Math.round(value))}</span></div>
}
