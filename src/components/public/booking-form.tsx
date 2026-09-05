'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, CheckCircle2, CreditCard, Loader2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { Property, Room } from '@/types/domain'
import { formatINR } from '@/lib/utils'
import { checkRoomAvailability } from '@/features/bookings/availability.actions'

export function BookingForm({ property, room }: { property: Property; room: Room | null }) {
  const router = useRouter()
  const selectedRoom = room ?? property.rooms[0]
  const [step, setStep] = useState(1)
  const [guestName, setGuestName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [guests, setGuests] = useState(1)
  const [dates, setDates] = useState({ checkIn: '', checkOut: '' })
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [creatingBooking, setCreatingBooking] = useState(false)
  const [booking, setBooking] = useState<{ id: string; bookingNumber: string; totalAmount: number; holdExpiresAt: string } | null>(null)

  const nights = useMemo(
    () =>
      dates.checkIn && dates.checkOut
        ? Math.max(1, Math.round((new Date(dates.checkOut).getTime() - new Date(dates.checkIn).getTime()) / 86400000))
        : 1,
    [dates]
  )

  const subtotal = selectedRoom.price * nights
  const fee = Math.round(subtotal * 0.1)
  const total = subtotal + fee

  async function next() {
    setAvailabilityError(null)
    setBookingError(null)

    if (step === 1) {
      if (!dates.checkIn || !dates.checkOut) {
        setAvailabilityError('Please select check-in and check-out dates.')
        return
      }
      if (guests > selectedRoom.maxGuests) {
        setAvailabilityError(`This room allows up to ${selectedRoom.maxGuests} guests.`)
        return
      }

      setCheckingAvailability(true)
      const result = await checkRoomAvailability(selectedRoom.id, dates.checkIn, dates.checkOut)
      setCheckingAvailability(false)

      if (result.error || !result.available) {
        setAvailabilityError(result.error ?? (result.unavailableDate ? `This room is not available starting ${result.unavailableDate}.` : 'This room is not available for the selected dates.'))
        return
      }
      setStep(2)
      return
    }

    if (step === 2) {
      if (!guestName.trim() || phone.trim().length < 8) {
        setBookingError('Please provide your name and a valid mobile number.')
        return
      }

      setCreatingBooking(true)
      try {
        const response = await fetch('/api/v1/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': crypto.randomUUID(),
          },
          body: JSON.stringify({
            propertyId: property.id,
            roomId: selectedRoom.id,
            checkIn: dates.checkIn,
            checkOut: dates.checkOut,
            guests,
            guest: {
              firstName: guestName.trim().split(/\s+/)[0],
              lastName: guestName.trim().split(/\s+/).slice(1).join(' '),
              phone: phone.trim(),
              ...(email.trim() ? { email: email.trim() } : {}),
            },
          }),
        })

        const payload = await response.json()
        if (!response.ok) {
          throw new Error(payload.error?.message ?? 'Could not create your booking hold.')
        }

        setBooking(payload.booking)
        setStep(3)
      } catch (error) {
        setBookingError(error instanceof Error ? error.message : 'Could not create your booking hold.')
      } finally {
        setCreatingBooking(false)
      }
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <div className="mb-8 flex items-center justify-center gap-3 text-sm">
        {['Stay details', 'Guest details', 'Payment'].map((label, i) => (
          <div key={label} className={`flex items-center gap-2 ${step === i + 1 ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
            <span className="grid size-7 place-items-center rounded-full border">{i + 1}</span>
            {label}
            {i < 2 && <span className="hidden w-8 border-t sm:block" />}
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>{step === 1 ? 'Your stay' : step === 2 ? 'Guest details' : 'Payment'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {(availabilityError || bookingError) && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                {availabilityError ?? bookingError}
              </div>
            )}

            {step === 1 && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold">Check-in<Input type="date" value={dates.checkIn} onChange={(e) => setDates({ ...dates, checkIn: e.target.value })} className="mt-2" /></label>
                  <label className="text-sm font-semibold">Check-out<Input type="date" value={dates.checkOut} onChange={(e) => setDates({ ...dates, checkOut: e.target.value })} className="mt-2" /></label>
                </div>
                <label className="text-sm font-semibold">Guests<select value={guests} onChange={(e) => setGuests(Number(e.target.value))} className="mt-2 flex h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
                  {Array.from({ length: Math.min(20, selectedRoom.maxGuests) }, (_, i) => i + 1).map((count) => <option key={count} value={count}>{count} {count === 1 ? 'guest' : 'guests'}</option>)}
                </select></label>
                <div className="flex items-center gap-3 rounded-xl bg-muted p-4 text-sm"><CalendarDays className="size-5 text-primary" />Availability is checked before your booking hold is created.</div>
                <Button onClick={next} className="w-full" disabled={checkingAvailability}>{checkingAvailability ? <><Loader2 className="size-4 animate-spin" /> Checking availability…</> : 'Continue'}</Button>
              </>
            )}

            {step === 2 && (
              <div className="grid gap-4">
                <label className="text-sm font-semibold">Full name<Input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Your name" className="mt-2" /></label>
                <label className="text-sm font-semibold">Mobile number<Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile" inputMode="tel" className="mt-2" /></label>
                <label className="text-sm font-semibold">Email (optional)<Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email" className="mt-2" /></label>
                <Button onClick={next} className="w-full" disabled={creatingBooking}>{creatingBooking ? <><Loader2 className="size-4 animate-spin" /> Creating booking hold…</> : 'Reserve stay'}</Button>
              </div>
            )}

            {step === 3 && booking && (
              <div className="space-y-5">
                <div className="rounded-2xl border p-5">
                  <div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 size-6 text-primary" /><div><p className="font-semibold">Stay reserved temporarily</p><p className="text-sm text-muted-foreground">Booking reference: <span className="font-semibold text-foreground">{booking.bookingNumber}</span></p></div></div>
                  <p className="mt-4 text-sm text-muted-foreground">Your room is held until {new Date(booking.holdExpiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Payment gateway integration is the next production step.</p>
                  <Button onClick={() => router.push(`/booking/${booking.bookingNumber}`)} variant="outline" className="mt-5 w-full">View booking</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader><CardTitle>{property.name}</CardTitle><p className="text-sm text-muted-foreground">{selectedRoom.name}</p></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span>Rate</span><span>{formatINR(selectedRoom.price)} × {nights}</span></div>
            <div className="flex justify-between"><span>Platform/service fees</span><span>{formatINR(fee)}</span></div>
            <div className="border-t pt-3"><div className="flex justify-between text-base font-black"><span>Total</span><span>{formatINR(total)}</span></div></div>
            <div className="flex gap-2 pt-3 text-xs text-muted-foreground"><Users className="size-4 shrink-0" /> {guests} {guests === 1 ? 'guest' : 'guests'} · Secure server-side booking hold</div>
            <div className="flex gap-2 text-xs text-muted-foreground"><CreditCard className="size-4 shrink-0" /> Payment will be added after the transaction core is validated.</div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
