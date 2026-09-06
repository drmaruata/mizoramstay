'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, CheckCircle2, CreditCard, Loader2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { Property, Room } from '@/types/domain'
import { formatINR } from '@/lib/utils'
import { checkRoomAvailability } from '@/features/bookings/availability.actions'
import { PaymentCheckout } from '@/components/public/PaymentCheckout'

const FALLBACK_ROOM_IMAGE = 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80'

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
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null)

  const nights = useMemo(
    () => dates.checkIn && dates.checkOut
      ? Math.max(1, Math.round((new Date(dates.checkOut).getTime() - new Date(dates.checkIn).getTime()) / 86400000))
      : 1,
    [dates]
  )
  const subtotal = selectedRoom.price * nights
  const fee = Math.round(subtotal * 0.1)
  const total = subtotal + fee
  const roomImage = selectedRoom.images[0]?.url ?? FALLBACK_ROOM_IMAGE

  async function next() {
    setAvailabilityError(null)
    setBookingError(null)

    if (step === 1) {
      if (!dates.checkIn || !dates.checkOut) return setAvailabilityError('Please select check-in and check-out dates.')
      if (dates.checkOut <= dates.checkIn) return setAvailabilityError('Check-out must be after check-in.')
      if (guests > selectedRoom.maxGuests) return setAvailabilityError(`This room allows up to ${selectedRoom.maxGuests} guests.`)
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
        const requestId = idempotencyKey ?? crypto.randomUUID()
        setIdempotencyKey(requestId)
        const response = await fetch('/api/v1/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Idempotency-Key': requestId },
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
        if (!response.ok) throw new Error(payload.error?.message ?? 'Could not create your booking hold.')
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
        {['Stay details', 'Guest details', 'Payment'].map((label, index) => (
          <div key={label} className={`flex items-center gap-2 ${step === index + 1 ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
            <span className="grid size-7 place-items-center rounded-full border">{index + 1}</span>{label}{index < 2 && <span className="hidden w-8 border-t sm:block" />}
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader><CardTitle>{step === 1 ? 'Your stay' : step === 2 ? 'Guest details' : 'Payment'}</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            {(availabilityError || bookingError) && <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{availabilityError ?? bookingError}</div>}

            {step === 1 && <>
              <div className="rounded-2xl border bg-card p-3 sm:p-4">
                <div className="relative aspect-[16/8] overflow-hidden rounded-xl bg-muted">
                  <Image src={roomImage} alt={selectedRoom.name} fill unoptimized sizes="(max-width:768px) 100vw, 620px" className="object-cover" />
                  <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-3">
                    <div className="rounded-xl bg-black/65 px-3 py-2 text-white backdrop-blur-sm">
                      <p className="text-sm font-bold">{selectedRoom.name}</p>
                      <p className="text-xs text-white/80">{selectedRoom.images.length || 0} room photos · {selectedRoom.beds || 'Room bedding'}</p>
                    </div>
                    <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-foreground">
                      Selected room
                    </span>
                  </div>
                </div>
                {selectedRoom.description && <p className="mt-3 text-sm leading-6 text-muted-foreground">{selectedRoom.description}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold">Check-in<Input type="date" value={dates.checkIn} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDates({ ...dates, checkIn: e.target.value })} className="mt-2" /></label>
                <label className="text-sm font-semibold">Check-out<Input type="date" value={dates.checkOut} min={dates.checkIn || new Date().toISOString().slice(0, 10)} onChange={(e) => setDates({ ...dates, checkOut: e.target.value })} className="mt-2" /></label>
              </div>
              <label className="text-sm font-semibold">Guests<select value={guests} onChange={(e) => setGuests(Number(e.target.value))} className="mt-2 flex h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring">{Array.from({ length: Math.min(20, selectedRoom.maxGuests) }, (_, i) => i + 1).map((count) => <option key={count} value={count}>{count} {count === 1 ? 'guest' : 'guests'}</option>)}</select></label>
              <div className="flex items-center gap-3 rounded-xl bg-muted p-4 text-sm"><CalendarDays className="size-5 text-primary" />Availability is checked before your booking hold is created.</div>
              <Button onClick={next} className="w-full" disabled={checkingAvailability}>{checkingAvailability ? <><Loader2 className="size-4 animate-spin" /> Checking availability…</> : 'Continue'}</Button>
            </>}

            {step === 2 && <div className="grid gap-4">
              <div className="flex items-center gap-3 rounded-2xl border bg-muted/40 p-3"><div className="relative size-16 overflow-hidden rounded-xl bg-muted"><Image src={roomImage} alt={selectedRoom.name} fill unoptimized sizes="64px" className="object-cover" /></div><div><p className="font-bold">{selectedRoom.name}</p><p className="text-xs text-muted-foreground">{property.name} · {formatINR(selectedRoom.price)} / night</p></div></div>
              <label className="text-sm font-semibold">Full name<Input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Your name" className="mt-2" /></label>
              <label className="text-sm font-semibold">Mobile number<Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile" inputMode="tel" className="mt-2" /></label>
              <label className="text-sm font-semibold">Email (optional)<Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email" className="mt-2" /></label>
              <Button onClick={next} className="w-full" disabled={creatingBooking}>{creatingBooking ? <><Loader2 className="size-4 animate-spin" /> Creating booking hold…</> : 'Reserve stay'}</Button>
            </div>}

            {step === 3 && booking && <div className="space-y-5">
              <div className="rounded-2xl border p-5">
                <div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 size-6 text-primary" /><div><p className="font-semibold">Stay reserved temporarily</p><p className="text-sm text-muted-foreground">Booking reference: <span className="font-semibold text-foreground">{booking.bookingNumber}</span></p></div></div>
                <p className="mt-4 text-sm text-muted-foreground">Your room is held until {new Date(booking.holdExpiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Complete payment before the hold expires.</p>
                <div className="mt-5"><PaymentCheckout bookingId={booking.id} amount={booking.totalAmount} propertyName={property.name} guestName={guestName} guestEmail={email || undefined} guestPhone={phone} onConfirmed={() => router.push(`/booking/${booking.id}`)} /></div>
              </div>
            </div>}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-muted">
              <Image src={roomImage} alt={selectedRoom.name} fill unoptimized sizes="360px" className="object-cover" />
            </div>
            <CardTitle className="pt-1">{property.name}</CardTitle>
            <p className="text-sm font-semibold text-primary">{selectedRoom.name}</p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span>Rate</span><span>{formatINR(selectedRoom.price)} × {nights}</span></div>
            <div className="flex justify-between"><span>Platform/service fees</span><span>{formatINR(fee)}</span></div>
            <div className="border-t pt-3"><div className="flex justify-between text-base font-black"><span>Total</span><span>{formatINR(total)}</span></div></div>
            <div className="flex gap-2 pt-3 text-xs text-muted-foreground"><Users className="size-4 shrink-0" /> {guests} {guests === 1 ? 'guest' : 'guests'} · Secure inventory hold</div>
            <div className="flex gap-2 text-xs text-muted-foreground"><CreditCard className="size-4 shrink-0" /> UPI, cards and net banking are provided through Razorpay Checkout.</div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
