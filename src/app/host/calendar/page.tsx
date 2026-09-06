import { CalendarDays, ChevronLeft, ChevronRight, CircleOff, MousePointer2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PortalShell } from '@/components/host/portal-shell'

const rooms = [
  { name: 'Deluxe Double Room', status: [7, 8, 14, 15, 22], sold: 18, capacity: 24 },
  { name: 'Family Room', status: [7, 14, 15, 16, 22, 23], sold: 21, capacity: 24 },
  { name: 'Garden Twin Room', status: [3, 4, 5, 20, 21], sold: 12, capacity: 24 },
]

export default function HostCalendarPage() {
  const days = Array.from({ length: 30 }, (_, index) => index + 1)
  return (
    <PortalShell>
      <div className="mx-auto max-w-[1250px]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#6f8179]">Inventory planning</p><h1 className="mt-2 text-3xl font-black tracking-tight">October 2026</h1><p className="mt-2 text-sm text-muted-foreground">Control room inventory, blocked dates and booked nights.</p></div><div className="flex items-center gap-2"><Button variant="outline" size="sm" aria-label="Previous month"><ChevronLeft className="size-4" /></Button><Button variant="outline" size="sm" aria-label="Next month"><ChevronRight className="size-4" /></Button><Button className="bg-[#154637] hover:bg-[#154637]/90"><CalendarDays className="size-4" /> Today</Button></div></div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3"><Card className="border-black/5 shadow-sm"><CardContent className="p-5"><p className="text-xs font-bold uppercase tracking-[.15em] text-[#7b8a84]">Available nights</p><p className="mt-2 text-3xl font-black">51</p><p className="mt-1 text-xs text-muted-foreground">Across all rooms</p></CardContent></Card><Card className="border-black/5 shadow-sm"><CardContent className="p-5"><p className="text-xs font-bold uppercase tracking-[.15em] text-[#7b8a84]">Booked nights</p><p className="mt-2 text-3xl font-black">18</p><p className="mt-1 text-xs text-muted-foreground">68% projected occupancy</p></CardContent></Card><Card className="border-black/5 shadow-sm"><CardContent className="p-5"><p className="text-xs font-bold uppercase tracking-[.15em] text-[#7b8a84]">Blocked</p><p className="mt-2 text-3xl font-black text-[#8d6a38]">11</p><p className="mt-1 text-xs text-muted-foreground">Maintenance or owner use</p></CardContent></Card></div>

        <Card className="mt-6 overflow-hidden border-black/5 shadow-sm"><CardHeader className="border-b border-black/5 px-5 py-4"><div className="flex flex-wrap items-center justify-between gap-4"><div><CardTitle className="flex items-center gap-2 text-xl"><CalendarDays className="size-5 text-[#1b5d47]" /> Room availability</CardTitle><p className="mt-1 text-xs text-muted-foreground">Select a date cell to update availability.</p></div><div className="flex flex-wrap gap-3 text-[10px] font-semibold text-[#71817a]"><span className="flex items-center gap-1.5"><i className="size-2.5 rounded bg-[#dfeee5]" /> Available</span><span className="flex items-center gap-1.5"><i className="size-2.5 rounded bg-[#e4d6b9]" /> Booked</span><span className="flex items-center gap-1.5"><i className="size-2.5 rounded bg-[#e3e5e4]" /> Blocked</span></div></div></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><div className="min-w-[1040px]"><div className="grid grid-cols-[190px_repeat(30,minmax(28px,1fr))] bg-[#fafbf9] text-[10px] font-bold text-[#7a8982]"><div className="sticky left-0 z-10 border-b border-r bg-[#fafbf9] px-4 py-3">ROOM</div>{days.map((day) => <div key={day} className="border-b border-r px-1 py-3 text-center">{day}</div>)}</div>{rooms.map((room) => <div key={room.name} className="grid grid-cols-[190px_repeat(30,minmax(28px,1fr))] text-[10px]"><div className="sticky left-0 z-10 flex flex-col justify-center border-b border-r bg-white px-4 py-3"><span className="font-bold text-[#23473b]">{room.name}</span><span className="mt-1 text-[#84918b]">{room.sold}/{room.capacity} booked</span></div>{days.map((day) => { const booked = room.status.includes(day); const blocked = [10, 11, 28].includes(day) && room.name === 'Garden Twin Room'; return <div key={`${room.name}-${day}`} className="border-b border-r p-1"><button className={`group h-8 w-full rounded-lg transition hover:ring-2 hover:ring-[#bfcfc5] ${blocked ? 'bg-[#e3e5e4]' : booked ? 'bg-[#e4d6b9]' : 'bg-[#dfeee5]'}`} aria-label={`${room.name}, October ${day}, ${blocked ? 'blocked' : booked ? 'booked' : 'available'}`}><span className="sr-only">{blocked ? 'Blocked' : booked ? 'Booked' : 'Available'}</span></button></div> })}</div>)}</div></div></CardContent></Card>

        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><Badge variant="secondary" className="gap-1"><MousePointer2 className="size-3" /> Tip</Badge> Use the calendar to keep availability aligned with direct bookings and owner-use dates.<span className="inline-flex items-center gap-1.5"><CircleOff className="size-3" /> Blocked cells never appear as bookable inventory.</span></div>
      </div>
    </PortalShell>
  )
}
