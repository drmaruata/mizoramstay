import Link from 'next/link'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PortalShell } from '@/components/host/portal-shell'
import { InventoryBlockForm } from '@/components/host/inventory-block-form'
import { requireHost } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { HostBookingService, type CalendarDayState } from '@/features/bookings/host-booking.service'

export const dynamic = 'force-dynamic'

const STATE_STYLES: Record<CalendarDayState, string> = {
  AVAILABLE: 'bg-primary/10',
  BOOKED: 'bg-accent/70',
  BLOCKED: 'bg-foreground/15',
  UNAVAILABLE: 'bg-muted',
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default async function HostCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  await requireHost()

  const { month } = await searchParams
  const now = new Date()
  let year = now.getFullYear()
  let monthIndex = now.getMonth() // 0-based

  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split('-').map(Number)
    if (m >= 1 && m <= 12) {
      year = y
      monthIndex = m - 1
    }
  }

  const prev = new Date(year, monthIndex - 1, 1)
  const next = new Date(year, monthIndex + 1, 1)
  const prevParam = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`
  const nextParam = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`
  const dayCount = new Date(year, monthIndex + 1, 0).getDate()

  const db = await createClient()
  const service = new HostBookingService(db)
  const hostProfileId = await service.getHostProfileId()
  const calendars = hostProfileId
    ? await service.getCalendar(hostProfileId, year, monthIndex + 1)
    : []

  return (
    <PortalShell>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Inventory</p>
          <h1 className="mt-1 text-3xl font-black">
            {MONTH_NAMES[monthIndex]} {year}
          </h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/host/calendar?month=${prevParam}`}>
            <Button variant="outline" size="sm">
              <ChevronLeft className="size-4" />
            </Button>
          </Link>
          <Link href={`/host/calendar?month=${nextParam}`}>
            <Button variant="outline" size="sm">
              <ChevronRight className="size-4" />
            </Button>
          </Link>
        </div>
      </div>

      {!hostProfileId ? (
        <Card className="mt-6">
          <CardContent className="p-8 text-center">
            <p className="font-semibold">You are not set up as a host yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Complete your host profile to manage your calendar.
            </p>
          </CardContent>
        </Card>
      ) : calendars.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="p-8 text-center">
            <p className="font-semibold">No active rooms</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add rooms to your published properties to see availability here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="size-5 text-primary" /> Room availability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-5">
              <InventoryBlockForm
                rooms={calendars.map((c) => ({
                  id: c.roomId,
                  name: c.roomName,
                  propertyName: c.propertyName,
                }))}
              />
            </div>
            <div className="mb-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <i className="size-3 rounded bg-primary/10" /> Available
              </span>
              <span className="flex items-center gap-2">
                <i className="size-3 rounded bg-accent/70" /> Booked
              </span>
              <span className="flex items-center gap-2">
                <i className="size-3 rounded bg-foreground/15" /> Blocked
              </span>
              <span className="flex items-center gap-2">
                <i className="size-3 rounded bg-muted" /> Unavailable
              </span>
            </div>

            <div className="overflow-auto">
              <div className="min-w-[820px]">
                <div className="grid grid-cols-[170px_repeat(31,minmax(28px,1fr))] text-xs">
                  <div className="border-b p-2 font-semibold">Room</div>
                  {Array.from({ length: dayCount }, (_, i) => i + 1).map((d) => (
                    <div
                      key={d}
                      className="border-b border-l p-2 text-center text-muted-foreground"
                    >
                      {d}
                    </div>
                  ))}

                  {calendars.map((room) => (
                    <div key={room.roomId} className="contents">
                      <div className="border-b p-3">
                        <p className="font-semibold">{room.roomName}</p>
                        <p className="text-[10px] text-muted-foreground">{room.propertyName}</p>
                      </div>
                      {room.days.map((day) => (
                        <div
                          key={day.date}
                          className={`border-b border-l p-1 ${STATE_STYLES[day.state]}`}
                          title={`${day.date} · ${day.state.toLowerCase()}`}
                        >
                          <div className="h-7 rounded-md" />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </PortalShell>
  )
}