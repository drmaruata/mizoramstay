'use client'
import { Search, CalendarDays, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function SearchPanel({ compact = false }: { compact?: boolean }) {
  const router = useRouter(); const [where, setWhere] = useState(''); const [checkIn, setCheckIn] = useState(''); const [checkOut, setCheckOut] = useState(''); const [guests, setGuests] = useState('2')
  function search() { const params = new URLSearchParams(); if (where) params.set('destination', where); if (checkIn) params.set('checkIn', checkIn); if (checkOut) params.set('checkOut', checkOut); params.set('guests', guests); router.push(`/search?${params.toString()}`) }
  return <div className={`grid gap-2 rounded-2xl border bg-card p-2 shadow-lg ${compact ? 'md:grid-cols-[1.5fr_1fr_1fr_1fr_auto]' : 'md:grid-cols-[1.5fr_1fr_1fr_1fr_auto]'}`}>
    <label className="flex items-center gap-3 rounded-xl px-3 py-2 focus-within:bg-muted"><Search className="size-4 text-primary" /><span className="sr-only">Destination</span><Input value={where} onChange={(e) => setWhere(e.target.value)} placeholder="Where? Aizawl, Reiek…" className="h-8 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0" /></label>
    <label className="flex items-center gap-3 rounded-xl px-3 py-2 focus-within:bg-muted"><CalendarDays className="size-4 text-primary" /><span className="sr-only">Check in</span><Input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="h-8 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0" /></label>
    <label className="flex items-center gap-3 rounded-xl px-3 py-2 focus-within:bg-muted"><CalendarDays className="size-4 text-primary" /><span className="sr-only">Check out</span><Input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="h-8 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0" /></label>
    <label className="flex items-center gap-3 rounded-xl px-3 py-2 focus-within:bg-muted"><Users className="size-4 text-primary" /><span className="sr-only">Guests</span><select value={guests} onChange={(e) => setGuests(e.target.value)} className="w-full bg-transparent text-sm outline-none"><option value="1">1 guest</option><option value="2">2 guests</option><option value="3">3 guests</option><option value="4">4 guests</option><option value="5">5 guests</option><option value="6">6+ guests</option></select></label>
    <Button onClick={search} size="lg"><Search className="size-4" />Search</Button>
  </div>
}
