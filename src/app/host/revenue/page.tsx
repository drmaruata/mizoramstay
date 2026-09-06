import { ArrowDownRight, ArrowUpRight, Banknote, CalendarDays, IndianRupee, Percent, WalletCards } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PortalShell } from '@/components/host/portal-shell'

const payouts = [
  ['25 Sep', 'MZ-102611', '₹9,840', 'Scheduled'],
  ['11 Sep', 'MZ-102421', '₹7,520', 'Paid'],
  ['28 Aug', 'MZ-102108', '₹12,600', 'Paid'],
]

export default function HostRevenuePage() {
  return (
    <PortalShell>
      <div className="mx-auto w-full max-w-[1240px] space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#81918a]">Payouts & earnings</p><h1 className="mt-2 text-3xl font-black tracking-[-.04em] text-[#17332e] sm:text-[40px]">Revenue</h1><p className="mt-2 text-sm leading-6 text-[#66776f]">Understand what you booked, what MizoramStay retained and what reaches you.</p></div>
          <Button variant="outline" className="rounded-xl border-[#d7dfda] bg-white text-[#17332e] hover:bg-[#f7faf7] hover:text-[#17332e]"><Banknote className="size-4" /> Payout settings</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-[24px] border-[#d6ded9] shadow-[0_8px_24px_rgba(21,70,55,.04)]"><CardContent className="p-5 md:p-6"><div className="flex items-center justify-between"><span className="rounded-xl bg-[#e8efe9] p-2 text-[#1b5d47]"><WalletCards className="size-4" /></span><span className="text-[10px] font-bold uppercase text-[#82908a]">This month</span></div><p className="mt-5 text-xs text-muted-foreground">Gross bookings</p><p className="mt-1 flex items-center text-3xl font-black text-[#17332e]"><IndianRupee className="size-6" />48,000</p><p className="mt-1 text-xs text-[#2b7a5c]">+12% vs last month</p></CardContent></Card>
          <Card className="rounded-[24px] border-[#d6ded9] shadow-[0_8px_24px_rgba(21,70,55,.04)]"><CardContent className="p-5 md:p-6"><div className="flex items-center justify-between"><span className="rounded-xl bg-[#fbefd9] p-2 text-[#9a651e]"><Percent className="size-4" /></span><span className="text-[10px] font-bold uppercase text-[#82908a]">10%</span></div><p className="mt-5 text-xs text-muted-foreground">Platform commission</p><p className="mt-1 flex items-center text-3xl font-black text-[#17332e]"><IndianRupee className="size-6" />4,800</p><p className="mt-1 text-xs text-muted-foreground">Marketplace fee</p></CardContent></Card>
          <Card className="rounded-[24px] border-[#d6ded9] shadow-[0_8px_24px_rgba(21,70,55,.04)]"><CardContent className="p-5 md:p-6"><div className="flex items-center justify-between"><span className="rounded-xl bg-[#e7edf4] p-2 text-[#3d5871]"><ArrowUpRight className="size-4" /></span><span className="text-[10px] font-bold uppercase text-[#82908a]">Net</span></div><p className="mt-5 text-xs text-muted-foreground">Estimated payout</p><p className="mt-1 flex items-center text-3xl font-black text-[#17332e]"><IndianRupee className="size-6" />43,200</p><p className="mt-1 text-xs text-[#2b7a5c]">Before applicable adjustments</p></CardContent></Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="rounded-[28px] border-[#d6ded9] shadow-[0_8px_26px_rgba(21,70,55,.045)]"><CardHeader className="border-b border-[#edf0ed] px-5 pb-4 pt-5 md:px-6 md:pt-6"><div className="flex items-center justify-between"><div><CardTitle className="text-xl text-[#17332e]">Recent payouts</CardTitle><p className="mt-1 text-xs text-muted-foreground">Settlement history for completed bookings.</p></div><Link href="/host/revenue" className="text-xs font-bold text-[#1b5d47]">View statement</Link></div></CardHeader><CardContent className="p-0">{payouts.map(([date, reference, amount, status]) => <div key={reference} className="flex flex-col gap-3 border-b border-[#e8ede9] px-5 py-4 sm:flex-row sm:items-center sm:justify-between last:border-0"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#f3f6f3]"><CalendarDays className="size-4 text-[#59736a]" /></span><div><p className="text-sm font-bold text-[#17332e]">{reference}</p><p className="mt-1 text-xs text-muted-foreground">Settlement · {date}</p></div></div><div className="flex items-center gap-3"><p className="font-black text-[#17332e]">{amount}</p><Badge variant={status === 'Paid' ? 'default' : 'secondary'}>{status}</Badge></div></div>)}</CardContent></Card>
          <Card className="rounded-[28px] border-[#d6ded9] bg-[#f7f2e7] shadow-[0_8px_26px_rgba(21,70,55,.045)]"><CardHeader><CardTitle className="text-xl text-[#17332e]">Revenue hygiene</CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex items-start gap-3"><ArrowDownRight className="mt-0.5 size-4 text-[#9a651e]" /><div><p className="text-sm font-bold">Commission is shown separately</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Keep booking value and host net payout distinct when reviewing performance.</p></div></div><div className="flex items-start gap-3"><WalletCards className="mt-0.5 size-4 text-[#9a651e]" /><div><p className="text-sm font-bold">Payout details</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Your bank details and settlement preferences belong in payout settings.</p></div></div><Link href="/host/revenue"><Button variant="outline" className="w-full rounded-xl border-[#d8ccba] bg-white text-[#17332e] hover:bg-white hover:text-[#17332e]">Open payout centre</Button></Link></CardContent></Card>
        </div>
      </div>
    </PortalShell>
  )
}
