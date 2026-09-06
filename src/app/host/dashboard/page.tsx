import Link from 'next/link'
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  IndianRupee,
  Percent,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PortalShell } from '@/components/host/portal-shell'
import { BookingStatusBadge } from '@/components/host/booking-status-badge'
import { requireHost } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { HostBookingService } from '@/features/bookings/host-booking.service'
import { formatINR } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function HostDashboardPage() {
  await requireHost()

  const db = await createClient()
  const service = new HostBookingService(db)
  const hostProfileId = await service.getHostProfileId()

  const stats = hostProfileId
    ? await service.getDashboardStats(hostProfileId)
    : {
        todayCheckIns: 0,
        todayCheckOuts: 0,
        upcomingBookings: 0,
        pendingRequests: 0,
        monthRevenue: 0,
        occupancyRate: 0,
        recentBookings: [],
      }

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <PortalShell>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-muted-foreground">{today}</p>
          <h1 className="mt-1 text-3xl font-black">Host dashboard</h1>
        </div>
        <Link href="/host/calendar">
          <Button>
            <CalendarDays className="size-4" /> View calendar
          </Button>
        </Link>
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
        <>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Today&apos;s check-ins</p>
                <p className="mt-2 text-3xl font-black">{stats.todayCheckIns}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {stats.todayCheckOuts} check-out{stats.todayCheckOuts === 1 ? '' : 's'} today
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Upcoming bookings</p>
                <p className="mt-2 text-3xl font-black">{stats.upcomingBookings}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {stats.pendingRequests} pending request
                  {stats.pendingRequests === 1 ? '' : 's'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">This month&apos;s revenue</p>
                <p className="mt-2 flex items-center text-3xl font-black">
                  <IndianRupee className="size-6" />
                  {Math.round(stats.monthRevenue).toLocaleString('en-IN')}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">Confirmed + completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Occupancy (next 30 days)</p>
                <p className="mt-2 flex items-center text-3xl font-black">
                  <Percent className="size-6" />
                  {stats.occupancyRate}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">Across active rooms</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="size-5 text-primary" /> Recent bookings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.recentBookings.length === 0 ? (
                  <div className="py-8 text-center">
                    <CheckCircle2 className="mx-auto size-8 text-muted-foreground" />
                    <p className="mt-3 text-sm font-semibold">No bookings yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      New reservations will show up here.
                    </p>
                  </div>
                ) : (
                  stats.recentBookings.map((b) => (
                    <div
                      key={b.id}
                      className="flex flex-col justify-between gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{b.guestName}</p>
                          <BookingStatusBadge status={b.status} />
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {b.checkIn} → {b.checkOut} · {b.propertyName}
                          {b.roomName ? ` · ${b.roomName}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-bold">{formatINR(b.totalAmount)}</p>
                        <Link href="/host/bookings">
                          <Button variant="outline" size="sm">
                            View <ArrowUpRight className="size-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="size-5 text-primary" /> Quick actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/host/bookings" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <ClipboardList className="size-4" /> Manage bookings
                  </Button>
                </Link>
                <Link href="/host/calendar" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarDays className="size-4" /> Open calendar
                  </Button>
                </Link>
                <Link href="/host/properties" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <ArrowUpRight className="size-4" /> Manage properties
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </PortalShell>
  )
}