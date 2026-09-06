import { ClipboardList, Search, Users } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PortalShell } from '@/components/host/portal-shell'
import { BookingStatusBadge } from '@/components/host/booking-status-badge'
import { MarkCompletedButton } from '@/components/host/mark-completed-button'
import { requireHost } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { HostBookingService } from '@/features/bookings/host-booking.service'
import { formatINR } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function HostBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  await requireHost()
  const { q } = await searchParams
  const query = (q ?? '').trim().toLowerCase()

  const db = await createClient()
  const service = new HostBookingService(db)
  const hostProfileId = await service.getHostProfileId()

  let bookings = hostProfileId ? await service.listBookings(hostProfileId) : []
  if (query) {
    bookings = bookings.filter(
      (b) =>
        b.bookingReference.toLowerCase().includes(query) ||
        b.guestName.toLowerCase().includes(query) ||
        b.propertyName.toLowerCase().includes(query)
    )
  }

  return (
    <PortalShell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Reservations</p>
          <h1 className="mt-1 text-3xl font-black">Bookings</h1>
        </div>
        <form className="relative">
          <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q ?? ''}
            className="pl-9 sm:w-72"
            placeholder="Search booking ID or guest"
          />
        </form>
      </div>

      {!hostProfileId ? (
        <Card className="mt-6">
          <CardContent className="p-8 text-center">
            <p className="font-semibold">You are not set up as a host yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Complete your host profile to start receiving bookings.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="size-5 text-primary" />
              {bookings.length} booking{bookings.length === 1 ? '' : 's'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <div className="py-10 text-center">
                <Users className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-3 font-semibold">No bookings yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Bookings for your properties will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {bookings.map((b) => (
                  <div
                    key={b.id}
                    className="grid gap-2 py-4 md:grid-cols-[1.1fr_1.3fr_1fr_1fr_1fr_auto] md:items-center"
                  >
                    <div>
                      <p className="font-semibold">{b.bookingReference}</p>
                      <p className="text-xs text-muted-foreground">{b.propertyName}</p>
                    </div>
                    <div>
                      <p className="font-medium">{b.guestName}</p>
                      {b.guestPhone && (
                        <p className="text-xs text-muted-foreground">{b.guestPhone}</p>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {b.checkIn} → {b.checkOut}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {b.roomName ?? '—'} · {b.guests} guest{b.guests === 1 ? '' : 's'}
                    </div>
                    <div className="font-bold md:text-right">{formatINR(b.totalAmount)}</div>
                    <div className="flex flex-col items-end gap-2 md:text-right">
                      <BookingStatusBadge status={b.status} />
                      {b.status === 'CONFIRMED' && <MarkCompletedButton bookingId={b.id} />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </PortalShell>
  )
}
