import { Suspense } from 'react'
import { PropertyCard } from '@/components/public/property-card'
import { SearchPanel } from '@/components/public/search-panel'
import { trackEvent } from '@/lib/analytics'
import { createClient } from '@/lib/supabase/server'
import { createSupabasePropertyService } from '@/features/properties/property.service'

async function Results({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  const destination = typeof params.destination === 'string' ? params.destination : ''
  const district = typeof params.district === 'string' ? params.district : ''
  const propertyType = typeof params.type === 'string' ? params.type : ''
  const minPrice = typeof params.minPrice === 'string' ? Number(params.minPrice) : undefined
  const maxPrice = typeof params.maxPrice === 'string' ? Number(params.maxPrice) : undefined
  const minVerification = typeof params.verified === 'string' ? Number(params.verified) : undefined
  const amenitiesParam = params.amenities
  const amenities = Array.isArray(amenitiesParam)
    ? amenitiesParam
    : typeof amenitiesParam === 'string' && amenitiesParam
      ? amenitiesParam.split(',')
      : undefined

  const db = await createClient()
  const service = createSupabasePropertyService(db)
  const properties = await service.listPublished({
    destination: destination || undefined,
    district: district || undefined,
    propertyType: propertyType || undefined,
    minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
    amenities,
    minVerification: Number.isFinite(minVerification) ? minVerification : undefined,
  })
  void trackEvent({ eventName: 'search_started', properties: { destination: destination || null }, pagePath: '/search' })
  return <main className="mx-auto max-w-7xl px-4 py-7 md:px-6"><SearchPanel compact /><div className="mt-8 flex items-end justify-between"><div><p className="text-sm text-muted-foreground">{properties.length} stays</p><h1 className="mt-1 text-3xl font-black">Stays{destination ? ` in ${destination}` : ' across Mizoram'}</h1></div></div><div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{properties.map((p) => <PropertyCard key={p.id} property={p} />)}</div></main>
}
export default function SearchPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) { return <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-12">Loading stays…</div>}><Results searchParams={props.searchParams} /></Suspense> }
