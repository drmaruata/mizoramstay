import Link from 'next/link'
import { ArrowUpRight, BadgeCheck, BedDouble, CirclePlus, FileCheck2, Home, MapPin, Plus, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PortalShell } from '@/components/host/portal-shell'
import { HostPropertyForm } from '@/components/host/property-form'
import { createClient } from '@/lib/supabase/server'
import { HostPropertyService } from '@/features/properties/host.service'

export const dynamic = 'force-dynamic'

function statusClass(status: string) {
  if (status === 'PUBLISHED') return 'bg-[#e6f1e9] text-[#1c6249]'
  if (status === 'PENDING_REVIEW') return 'bg-[#fbefd9] text-[#95651c]'
  if (status === 'SUSPENDED') return 'bg-red-50 text-red-700'
  return 'bg-[#eef1ee] text-[#66766f]'
}

export default async function HostPropertiesPage() {
  const db = await createClient()
  const service = new HostPropertyService(db)
  const hostProfileId = await service.getHostProfileId()
  let properties: Awaited<ReturnType<typeof service.listForHost>> = []
  if (hostProfileId) properties = await service.listForHost(hostProfileId)

  return (
    <PortalShell>
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#6f8179]">Listing studio</p><h1 className="mt-2 text-3xl font-black tracking-tight">Your properties</h1><p className="mt-2 text-sm text-muted-foreground">Create, refine and prepare every stay for the marketplace.</p></div>{hostProfileId && <a href="#new-property"><Button className="bg-[#154637] hover:bg-[#154637]/90"><Plus className="size-4" /> Add property</Button></a>}</div>

        {!hostProfileId ? <Card className="mt-6 border-black/5 shadow-sm"><CardContent className="p-8 text-center"><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#e8efe9] text-[#1b5d47]"><Home className="size-6" /></div><p className="mt-4 text-lg font-black">Complete your host profile first</p><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Your host profile connects your identity, payout information and property listings.</p><Button className="mt-5 bg-[#154637]">Start host setup</Button></CardContent></Card> : <>
          <div className="mt-6 grid gap-4 sm:grid-cols-3"><Card className="border-black/5 shadow-sm"><CardContent className="p-5"><p className="text-xs font-bold uppercase tracking-[.15em] text-[#7b8b84]">Live</p><p className="mt-2 text-3xl font-black">{properties.filter((p) => p.status === 'PUBLISHED').length}</p><p className="mt-1 text-xs text-muted-foreground">Published properties</p></CardContent></Card><Card className="border-black/5 shadow-sm"><CardContent className="p-5"><p className="text-xs font-bold uppercase tracking-[.15em] text-[#7b8b84]">Review</p><p className="mt-2 text-3xl font-black">{properties.filter((p) => p.status === 'PENDING_REVIEW').length}</p><p className="mt-1 text-xs text-muted-foreground">Awaiting verification</p></CardContent></Card><Card className="border-black/5 shadow-sm"><CardContent className="p-5"><p className="text-xs font-bold uppercase tracking-[.15em] text-[#7b8b84]">Inventory</p><p className="mt-2 text-3xl font-black">{properties.reduce((sum, p) => sum + p.roomCount, 0)}</p><p className="mt-1 text-xs text-muted-foreground">Total rooms across listings</p></CardContent></Card></div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {properties.map((property) => <Card key={property.id} className="group overflow-hidden border-black/5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="relative h-48 overflow-hidden bg-[#dfe7e1]">{property.heroImage ? <img src={property.heroImage} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_30%_35%,rgba(44,101,78,.24),transparent_30%),radial-gradient(circle_at_70%_70%,rgba(225,176,91,.18),transparent_28%)]"><Home className="size-10 text-[#47705f]" /></div>}<span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${statusClass(property.status)}`}>{property.status.replace(/_/g, ' ')}</span><span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-bold text-[#35564a]">Level {property.verificationLevel}</span></div><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-lg font-black">{property.name}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="size-3.5" />{property.district || 'District not set'}</p></div><Badge variant="secondary" className="shrink-0 text-[9px] uppercase">{property.propertyType.replace(/_/g, ' ')}</Badge></div><div className="mt-4 grid grid-cols-2 gap-2 text-xs"><span className="flex items-center gap-1.5 rounded-xl bg-[#f4f7f4] px-3 py-2 text-[#65766f]"><BedDouble className="size-3.5" />{property.roomCount} rooms</span><span className="flex items-center gap-1.5 rounded-xl bg-[#f4f7f4] px-3 py-2 text-[#65766f]">{property.priceFrom != null ? `₹${property.priceFrom} / night` : 'Price not set'}</span></div><Link href={`/host/properties/${property.slug}`} className="mt-4 inline-flex w-full items-center justify-between rounded-xl border border-[#d8e0db] px-3.5 py-2.5 text-xs font-bold text-[#1d5b47] transition hover:bg-[#f7faf7]">Manage listing <ArrowUpRight className="size-4" /></Link></CardContent></Card>)}
            {properties.length === 0 && <Card className="md:col-span-2 xl:col-span-3 border-dashed border-2 border-[#d8e0db] shadow-none"><CardContent className="flex flex-col items-center p-10 text-center"><CirclePlus className="size-9 text-[#668177]" /><p className="mt-3 text-lg font-black">No properties yet</p><p className="mt-1 max-w-md text-sm text-muted-foreground">Start with the basics. You can add rooms, facilities, photos and pricing as you complete the listing.</p></CardContent></Card>}
          </div>

          <Card id="new-property" className="mt-7 border-black/5 shadow-sm"><CardHeader className="border-b border-black/5 bg-[#fafbf8] px-5 py-4"><div className="flex items-center justify-between gap-4"><div><CardTitle className="flex items-center gap-2 text-xl"><Plus className="size-5 text-[#1d5b47]" /> New property</CardTitle><p className="mt-1 text-xs text-muted-foreground">Build the listing in small, reviewable steps.</p></div><div className="hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[.12em] text-[#72837b] sm:flex"><FileCheck2 className="size-4" /> Draft safe</div></div></CardHeader><CardContent className="p-5"><HostPropertyForm /></CardContent></Card>
        </>}
      </div>
    </PortalShell>
  )
}
