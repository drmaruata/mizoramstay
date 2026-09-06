import Link from 'next/link'
import { CalendarDays, ChevronRight, Filter, Search, Users } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PortalShell } from '@/components/host/portal-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const bookings = [
  { id: 'MZ-102873', guest: 'Ananya Sharma', initials: 'AS', checkIn: '12 Oct', checkOut: '16 Oct', room: 'Deluxe Double', guests: 2, status: 'Confirmed', amount: '₹7,920' },
  { id: 'MZ-102861', guest: 'Rahul Verma', initials: 'RV', checkIn: '18 Oct', checkOut: '20 Oct', room: 'Family Room', guests: 3, status: 'Confirmed', amount: '₹5,720' },
  { id: 'MZ-102844', guest: 'Irene Joseph', initials: 'IJ', checkIn: '25 Oct', checkOut: '27 Oct', room: 'Deluxe Double', guests: 2, status: 'Pending', amount: '₹4,400' },
  { id: 'MZ-102831', guest: 'David Lalnunmawia', initials: 'DL', checkIn: '29 Oct', checkOut: '31 Oct', room: 'Family Room', guests: 4, status: 'Confirmed', amount: '₹6,800' },
]

export default function HostBookingsPage() {
  return (
    <PortalShell>
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#6f8179]">Reservations</p><h1 className="mt-2 text-3xl font-black tracking-tight">Bookings</h1><p className="mt-2 text-sm text-muted-foreground">Keep every arrival, stay and payout detail in view.</p></div>
          <div className="flex gap-2"><Link href="/host/calendar"><Button variant="outline"><CalendarDays className="size-4" /> Calendar</Button></Link><Button className="bg-[#154637] hover:bg-[#154637]/90"><Filter className="size-4" /> Filter</Button></div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3"><Card className="border-black/5 shadow-sm"><CardContent className="p-5"><p className="text-xs font-bold uppercase tracking-[.15em] text-[#778881]">Upcoming</p><p className="mt-2 text-3xl font-black">4</p><p className="text-xs text-muted-foreground">Reservations in October</p></CardContent></Card><Card className="border-black/5 shadow-sm"><CardContent className="p-5"><p className="text-xs font-bold uppercase tracking-[.15em] text-[#778881]">Arriving soon</p><p className="mt-2 text-3xl font-black">8</p><p className="text-xs text-muted-foreground">Guests across next 14 days</p></CardContent></Card><Card className="border-black/5 shadow-sm"><CardContent className="p-5"><p className="text-xs font-bold uppercase tracking-[.15em] text-[#778881]">Attention</p><p className="mt-2 text-3xl font-black text-[#9a651e]">1</p><p className="text-xs text-muted-foreground">Pending reservation</p></CardContent></Card></div>

        <Card className="mt-6 overflow-hidden border-black/5 shadow-sm">
          <CardHeader className="border-b border-black/5 px-5 py-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle className="text-xl">Reservation list</CardTitle><p className="mt-1 text-xs text-muted-foreground">Search by booking reference or guest name.</p></div><div className="relative w-full sm:w-72"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input className="pl-9 bg-[#fafbf9]" placeholder="Search bookings" /></div></div></CardHeader>
          <CardContent className="p-0">
            <div className="hidden grid-cols-[1.15fr_1.5fr_1.2fr_1.1fr_.9fr_36px] gap-4 border-b border-black/5 bg-[#fafbf9] px-5 py-3 text-[10px] font-bold uppercase tracking-[.12em] text-[#81908a] md:grid"><span>Reference</span><span>Guest</span><span>Stay</span><span>Room</span><span>Amount</span><span /></div>
            {bookings.map((booking) => <Link key={booking.id} href="/host/bookings" className="grid gap-3 border-b border-black/5 px-5 py-4 transition hover:bg-[#fafbf9] last:border-0 md:grid-cols-[1.15fr_1.5fr_1.2fr_1.1fr_.9fr_36px] md:items-center md:gap-4">
              <div><p className="text-xs font-black text-[#24463c]">{booking.id}</p><Badge variant={booking.status === 'Confirmed' ? 'default' : 'secondary'} className="mt-1 text-[9px] uppercase">{booking.status}</Badge></div>
              <div className="flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#e8efe9] text-xs font-black text-[#1b5d47]">{booking.initials}</span><div><p className="font-bold">{booking.guest}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><Users className="size-3.5" /> {booking.guests} guests</p></div></div>
              <div><p className="text-sm font-semibold">{booking.checkIn} – {booking.checkOut}</p><p className="mt-1 text-xs text-muted-foreground">October 2026</p></div>
              <p className="text-sm text-muted-foreground">{booking.room}</p>
              <p className="text-sm font-black">{booking.amount}</p>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>)}
          </CardContent>
        </Card>
      </div>
    </PortalShell>
  )
}
