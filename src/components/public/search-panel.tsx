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
    <div className={`rounded-full border border-black/5 bg-white p-1.5 pl-2 shadow-[0_12px_40px_rgba(10,40,30,.18)] ${compact ? '' : 'w-full'}`}>
      <div className="flex flex-col items-stretch gap-1 md:flex-row md:items-center">
        <label className="flex min-h-12 flex-1 cursor-text items-center gap-2.5 rounded-full px-4 py-1.5 transition-colors hover:bg-[#f5f1e8] focus-within:bg-[#f5f1e8]">
          <MapPin className="size-4 shrink-0 text-[#0f5a45]" />
          <span className="sr-only">Destination</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-bold leading-tight text-[#1a2e28]">Where are you going?</span>
            <Input value={where} onChange={(event) => setWhere(event.target.value)} placeholder="Search destinations, towns or stays" className="h-5 w-full border-0 bg-transparent p-0 text-[12px] shadow-none placeholder:text-[#8a9a94] focus-visible:ring-0" />
          </span>
        </label>

        <div className="hidden h-8 w-px shrink-0 bg-[#e5ddd0] md:block" />

        <label className="flex min-h-12 flex-1 cursor-pointer items-center gap-2.5 rounded-full px-4 py-1.5 transition-colors hover:bg-[#f5f1e8] focus-within:bg-[#f5f1e8]">
          <CalendarDays className="size-4 shrink-0 text-[#0f5a45]" />
          <span className="sr-only">Check in</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-bold leading-tight text-[#1a2e28]">Check in</span>
            <Input aria-label="Check in" type="date" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} className="h-5 w-full border-0 bg-transparent p-0 text-[12px] text-[#8a9a94] shadow-none focus-visible:ring-0" />
          </span>
        </label>

        <div className="hidden h-8 w-px shrink-0 bg-[#e5ddd0] md:block" />

        <label className="flex min-h-12 flex-1 cursor-pointer items-center gap-2.5 rounded-full px-4 py-1.5 transition-colors hover:bg-[#f5f1e8] focus-within:bg-[#f5f1e8]">
          <CalendarDays className="size-4 shrink-0 text-[#0f5a45]" />
          <span className="sr-only">Check out</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-bold leading-tight text-[#1a2e28]">Check out</span>
            <Input aria-label="Check out" type="date" value={checkOut} onChange={(event) => setCheckOut(event.target.value)} className="h-5 w-full border-0 bg-transparent p-0 text-[12px] text-[#8a9a94] shadow-none focus-visible:ring-0" />
          </span>
        </label>

        <div className="hidden h-8 w-px shrink-0 bg-[#e5ddd0] md:block" />

        <label className="flex min-h-12 flex-1 cursor-pointer items-center gap-2.5 rounded-full px-4 py-1.5 transition-colors hover:bg-[#f5f1e8] focus-within:bg-[#f5f1e8]">
          <Users className="size-4 shrink-0 text-[#0f5a45]" />
          <span className="sr-only">Guests</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-bold leading-tight text-[#1a2e28]">Guests</span>
            <select value={guests} onChange={(event) => setGuests(event.target.value)} className="h-5 w-full cursor-pointer bg-transparent text-[12px] text-[#8a9a94] outline-none">
              <option value="1">1 guest</option>
              <option value="2">2 guests</option>
              <option value="3">3 guests</option>
              <option value="4">4 guests</option>
              <option value="5">5 guests</option>
              <option value="6">6+ guests</option>
            </select>
          </span>
        </label>

        <Button onClick={search} size="lg" className="min-h-11 shrink-0 rounded-full bg-[#0d3d2e] px-7 text-sm font-semibold text-white hover:bg-[#0a2e23]">
          <Search className="size-4" />
          Search
        </Button>
      </div>
    </div>
  )
}
