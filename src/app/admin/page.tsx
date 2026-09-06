import Link from 'next/link'
import { ArrowRight, BadgeCheck, Building2, CalendarCheck, ChevronRight, IndianRupee, ShieldAlert, Star, TrendingUp, Users } from 'lucide-react'
import { requireAdmin } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { single } from '@/lib/supabase/relations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default async function AdminDashboardPage() {
  await requireAdmin()
  const supabase = await createClient()
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const [propertiesResult, pendingResult, bookingsResult, hostsResult, reviewsResult] = await Promise.all([
    supabase.from('properties').select('id', { count: 'exact', head: true }).eq('status', 'PUBLISHED'),
    supabase.from('properties').select('id', { count: 'exact', head: true }).eq('status', 'PENDING_REVIEW'),
    supabase.from('bookings').select('id, total_amount, status', { count: 'exact' }).gte('created_at', monthStart.toISOString()),
    supabase.from('host_profiles').select('id', { count: 'exact', head: true }),
    supabase.from('reviews').select('rating', { count: 'exact' }),
  ])

  const publishedCount = propertiesResult.count ?? 0
  const pendingCount = pendingResult.count ?? 0
  const bookingsThisMonth = bookingsResult.count ?? 0
  const gmvThisMonth = (bookingsResult.data ?? []).filter((booking) => ['CONFIRMED', 'COMPLETED'].includes(booking.status)).reduce((sum, booking) => sum + Number(booking.total_amount ?? 0), 0)
  const activeHosts = hostsResult.count ?? 0
  const reviews = reviewsResult.data ?? []
  const avgRating = reviews.length ? (reviews.reduce((sum, review) => sum + Number(review.rating ?? 0), 0) / reviews.length).toFixed(1) : '0.0'

  const { data: pendingProperties } = await supabase.from('properties').select('id, name, district, property_type, verification_level, created_at, host_profiles(display_name)').eq('status', 'PENDING_REVIEW').order('created_at', { ascending: true }).limit(6)
  const { data: districtRows } = await supabase.from('properties').select('district').eq('status', 'PUBLISHED')
  const districtCounts = new Map<string, number>()
  for (const row of districtRows ?? []) districtCounts.set(row.district || 'Other', (districtCounts.get(row.district || 'Other') ?? 0) + 1)
  const topDistricts = [...districtCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4)
  const districtTotal = Math.max(1, publishedCount)

  const kpis = [
    { icon: Building2, label: 'Published properties', value: publishedCount.toLocaleString(), sub: 'Live on marketplace', tone: 'bg-[#e7f1ea] text-[#1a6047]' },
    { icon: ShieldAlert, label: 'Verification queue', value: pendingCount.toLocaleString(), sub: pendingCount ? 'Needs attention' : 'Queue is clear', tone: pendingCount ? 'bg-[#fff0dc] text-[#9a651e]' : 'bg-[#e7f1ea] text-[#1a6047]' },
    { icon: CalendarCheck, label: 'Bookings this month', value: bookingsThisMonth.toLocaleString(), sub: `₹${gmvThisMonth.toLocaleString('en-IN')} confirmed GMV`, tone: 'bg-[#e9eef5] text-[#3d5871]' },
    { icon: Users, label: 'Registered hosts', value: activeHosts.toLocaleString(), sub: 'Host accounts', tone: 'bg-[#eeeaf5] text-[#635075]' },
  ]

  return (
    <div className="mx-auto max-w-[1240px] space-y-6">
      <section className="rounded-[30px] bg-[#183a31] px-5 py-6 text-white shadow-[0_20px_55px_rgba(24,58,49,.16)] md:px-7 md:py-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-white/55">Operations command centre</p><h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Platform overview</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">Monitor inventory, bookings, hosts and the verification queue from one operational surface.</p></div>
          <div className="flex flex-wrap gap-2"><Link href="/admin/properties"><Button className="bg-white text-[#183a31] hover:bg-white/90">Review properties <ArrowRight className="size-4" /></Button></Link><Link href="/admin/bookings"><Button variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/15">View bookings</Button></Link></div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-white/10 p-4"><p className="text-[10px] uppercase tracking-[.16em] text-white/50">Marketplace</p><p className="mt-2 text-2xl font-black">{publishedCount} live stays</p><p className="mt-1 text-xs text-white/60">Published inventory</p></div><div className="rounded-2xl bg-white/10 p-4"><p className="text-[10px] uppercase tracking-[.16em] text-white/50">Attention</p><p className="mt-2 text-2xl font-black">{pendingCount} in queue</p><p className="mt-1 text-xs text-white/60">Verification workload</p></div><div className="rounded-2xl bg-white/10 p-4"><p className="text-[10px] uppercase tracking-[.16em] text-white/50">Guest sentiment</p><p className="mt-2 flex items-center gap-2 text-2xl font-black">{avgRating}<Star className="size-5 fill-current text-[#e7b65d]" /></p><p className="mt-1 text-xs text-white/60">Across {reviews.length} reviews</p></div></div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{kpis.map(({ icon: Icon, label, value, sub, tone }) => <Card key={label} className="border-black/5 shadow-[0_8px_28px_rgba(24,48,40,.04)]"><CardContent className="p-5"><div className="flex items-center justify-between"><span className={`rounded-xl px-2.5 py-1 text-[10px] font-bold ${tone}`}>{label}</span><Icon className="size-5 text-[#628078]" /></div><p className="mt-5 text-3xl font-black tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{sub}</p></CardContent></Card>)}</div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card className="overflow-hidden border-black/5 shadow-[0_8px_28px_rgba(24,48,40,.04)]">
          <CardHeader className="flex flex-row items-center justify-between border-b border-black/5 px-5 py-4"><div><CardTitle className="text-xl">Verification queue</CardTitle><p className="mt-1 text-xs text-muted-foreground">Oldest submissions first, ready for operator review.</p></div><Link href="/admin/properties" className="text-xs font-bold text-[#1c5b46]">View all</Link></CardHeader>
          <CardContent className="p-0">{pendingProperties?.length ? pendingProperties.map((property) => { const host = single<{ display_name: string | null }>(property.host_profiles); return <Link key={property.id} href={`/admin/properties/${property.id}`} className="flex items-center gap-4 border-b border-black/5 px-5 py-4 transition hover:bg-[#fafbf9] last:border-0"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#e8efe9] text-[#1b5d47]"><Building2 className="size-5" /></span><div className="min-w-0 flex-1"><p className="truncate font-bold">{property.name}</p><p className="mt-1 truncate text-xs text-muted-foreground">{host?.display_name ?? 'Unknown host'} · {property.district ?? 'No district'} · {property.property_type}</p></div><div className="hidden text-right sm:block"><Badge variant="secondary" className="text-[9px] uppercase">Level {property.verification_level}</Badge><p className="mt-1 text-[10px] text-muted-foreground">{new Date(property.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p></div><ChevronRight className="size-4 text-muted-foreground" /></Link> }) : <div className="px-5 py-12 text-center"><BadgeCheck className="mx-auto size-10 text-[#2b7a5c]" /><p className="mt-3 font-bold">No pending submissions</p><p className="mt-1 text-sm text-muted-foreground">The verification queue is clear.</p></div>}</CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-black/5 shadow-[0_8px_28px_rgba(24,48,40,.04)]"><CardHeader><CardTitle className="text-xl">Properties by district</CardTitle><p className="mt-1 text-xs text-muted-foreground">Published marketplace inventory.</p></CardHeader><CardContent className="space-y-4">{topDistricts.length ? topDistricts.map(([district, count]) => <div key={district}><div className="flex items-center justify-between text-xs"><span className="font-semibold">{district}</span><span className="text-muted-foreground">{count}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e6ebe7]"><div className="h-full rounded-full bg-[#2b7a5c]" style={{ width: `${Math.max(4, Math.round((count / districtTotal) * 100))}%` }} /></div></div>) : <p className="text-sm text-muted-foreground">No published inventory yet.</p>}</CardContent></Card>
          <Card className="border-black/5 bg-[#fbf5e8] shadow-[0_8px_28px_rgba(24,48,40,.04)]"><CardContent className="p-5"><div className="flex items-center gap-2 text-[#9a651e]"><TrendingUp className="size-4" /><span className="text-xs font-bold uppercase tracking-[.16em]">Operator focus</span></div><p className="mt-3 text-base font-bold leading-6 text-[#4d402e]">Keep the verification queue moving before adding new inventory campaigns.</p><Link href="/admin/verification" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#8a5c18]">Open verification centre <ArrowRight className="size-3.5" /></Link></CardContent></Card>
        </div>
      </div>
    </div>
  )
}
