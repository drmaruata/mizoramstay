import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function DestinationsPage() {
  const db = await createClient()
  const { data: destinations } = await db
    .from('destinations')
    .select('slug, name, short_description, hero_image')
    .eq('status', 'PUBLISHED')
    .order('name', { ascending: true })
  const cards = (destinations ?? []).map((d) => ({
    slug: d.slug,
    name: d.name,
    blurb: d.short_description ?? '',
    image: d.hero_image ?? 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=80',
  }))
  return <main className="mx-auto max-w-7xl px-4 py-12 md:px-6"><p className="text-sm font-semibold uppercase tracking-[.18em] text-primary">Mizoram</p><h1 className="mt-2 text-4xl font-black">Explore by destination</h1><p className="mt-4 max-w-2xl text-muted-foreground">Destination pages are the SEO foundation for the marketplace, with stays, travel information, attractions and future experiences connected to each place.</p><div className="mt-10 grid gap-6 md:grid-cols-2">{cards.map((d) => <Link key={d.slug} href={`/destinations/${d.slug}`} className="group overflow-hidden rounded-3xl border bg-card"><div className="relative aspect-[16/8]"><Image src={d.image} alt={d.name} fill sizes="(max-width:768px) 100vw, 50vw" className="object-cover transition duration-500 group-hover:scale-105" /></div><div className="flex items-center justify-between p-6"><div><h2 className="text-2xl font-black">{d.name}</h2><p className="mt-2 text-sm text-muted-foreground">{d.blurb}</p></div><ArrowRight className="size-5 text-primary" /></div></Link>)}</div></main>
}
