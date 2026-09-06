import Link from 'next/link'
import { CalendarPlus, CheckCircle2, Clock3, MessageCircle } from 'lucide-react'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatINR } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'

export default async function BookingConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/booking/${id}`)}`)

  const { data: booking } = await db
    .from('bookings')
    .select('id, booking_reference, property_id, check_in, check_out, guests, total_amount, currency, status, properties(name, town, district)')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!booking) redirect('/account')

  const property = Array.isArray(booking.properties) ? booking.properties[0] : booking.properties
  const confirmed = booking.status === 'CONFIRMED'

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 md:px-6">
      <Card>
        <CardContent className="p-8 md:p-12">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-primary/10 text-primary">
            {confirmed ? <CheckCircle2 className="size-9" /> : <Clock3 className="size-9" />}
          </div>
          <p className="mt-5 text-center text-sm font-semibold uppercase tracking-[.18em] text-primary">{confirmed ? 'Booking confirmed' : 'Booking in progress'}</p>
          <h1 className="mt-2 text-center text-4xl font-black">{confirmed ? 'You’re booked.' : 'Your room is on hold.'}</h1>
          <p className="mt-3 text-center text-muted-foreground">Booking reference: <span className="font-semibold text-foreground">{booking.booking_reference}</span></p>

          <div className="mx-auto mt-8 max-w-lg rounded-2xl border bg-muted/50 p-5">
            <p className="font-bold">{property?.name ?? 'MizoramStay property'}</p>
            <p className="mt-1 text-sm text-muted-foreground">{[property?.town, property?.district].filter(Boolean).join(', ') || 'Mizoram'}</p>
            <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-muted-foreground">Check-in</p><p className="font-semibold">{new Date(booking.check_in).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p></div>
              <div><p className="text-muted-foreground">Check-out</p><p className="font-semibold">{new Date(booking.check_out).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p></div>
              <div><p className="text-muted-foreground">Guests</p><p className="font-semibold">{booking.guests}</p></div>
              <div><p className="text-muted-foreground">Total</p><p className="font-semibold">{formatINR(Number(booking.total_amount))}</p></div>
            </div>
          </div>

          {!confirmed && <p className="mt-6 text-center text-sm text-muted-foreground">Payment is still being processed. Do not create another booking while this reservation is pending.</p>}
          <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link href="/account"><Button>View bookings</Button></Link>
            <Button variant="outline"><MessageCircle className="size-4" />Contact host</Button>
            <Button variant="outline"><CalendarPlus className="size-4" />Add to calendar</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
