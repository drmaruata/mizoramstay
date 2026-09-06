import Link from 'next/link'
import { ArrowUpRight, CalendarDays, CheckCircle2, ChevronRight, IndianRupee, Sparkles, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PortalShell } from '@/components/host/portal-shell'

const reservations = [
  { id: 'MZ-102873', guest: 'Ananya Sharma', initials: 'AS', dates: '12–16 Oct', room: 'Deluxe Double', amount: '₹7,920', status: 'Confirmed' },
  { id: 'MZ-102861', guest: 'Rahul Verma', initials: 'RV', dates: '18–20 Oct', room: 'Family Room', amount: '₹5,720', status: 'Confirmed' },
  { id: 'MZ-102844', guest: 'Irene Joseph', initials: 'IJ', dates: '25–27 Oct', room: 'Deluxe Double', amount: '₹4,400', status: 'Pending' },
]

export default function HostDashboardPage() {
  return (
    <PortalShell>
      <div className="mx-auto max-w-[1200px]">
        <div className="rounded-[30px] bg-[#154637] px-5 py-6 text-white shadow-[0_18px_50px_rgba(21,70,55,.16)] md:px-7 md:py-7">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[#dfece3]"><Sparkles className="size-4 text-[#e4b35b]" /><span className="text-[10px] font-bold uppercase tracking-[.2em]">Host studio · Today</span></div>
              <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Good morning, Lalhmingmawia.</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">Your stay is looking healthy. Two guests arrive this week and one reservation needs your attention.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/host/calendar"><Button className="bg-white text-[#154637] hover:bg-white/90"><CalendarDays className="size-4" /> Calendar</Button></Link>
              <Link href="/host/properties"><Button variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/15">Manage property <ArrowUpRight className="size-4" /></Button></Link>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/10 p-4"><p className="text-[10px] uppercase tracking-[.15em] text-white/55">Today</p><p className="mt-2 text-2xl font-black">3 bookings</p><p className="mt-1 text-xs text-white/60">+1 vs yesterday</p></div>
            <div className="rounded-2xl bg-white/10 p-4"><p className="text-[10px] uppercase tracking-[.15em] text-white/55">Next 14 days</p><p className="mt-2 text-2xl font-black">8 guests</p><p className="mt-1 text-xs text-white/60">4 room nights ahead</p></div>
            <div className="rounded-2xl bg-white/10 p-4"><p className="text-[10px] uppercase tracking-[.15em] text-white/55">September</p><p className="mt-2 flex items-center text-2xl font-black"><IndianRupee className="size-5" />42,800</p><p className="mt-1 text-xs text-[#dfece3]">Gross booking value</p></div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ['Occupancy', '68%', '12 of 18 room nights', 'bg-[#e6f0e9] text-[#18513e]'],
            ['Response time', '1h 42m', 'Best this month', 'bg-[#f8ecd6] text-[#95651c]'],
            ['Guest rating', '4.9', '40 verified reviews', 'bg-[#e9eef5] text-[#3d5871]'],
          ].map(([label, value, sub, tone]) => <Card key={label} className="border-black/5 shadow-[0_8px_25px_rgba(20,40,35,.04)]"><CardContent className="p-5"><div className={`inline-flex rounded-xl px-2.5 py-1 text-[10px] font-bold ${tone}`}>{label}</div><p className="mt-4 text-3xl font-black tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{sub}</p></CardContent></Card>)}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
          <Card className="overflow-hidden border-black/5 shadow-[0_8px_25px_rgba(20,40,35,.04)]">
            <CardHeader className="flex flex-row items-center justify-between border-b border-black/5 px-5 py-4">
              <div><CardTitle className="text-xl">Upcoming reservations</CardTitle><p className="mt-1 text-xs text-muted-foreground">Keep an eye on arrivals, rooms and guest requests.</p></div>
              <Link href="/host/bookings" className="text-xs font-bold text-[#18513e]">View all</Link>
            </CardHeader>
            <CardContent className="p-0">
              {reservations.map((booking) => <Link key={booking.id} href="/host/bookings" className="flex flex-col gap-3 border-b border-black/5 px-5 py-5 transition hover:bg-[#fafbf9] sm:flex-row sm:items-center sm:justify-between last:border-0">
                <div className="flex min-w-0 items-center gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#e8efe9] text-xs font-black text-[#18513e]">{booking.initials}</span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-bold">{booking.guest}</p><Badge variant={booking.status === 'Confirmed' ? 'default' : 'secondary'} className="text-[9px] uppercase tracking-wide">{booking.status}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{booking.dates} · {booking.room} · {booking.id}</p></div></div>
                <div className="flex items-center justify-between sm:justify-end sm:gap-4"><p className="text-sm font-black">{booking.amount}</p><ChevronRight className="size-4 text-muted-foreground" /></div>
              </Link>)}
            </CardContent>
          </Card>

          <Card className="border-black/5 shadow-[0_8px_25px_rgba(20,40,35,.04)]">
            <CardHeader><div className="flex items-center justify-between"><CardTitle className="text-xl">Property readiness</CardTitle><span className="text-sm font-black text-[#18513e]">86%</span></div><p className="mt-1 text-xs text-muted-foreground">Finish the last steps to unlock a stronger listing.</p></CardHeader>
            <CardContent><div className="h-2 overflow-hidden rounded-full bg-[#e2e8e3]"><div className="h-full w-[86%] rounded-full bg-[#d4942f]" /></div><div className="mt-5 space-y-3">{[['Property profile', true], ['Documents', true], ['Rooms', true], ['Photos', true], ['Pricing', false], ['Verification', false]].map(([label, done]) => <div key={String(label)} className="flex items-center justify-between gap-3 text-sm"><span className="flex items-center gap-2">{done ? <CheckCircle2 className="size-4 text-[#2b7a5c]" /> : <span className="size-4 rounded-full border-2 border-[#c9d2cd]" />}{label}</span>{!done && <span className="text-[10px] font-bold text-[#a57224]">TODO</span>}</div>)}</div><Link href="/host/properties"><Button className="mt-6 w-full bg-[#154637] hover:bg-[#154637]/90">Finish setup <ArrowUpRight className="size-4" /></Button></Link></CardContent>
          </Card>
        </div>
      </div>
    </PortalShell>
  )
}
