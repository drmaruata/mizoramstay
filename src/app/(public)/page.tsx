import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, BadgeCheck, Leaf, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SearchPanel } from '@/components/public/search-panel'
import { PropertyCard } from '@/components/public/property-card'
import { createClient } from '@/lib/supabase/server'
import { createSupabasePropertyService } from '@/features/properties/property.service'

export default async function HomePage() {
  const db = await createClient()
  const service = createSupabasePropertyService(db)
  const properties = await service.listPublished()

  const { data: destinations } = await db
    .from('destinations')
    .select('slug, name, district, short_description, hero_image')
    .eq('status', 'PUBLISHED')
    .order('name', { ascending: true })

  const destinationCards = (destinations ?? []).map((d) => ({
    slug: d.slug,
    name: d.name,
    district: d.district,
    blurb: d.short_description ?? '',
    image: d.hero_image ?? 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=80',
  }))

  return <main>
    <section className="hero-grid overflow-hidden border-b"><div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:px-6 md:py-20 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
      <div><div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-card/80 px-3 py-1.5 text-xs font-semibold text-primary"><Sparkles className="size-3.5" />Verified stays across Mizoram</div><h1 className="max-w-2xl text-balance text-4xl font-black tracking-tight md:text-6xl">Discover Mizoram. <span className="text-primary">Stay local.</span> Travel deeper.</h1><p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">Find trusted homestays, local hosts and destinations with clear verification, practical travel information and a booking experience built for Mizoram.</p><div className="mt-8"><SearchPanel /></div></div>
      <div className="relative min-h-[420px] overflow-hidden rounded-[2rem] border bg-card shadow-xl"><Image src="https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=85" alt="Mizoram mountain landscape" fill priority sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" /><div className="absolute inset-x-5 bottom-5 rounded-2xl border bg-background/90 p-4 backdrop-blur"><div className="flex items-center justify-between"><div><p className="font-bold">Local knowledge, visible trust</p><p className="text-sm text-muted-foreground">Identity • documents • tourism registration</p></div><BadgeCheck className="size-6 text-primary" /></div></div></div>
    </div></section>

    <section className="mx-auto max-w-7xl px-4 py-14 md:px-6"><div className="flex items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[.18em] text-primary">Explore</p><h2 className="mt-2 text-3xl font-black">Start with a destination</h2></div><Link href="/destinations" className="hidden items-center gap-1 text-sm font-semibold text-primary sm:flex">View all <ArrowRight className="size-4" /></Link></div><div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{destinationCards.map((destination) => <Link key={destination.slug} href={`/destinations/${destination.slug}`} className="group relative aspect-[4/5] overflow-hidden rounded-2xl"><Image src={destination.image} alt={destination.name} fill sizes="(max-width:640px) 50vw, 25vw" className="object-cover transition duration-500 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" /><div className="absolute inset-x-4 bottom-4 text-white"><p className="text-xl font-black">{destination.name}</p><p className="mt-1 text-sm text-white/80">{destination.blurb}</p></div></Link>)}</div></section>

    <section className="border-y bg-card"><div className="mx-auto max-w-7xl px-4 py-14 md:px-6"><div><p className="text-sm font-semibold uppercase tracking-[.18em] text-primary">Stays we would start with</p><h2 className="mt-2 text-3xl font-black">Verified homestays</h2></div><div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-4">{properties.map((property) => <PropertyCard key={property.id} property={property} />)}</div></div></section>

    <section className="mx-auto max-w-7xl px-4 py-14 md:px-6"><div className="grid gap-5 md:grid-cols-3"><Card><CardContent className="p-6"><ShieldCheck className="size-7 text-primary" /><h3 className="mt-4 font-bold">Trust before conversion</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Verification is a product feature. Guests can see exactly what has been checked instead of seeing an unexplained trust badge.</p></CardContent></Card><Card><CardContent className="p-6"><Leaf className="size-7 text-primary" /><h3 className="mt-4 font-bold">Stay local</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Prioritize local operators, community stays and destination-specific information that generic OTAs do not surface well.</p></CardContent></Card><Card><CardContent className="p-6"><Sparkles className="size-7 text-primary" /><h3 className="mt-4 font-bold">Built for the marketplace</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Structured property, inventory, booking and payment data creates the foundation for future analytics and AI.</p></CardContent></Card></div></section>

    <section className="bg-primary text-primary-foreground"><div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-12 md:flex-row md:items-center md:justify-between md:px-6"><div><p className="text-2xl font-black">Run a homestay?</p><p className="mt-1 text-primary-foreground/75">Get a digital property profile and manage bookings in one place.</p></div><Link href="/host/dashboard"><Button variant="secondary" size="lg">Open host portal <ArrowRight className="size-4" /></Button></Link></div></section>
  </main>
}
