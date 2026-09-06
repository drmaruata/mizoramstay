import Link from 'next/link'
import { ArrowRight, Building2, CheckCircle2, MoreHorizontal, Search, ShieldAlert } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/session'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

type AdminPropertyRow = {
  id: string
  slug: string
  name: string
  district: string | null
  town: string | null
  village: string | null
  property_type: string
  status: string
  verification_level: number | null
  hero_image: string | null
  created_at: string
}

export default async function AdminPropertiesPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] | undefined }> }) {
  await requireAdmin()
  const params = await searchParams
  const queryText = typeof params.q === 'string' ? params.q.trim() : ''
  const db = createAdminClient()

  let query = db
    .from('properties')
    .select('id, slug, name, district, town, village, property_type, status, verification_level, hero_image, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(100)

  if (queryText) {
    const escaped = queryText.replace(/[%(),]/g, ' ')
    query = query.or(`name.ilike.%${escaped}%,district.ilike.%${escaped}%,town.ilike.%${escaped}%,village.ilike.%${escaped}%`)
  }

  const { data, count, error } = await query
  const rows = (data ?? []) as AdminPropertyRow[]

  const publishedCount = rows.filter((row) => row.status === 'PUBLISHED').length
  const pendingCount = rows.filter((row) => row.status === 'PENDING_REVIEW').length
  const verifiedCount = rows.filter((row) => Number(row.verification_level ?? 0) >= 3).length
  const coverage = rows.length ? Math.round((verifiedCount / rows.length) * 100) : 0

  return (
    <div className="mx-auto max-w-[1240px] space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#778780]">Marketplace inventory</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Properties</h1>
          <p className="mt-2 text-sm text-muted-foreground">Review, verify and maintain the accommodation catalogue.</p>
        </div>
        <Button className="bg-[#183a31] hover:bg-[#183a31]/90" disabled>
          Export inventory <ArrowRight className="size-4" />
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-black/5 shadow-sm"><CardContent className="p-5"><p className="text-xs font-bold uppercase tracking-[.15em] text-[#7c8a84]">Published</p><p className="mt-2 text-3xl font-black">{publishedCount}</p><p className="mt-1 text-xs text-muted-foreground">Live properties</p></CardContent></Card>
        <Card className="border-black/5 shadow-sm"><CardContent className="p-5"><p className="text-xs font-bold uppercase tracking-[.15em] text-[#7c8a84]">Pending review</p><p className="mt-2 text-3xl font-black text-[#9a651e]">{pendingCount}</p><p className="mt-1 text-xs text-muted-foreground">Awaiting operator action</p></CardContent></Card>
        <Card className="border-black/5 shadow-sm"><CardContent className="p-5"><p className="text-xs font-bold uppercase tracking-[.15em] text-[#7c8a84]">Verification coverage</p><p className="mt-2 text-3xl font-black">{coverage}%</p><p className="mt-1 text-xs text-muted-foreground">Level 3+ verification</p></CardContent></Card>
      </div>

      <Card className="overflow-hidden border-black/5 shadow-sm">
        <CardHeader className="border-b border-black/5 px-5 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-xl">Property inventory</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Live property records from the marketplace database.</p>
            </div>
            <form action="/admin/properties" className="flex w-full gap-2 md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <Input name="q" defaultValue={queryText} className="bg-[#fafbf9] pl-9" placeholder="Search properties, districts..." />
              </div>
              <Button type="submit" className="bg-[#183a31] hover:bg-[#183a31]/90">Search</Button>
            </form>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="px-5 py-12 text-center"><ShieldAlert className="mx-auto size-10 text-[#b36d24]" /><p className="mt-3 font-bold">Unable to load properties</p><p className="mt-1 text-sm text-muted-foreground">{error.message}</p></div>
          ) : rows.length ? (
            <>
              <div className="hidden grid-cols-[1.9fr_1fr_1fr_1fr_44px] gap-4 border-b border-black/5 bg-[#fafbf9] px-5 py-3 text-[10px] font-bold uppercase tracking-[.12em] text-[#7d8c85] lg:grid"><span>Property</span><span>Location</span><span>Verification</span><span>Status</span><span /></div>
              {rows.map((row) => {
                const location = row.town || row.village || row.district || 'Location pending'
                const published = row.status === 'PUBLISHED'
                return (
                  <Link key={row.id} href={`/admin/verification?property=${encodeURIComponent(row.id)}`} className="grid gap-3 border-b border-black/5 px-5 py-4 transition hover:bg-[#fafbf9] last:border-0 lg:grid-cols-[1.9fr_1fr_1fr_1fr_44px] lg:items-center lg:gap-4">
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#e8efea] text-[#1b5d47]">
                        {row.hero_image ? <img src={row.hero_image} alt="" className="size-full object-cover" /> : <Building2 className="size-5" />}
                      </span>
                      <div className="min-w-0"><p className="truncate font-bold">{row.name}</p><p className="mt-1 text-xs text-muted-foreground lg:hidden">{location} · Level {row.verification_level ?? 0}</p></div>
                    </div>
                    <p className="hidden truncate text-sm text-muted-foreground lg:block">{location}</p>
                    <Badge variant="secondary" className="hidden w-fit text-[9px] uppercase lg:inline-flex">Level {row.verification_level ?? 0}</Badge>
                    <div className="flex items-center gap-2"><span className={`size-2 rounded-full ${published ? 'bg-emerald-500' : row.status === 'PENDING_REVIEW' ? 'bg-[#d4942f]' : 'bg-slate-400'}`} /><span className="text-xs font-semibold">{row.status.replace(/_/g, ' ')}</span></div>
                    <MoreHorizontal className="hidden size-4 text-muted-foreground lg:block" />
                  </Link>
                )
              })}
            </>
          ) : (
            <div className="px-5 py-14 text-center"><Building2 className="mx-auto size-10 text-muted-foreground" /><p className="mt-3 font-bold">No properties found</p><p className="mt-1 text-sm text-muted-foreground">{queryText ? 'Try a different search.' : 'Properties will appear here when hosts register them.'}</p></div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-black/5 bg-[#eef3ee] shadow-sm"><CardContent className="flex items-start gap-3 p-5"><CheckCircle2 className="mt-0.5 size-5 text-[#2b7a5c]" /><div><p className="font-bold">Verification policy</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Platform verification and government tourism registration are shown as separate signals.</p></div></CardContent></Card>
        <Card className="border-black/5 bg-[#fbf2e3] shadow-sm"><CardContent className="flex items-start gap-3 p-5"><ShieldAlert className="mt-0.5 size-5 text-[#9a651e]" /><div><p className="font-bold">Inventory scope</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Showing {count ?? rows.length} property record{(count ?? rows.length) === 1 ? '' : 's'} from the live database.</p></div></CardContent></Card>
      </div>
    </div>
  )
}
