'use client'

import { CalendarDays, MapPin, Search, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function SearchPanel({ compact = false }: { compact?: boolean }) {
  const router = useRouter()
  const [where, setWhere] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState('2')

  function search() {
    const params = new URLSearchParams()
    if (where) params.set('destination', where)
    if (checkIn) params.set('checkIn', checkIn)
    if (checkOut) params.set('checkOut', checkOut)
    params.set('guests', guests)
    router.push(`/search?${params.toString()}`)
  }

  return (
    <div className={`rounded-[1.25rem] border bg-white/95 p-2 shadow-[0_18px_50px_rgba(14,53,43,.16)] backdrop-blur ${compact ? '' : 'w-full'}`}>
      <div className="grid gap-1 md:grid-cols-[1.45fr_1fr_1fr_1fr_auto]">
        <label className="flex min-h-14 items-center gap-3 rounded-xl px-4 py-2 transition-colors focus-within:bg-muted">
          <MapPin className="size-5 shrink-0 text-primary" />
          <span className="sr-only">Destination</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-bold uppercase tracking-[.15em] text-muted-foreground">Where are you going?</span>
            <Input value={where} onChange={(event) => setWhere(event.target.value)} placeholder="Aizawl, Reiek, Champhai..." className="h-6 w-full border-0 bg-transparent p-0 text-sm shadow-none placeholder:text-muted-foreground/70 focus-visible:ring-0" />
          </span>
        </label>

        <label className="flex min-h-14 items-center gap-3 rounded-xl border-t px-4 py-2 transition-colors focus-within:bg-muted md:border-l md:border-t-0">
          <CalendarDays className="size-5 shrink-0 text-primary" />
          <span className="sr-only">Check in</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-bold uppercase tracking-[.15em] text-muted-foreground">Check in</span>
            <Input aria-label="Check in" type="date" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} className="h-6 w-full border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0" />
          </span>
        </label>

        <label className="flex min-h-14 items-center gap-3 rounded-xl border-t px-4 py-2 transition-colors focus-within:bg-muted md:border-l md:border-t-0">
          <CalendarDays className="size-5 shrink-0 text-primary" />
          <span className="sr-only">Check out</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-bold uppercase tracking-[.15em] text-muted-foreground">Check out</span>
            <Input aria-label="Check out" type="date" value={checkOut} onChange={(event) => setCheckOut(event.target.value)} className="h-6 w-full border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0" />
          </span>
        </label>

        <label className="flex min-h-14 items-center gap-3 rounded-xl border-t px-4 py-2 transition-colors focus-within:bg-muted md:border-l md:border-t-0">
          <Users className="size-5 shrink-0 text-primary" />
          <span className="sr-only">Guests</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-bold uppercase tracking-[.15em] text-muted-foreground">Guests</span>
            <select value={guests} onChange={(event) => setGuests(event.target.value)} className="h-6 w-full bg-transparent text-sm outline-none">
              <option value="1">1 guest</option>
              <option value="2">2 guests</option>
              <option value="3">3 guests</option>
              <option value="4">4 guests</option>
              <option value="5">5 guests</option>
              <option value="6">6+ guests</option>
            </select>
          </span>
        </label>

        <Button onClick={search} size="lg" className="min-h-14 rounded-xl px-6">
          <Search className="size-4" />
          Search stays
        </Button>
      </div>
    </div>
  )
}
