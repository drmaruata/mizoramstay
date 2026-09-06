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
      <div className="mx-auto w-full max-w-[1240px] space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#81918a]">Reservations</p>
            <h1 className="mt-2 text-3xl font-black tracking-[-.04em] text-[#17332e] sm:text-[40px]">Bookings</h1>
            <p className="mt-2 text-sm leading-6 text-[#66776f]">Review reservations, guest details and stay status in one place.</p>
          </div>
          <form className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input name="q" defaultValue={q ?? ''} className="h-11 w-full rounded-xl border-[#d7dfda] bg-white pl-9 sm:w-72" placeholder="Search booking ID or guest" />
          </form>
        </div>

        {!hostProfileId ? (
          <Card className="rounded-[28px] border-[#d6ded9] shadow-[0_8px_26px_rgba(21,70,55,.045)]">
            <CardContent className="p-8 text-center">
              <p className="font-semibold text-[#17332e]">You are not set up as a host yet.</p>
              <p className="mt-1 text-sm text-muted-foreground">Complete your host profile to start receiving bookings.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-[28px] border-[#d6ded9] bg-white shadow-[0_8px_26px_rgba(21,70,55,.045)]">
            <CardHeader className="border-b border-[#edf0ed] px-5 pb-4 pt-5 md:px-6 md:pt-6">
              <CardTitle className="flex items-center gap-2 text-xl tracking-[-.025em] text-[#17332e]"><ClipboardList className="size-5 text-[#154637]" /> {bookings.length} booking{bookings.length === 1 ? '' : 's'}</CardTitle>
            </CardHeader>
            <CardContent className="p-5 md:p-6">
              {bookings.length === 0 ? (
                <div className="grid min-h-52 place-items-center rounded-2xl bg-[#f7f8f5] p-8 text-center">
                  <div>
                    <Users className="mx-auto size-8 text-[#657a71]" />
                    <p className="mt-3 font-semibold text-[#17332e]">No bookings yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">Bookings for your properties will appear here.</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-[#e8ede9] rounded-2xl border border-[#e2e7e3]">
                  {bookings.map((b) => (
                    <div key={b.id} className="grid gap-3 p-4 md:grid-cols-[1.1fr_1.3fr_1fr_1fr_1fr_auto] md:items-center md:p-5">
                      <div><p className="font-semibold text-[#17332e]">{b.bookingReference}</p><p className="text-xs text-muted-foreground">{b.propertyName}</p></div>
                      <div><p className="font-medium text-[#17332e]">{b.guestName}</p>{b.guestPhone && <p className="text-xs text-muted-foreground">{b.guestPhone}</p>}</div>
                      <div className="text-sm text-muted-foreground">{b.checkIn} → {b.checkOut}</div>
                      <div className="text-sm text-muted-foreground">{b.roomName ?? '—'} · {b.guests} guest{b.guests === 1 ? '' : 's'}</div>
                      <div className="font-bold text-[#17332e] md:text-right">{formatINR(b.totalAmount)}</div>
                      <div className="flex flex-col items-start gap-2 md:items-end md:text-right"><BookingStatusBadge status={b.status} />{b.status === 'CONFIRMED' && <MarkCompletedButton bookingId={b.id} />}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PortalShell>
  )
}
