import Image from 'next/image'
import { notFound } from 'next/navigation'
import { MapPin, Route, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PropertyCard } from '@/components/public/property-card'
import { createClient } from '@/lib/supabase/server'
import { createSupabasePropertyService } from '@/features/properties/property.service'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const db = await createClient()
  const { data: destination } = await db
    .from('destinations')
    .select('name, short_description')
    .eq('slug', slug)
    .eq('status', 'PUBLISHED')
    .maybeSingle()
  return { title: destination?.name ?? 'Destination', description: destination?.short_description ?? undefined }
}
export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const db = await createClient()
  const { data: d } = await db
    .from('destinations')
    .select('slug, name, district, short_description, hero_image, description, best_time')
    .eq('slug', slug)
    .eq('status', 'PUBLISHED')
    .maybeSingle()
  if (!d) notFound()
  const service = createSupabasePropertyService(db)
  const stays = await service.listPublished({ destination: d.name })
  const blurb = d.short_description ?? d.description ?? ''
  const image = d.hero_image ?? 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=80'
  return <main><section className="relative overflow-hidden"><div className="relative mx-auto h-[420px] max-w-7xl overflow-hidden md:rounded-b-[2rem]"><Image src={image} alt={d.name} fill priority sizes="100vw" className="object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" /><div className="absolute inset-x-5 bottom-8 text-white md:inset-x-10"><Badge className="border-white/30 bg-white/15 text-white">{d.district} district</Badge><h1 className="mt-3 text-4xl font-black md:text-6xl">{d.name}</h1><p className="mt-3 max-w-2xl text-base text-white/80 md:text-lg">{blurb}</p></div></div></section><div className="mx-auto max-w-7xl px-4 py-12 md:px-6"><div className="grid gap-6 md:grid-cols-3"><div className="rounded-2xl border bg-card p-6"><MapPin className="size-6 text-primary" /><h2 className="mt-4 font-bold">Travel information</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Use this page as the structured destination record. Transport, road conditions, permit information and emergency guidance can be connected to live data later.</p></div><div className="rounded-2xl border bg-card p-6"><Route className="size-6 text-primary" /><h2 className="mt-4 font-bold">Suggested stay</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Build trip length and travel-time recommendations from the destination database rather than static generic content.</p></div><div className="rounded-2xl border bg-card p-6"><Sparkles className="size-6 text-primary" /><h2 className="mt-4 font-bold">Coming later</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Experiences, transport and attractions will connect to this destination record as the marketplace expands.</p></div></div><div className="mt-14"><h2 className="text-3xl font-black">Stays near {d.name}</h2><div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{stays.map((property) => <PropertyCard key={property.id} property={property} />)}</div></div></div></main> }
