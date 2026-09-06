import Link from 'next/link'
import {
  ArrowRight,
  ArrowUpRight,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  IndianRupee,
  Percent,
  Sparkles,
  Users,
  Wallet,
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

const statCards = [
  { key: 'todayCheckIns', label: "Today's check-ins", icon: Users },
  { key: 'upcomingBookings', label: 'Upcoming bookings', icon: ClipboardList },
  { key: 'monthRevenue', label: "This month's revenue", icon: Wallet },
  { key: 'occupancyRate', label: 'Occupancy · next 30 days', icon: Percent },
] as const

export default async function HostDashboardPage() {
  const user = await requireHost()

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

  const displayName = user.email?.split('@')[0]?.replace(/[._-]/g, ' ') || 'Host'
  const formattedName = displayName.replace(/\b\w/g, (letter) => letter.toUpperCase())

  return (
    <PortalShell title="Host workspace">
      <div className="space-y-6 md:space-y-7">
        <header className="flex flex-col gap-5 rounded-[28px] border border-[#d9e1dc] bg-[#f8f6f0] p-5 shadow-[0_10px_30px_rgba(21,70,55,.04)] sm:flex-row sm:items-end sm:justify-between md:p-7">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.2em] text-[#81918a]">
              <span>{today}</span>
              <span className="size-1 rounded-full bg-[#c5cec9]" />
              <span className="text-[#154637]">Host studio</span>
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-[-.045em] text-[#17332e] sm:text-[40px]">Good day, {formattedName}.</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#66776f]">Keep your rooms ready, stay on top of reservations, and turn every guest stay into a reason to return.</p>
          </div>
          <Link href="/host/calendar" className="shrink-0">
            <Button className="h-11 rounded-xl bg-[#154637] px-5 text-white shadow-[0_8px_18px_rgba(21,70,55,.14)] hover:bg-[#103b2f]">
              <CalendarDays className="size-4" /> View calendar <ArrowRight className="size-4" />
            </Button>
          </Link>
        </header>

        {!hostProfileId ? (
          <Card className="overflow-hidden rounded-[28px] border-[#d9e1dc] shadow-sm">
            <CardContent className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
              <div>
                <div className="grid size-11 place-items-center rounded-2xl bg-[#e3f0e8] text-[#154637]"><Sparkles className="size-5" /></div>
                <p className="mt-4 text-xl font-black text-[#17332e]">Finish setting up your host account.</p>
                <p className="mt-1 max-w-lg text-sm leading-6 text-[#66776f]">Complete your host profile and listing details so your property can move from draft to review.</p>
              </div>
              <Link href="/host/properties"><Button className="rounded-xl bg-[#154637]">Manage properties <ArrowRight className="size-4" /></Button></Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Host performance summary">
              {statCards.map(({ key, label, icon: Icon }, index) => {
                const value = key === 'monthRevenue'
                  ? formatINR(Math.round(stats.monthRevenue))
                  : key === 'occupancyRate'
                    ? `${stats.occupancyRate}%`
                    : String(stats[key])
                const supporting =
                  key === 'todayCheckIns'
                    ? `${stats.todayCheckOuts} check-out${stats.todayCheckOuts === 1 ? '' : 's'} today`
                    : key === 'upcomingBookings'
                      ? `${stats.pendingRequests} pending request${stats.pendingRequests === 1 ? '' : 's'}`
                      : key === 'monthRevenue'
                        ? 'Confirmed + completed stays'
                        : 'Across active rooms'

                return (
                  <Card key={key} className="group rounded-[24px] border-[#d6ded9] bg-white shadow-[0_8px_24px_rgba(21,70,55,.04)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(21,70,55,.08)]">
                    <CardContent className="p-5 md:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <span className="grid size-10 place-items-center rounded-xl bg-[#edf4ef] text-[#154637]">
                          <Icon className="size-[18px]" />
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-[.16em] text-[#a0aaa5]">0{index + 1}</span>
                      </div>
                      <p className="mt-5 text-[12px] font-medium text-[#71817a]">{label}</p>
                      <p className="mt-1 text-[31px] font-black tracking-[-.045em] text-[#17332e]">{value}</p>
                      <p className="mt-1 text-xs text-[#81908a]">{supporting}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </section>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
              <Card className="rounded-[28px] border-[#d6ded9] bg-white shadow-[0_8px_26px_rgba(21,70,55,.045)]">
                <CardHeader className="border-b border-[#edf0ed] px-5 pb-4 pt-5 md:px-6 md:pt-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#9aa7a2]">Stay activity</p>
                      <CardTitle className="mt-1 flex items-center gap-2 text-xl tracking-[-.025em]"><ClipboardList className="size-5 text-[#154637]" /> Recent bookings</CardTitle>
                    </div>
                    <Link href="/host/bookings" className="hidden items-center gap-1 text-xs font-bold text-[#154637] sm:flex">View all <ChevronRight className="size-4" /></Link>
                  </div>
                </CardHeader>
                <CardContent className="p-4 md:p-5">
                  {stats.recentBookings.length === 0 ? (
                    <div className="grid min-h-52 place-items-center rounded-2xl bg-[#f7f8f5] p-8 text-center">
                      <div>
                        <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-[#e6f0ea] text-[#154637]"><BedDouble className="size-5" /></span>
                        <p className="mt-3 text-sm font-bold text-[#17332e]">No bookings yet</p>
                        <p className="mt-1 text-sm text-[#7c8984]">New reservations will appear here as soon as guests book.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {stats.recentBookings.map((b) => (
                        <div key={b.id} className="group flex flex-col gap-4 rounded-2xl border border-[#e2e7e3] p-4 transition hover:border-[#bdcec5] hover:bg-[#fbfcfa] sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-bold text-[#17332e]">{b.guestName}</p>
                              <BookingStatusBadge status={b.status} />
                            </div>
                            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#73817b]">
                              <span>{b.checkIn} → {b.checkOut}</span><span className="text-[#b7c0bc]">•</span><span>{b.propertyName}</span>{b.roomName && <><span className="text-[#b7c0bc]">•</span><span>{b.roomName}</span></>}
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-3 sm:justify-end">
                            <p className="text-base font-black text-[#17332e]">{formatINR(b.totalAmount)}</p>
                            <Link href="/host/bookings"><Button variant="outline" size="sm" className="h-9 rounded-xl border-[#d7dfda] bg-white px-3">View <ArrowUpRight className="size-3.5" /></Button></Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <Link href="/host/bookings" className="mt-3 flex items-center justify-center gap-1 py-2 text-xs font-bold text-[#154637] sm:hidden">View all bookings <ChevronRight className="size-4" /></Link>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="rounded-[28px] border-0 bg-[#154637] text-white shadow-[0_18px_38px_rgba(21,70,55,.18)]">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/55">Your next priority</p>
                        <h2 className="mt-2 text-xl font-black tracking-[-.03em]">{stats.pendingRequests > 0 ? 'Review pending requests' : stats.upcomingBookings > 0 ? 'Keep upcoming stays ready' : 'Make your listing bookable'}</h2>
                      </div>
                      <span className="grid size-10 place-items-center rounded-xl bg-white/10"><Clock3 className="size-5 text-[#e4b35b]" /></span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-white/70">{stats.pendingRequests > 0 ? `${stats.pendingRequests} reservation${stats.pendingRequests === 1 ? '' : 's'} need your attention.` : stats.upcomingBookings > 0 ? `${stats.upcomingBookings} upcoming booking${stats.upcomingBookings === 1 ? '' : 's'} are already on your calendar.` : 'Add room photos, pricing and availability so travellers can choose your stay.'}</p>
                    <Link href={stats.pendingRequests > 0 ? '/host/bookings' : stats.upcomingBookings > 0 ? '/host/calendar' : '/host/properties'} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#154637] transition hover:bg-[#f3efe6]">
                      {stats.pendingRequests > 0 ? 'Open bookings' : stats.upcomingBookings > 0 ? 'Prepare calendar' : 'Manage listing'} <ArrowRight className="size-3.5" />
                    </Link>
                  </CardContent>
                </Card>

                <Card className="rounded-[28px] border-[#d6ded9] shadow-[0_8px_26px_rgba(21,70,55,.045)]">
                  <CardHeader className="px-5 pb-3 pt-5 md:px-6 md:pt-6">
                    <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#9aa7a2]">At a glance</p>
                    <CardTitle className="mt-1 text-lg">Operations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 p-4 pt-0 md:p-5 md:pt-0">
                    <Link href="/host/calendar" className="flex items-center justify-between rounded-2xl border border-[#e1e7e3] bg-[#fbfcfa] p-3.5 transition hover:border-[#c4d3cc]">
                      <span className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#eaf2ed] text-[#154637]"><CalendarDays className="size-4" /></span><span><span className="block text-sm font-semibold">Calendar</span><span className="block text-[11px] text-[#89958f]">Manage availability</span></span></span><ChevronRight className="size-4 text-[#9ca8a3]" />
                    </Link>
                    <Link href="/host/revenue" className="flex items-center justify-between rounded-2xl border border-[#e1e7e3] bg-[#fbfcfa] p-3.5 transition hover:border-[#c4d3cc]">
                      <span className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#f4efe3] text-[#9a6920]"><IndianRupee className="size-4" /></span><span><span className="block text-sm font-semibold">Revenue</span><span className="block text-[11px] text-[#89958f]">Track earnings</span></span></span><ChevronRight className="size-4 text-[#9ca8a3]" />
                    </Link>
                    <Link href="/host/properties" className="flex items-center justify-between rounded-2xl border border-[#e1e7e3] bg-[#fbfcfa] p-3.5 transition hover:border-[#c4d3cc]">
                      <span className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#eaf2ed] text-[#154637]"><BedDouble className="size-4" /></span><span><span className="block text-sm font-semibold">Properties</span><span className="block text-[11px] text-[#89958f]">Update your listings</span></span></span><ChevronRight className="size-4 text-[#9ca8a3]" />
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>

            <section className="rounded-[28px] border border-[#d7e0da] bg-[#eef4ef] p-5 md:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[#154637] shadow-sm"><CheckCircle2 className="size-5" /></span>
                  <div><p className="text-sm font-bold text-[#17332e]">A calmer way to run your property</p><p className="mt-1 text-xs leading-5 text-[#708079]">Your bookings, availability, rooms and earnings are managed from the studio.</p></div>
                </div>
                <Link href="/host/properties" className="inline-flex items-center gap-1 text-xs font-bold text-[#154637]">Manage properties <ArrowRight className="size-4" /></Link>
              </div>
            </section>
          </>
        )}
      </div>
    </PortalShell>
  )
}
