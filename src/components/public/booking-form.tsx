'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, CreditCard, Users, AlertCircle, Loader2 } from 'lucide-react'
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
  const [dates, setDates] = useState({ checkIn: '', checkOut: '' })
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)
  const [checkingAvailability, setCheckingAvailability] = useState(false)

  const nights = useMemo(
    () =>
      dates.checkIn && dates.checkOut
        ? Math.max(
            1,
            Math.round(
              (new Date(dates.checkOut).getTime() - new Date(dates.checkIn).getTime()) / 86400000
            )
          )
        : 1,
    [dates]
  )

  const subtotal = selectedRoom.price * nights
  const fee = Math.round(subtotal * 0.1)
  const total = subtotal + fee

  async function next() {
    setAvailabilityError(null)

    // If on step 1, check availability before proceeding to step 2
    if (step === 1) {
      if (!dates.checkIn || !dates.checkOut) {
        setAvailabilityError('Please select check-in and check-out dates.')
        return
      }

      setCheckingAvailability(true)
      const result = await checkRoomAvailability(selectedRoom.id, dates.checkIn, dates.checkOut)
      setCheckingAvailability(false)

      if (result.error) {
        setAvailabilityError(result.error)
        return
      }

      if (!result.available) {
        setAvailabilityError(
          result.unavailableDate
            ? `This room is not available starting ${result.unavailableDate}. Please select different dates.`
            : 'This room is not available for the selected dates.'
        )
        return
      }
    }

    if (step < 3) {
      setStep(step + 1)
    } else {
      router.push(`/booking/MZ-${String(Math.floor(Math.random() * 900000) + 100000)}`)
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <div className="mb-8 flex items-center justify-center gap-3 text-sm">
        {['Stay details', 'Guest details', 'Payment'].map((s, i) => (
          <div
            key={s}
            className={`flex items-center gap-2 ${
              step === i + 1 ? 'font-bold text-primary' : 'text-muted-foreground'
            }`}
          >
            <span className="grid size-7 place-items-center rounded-full border">{i + 1}</span>
            {s}
            {i < 2 && <span className="hidden w-8 border-t sm:block" />}
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 ? 'Your stay' : step === 2 ? 'Guest details' : 'Payment'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {availabilityError && (
              <div className="flex gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                <AlertCircle className="size-5 shrink-0" />
                <p>{availabilityError}</p>
              </div>
            )}

            {step === 1 && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold">
                    Check-in
                    <Input
                      type="date"
                      value={dates.checkIn}
                      onChange={(e) => setDates({ ...dates, checkIn: e.target.value })}
                      className="mt-2"
                    />
                  </label>
                  <label className="text-sm font-semibold">
                    Check-out
                    <Input
                      type="date"
                      value={dates.checkOut}
                      onChange={(e) => setDates({ ...dates, checkOut: e.target.value })}
                      className="mt-2"
                    />
                  </label>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-muted p-4 text-sm">
                  <CalendarDays className="size-5 text-primary" />
                  Flexible cancellation applies according to the property policy.
                </div>
              </>
            )}

            {step === 2 && (
              <div className="grid gap-4">
                <label className="text-sm font-semibold">
                  Full name
                  <Input
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Your name"
                    className="mt-2"
                  />
                </label>
                <label className="text-sm font-semibold">
                  Mobile number
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile"
                    inputMode="tel"
                    className="mt-2"
                  />
                </label>
              </div>
            )}

            {step === 3 && (
              <div className="rounded-2xl border p-4">
                <div className="flex items-center gap-3">
                  <CreditCard className="size-5 text-primary" />
                  <div>
                    <p className="font-semibold">Secure payment</p>
                    <p className="text-sm text-muted-foreground">
                      Production payment gateway connects here. The client never confirms payment.
                    </p>
                  </div>
                </div>
                <Button onClick={next} className="mt-5 w-full">
                  Pay {formatINR(total)}
                </Button>
              </div>
            )}

            {step < 3 && (
              <Button onClick={next} className="w-full" disabled={checkingAvailability}>
                {checkingAvailability ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Checking availability…
                  </>
                ) : (
                  'Continue'
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>{property.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{selectedRoom.name}</p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Rate</span>
              <span>
                {formatINR(selectedRoom.price)} × {nights}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Platform/service fees</span>
              <span>{formatINR(fee)}</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between text-base font-black">
                <span>Total</span>
                <span>{formatINR(total)}</span>
              </div>
            </div>
            <div className="flex gap-2 pt-3 text-xs text-muted-foreground">
              <Users className="size-4 shrink-0" />
              Guest count will be wired to live availability before production checkout.
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
