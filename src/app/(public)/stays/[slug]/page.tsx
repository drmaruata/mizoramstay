import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Bath, BedDouble, CheckCircle2, MapPin, ShieldCheck, Star, Users, Wifi } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { createSupabasePropertyService } from '@/features/properties/property.service'
import { formatINR } from '@/lib/utils'
import { trackEvent } from '@/lib/analytics'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const db = await createClient()
  const service = createSupabasePropertyService(db)
  const p = await service.findBySlug(slug)
  return { title: p?.name ?? 'Stay', description: p?.description }
}

export default async function PropertyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const db = await createClient()
  const service = createSupabasePropertyService(db)
  const property = await service.findBySlug(slug)
  if (!property) notFound()
  void trackEvent({ eventName: 'property_viewed', properties: { property_slug: slug }, pagePath: `/stays/${slug}` })
  return <main className="mx-auto max-w-7xl px-4 py-6 md:px-6"><div className="grid gap-3 md:grid-cols-[2fr_1fr]"><div className="relative min-h-[320px] overflow-hidden rounded-2xl md:min-h-[500px]"><Image src={property.imageUrl} alt={property.name} fill priority sizes="(max-width:768px) 100vw, 66vw" className="object-cover" /></div><div className="grid grid-cols-2 gap-3"><div className="relative overflow-hidden rounded-2xl"><Image src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80" alt="Room interior" fill sizes="25vw" className="object-cover" /></div><div className="relative overflow-hidden rounded-2xl"><Image src="https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=80" alt="Homestay space" fill sizes="25vw" className="object-cover" /></div></div></div>
  <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]"><div><div className="flex flex-wrap items-center gap-2"><Badge className="border-primary/20 bg-primary/5 text-primary"><CheckCircle2 className="mr-1 size-3.5" />Platform verified</Badge>{property.tourismRegistered && <Badge className="border-accent/30 bg-accent/10 text-foreground">Tourism registration verified</Badge>}</div><h1 className="mt-4 text-4xl font-black tracking-tight">{property.name}</h1><p className="mt-2 flex items-center gap-2 text-muted-foreground"><MapPin className="size-4 text-primary" />{property.location}, {property.district} • Hosted by {property.hostName}</p><div className="mt-5 flex items-center gap-4"><span className="flex items-center gap-1 font-semibold"><Star className="size-4 fill-current text-accent" />{property.rating}</span><span className="text-sm text-muted-foreground">{property.reviewCount} verified reviews</span></div><p className="mt-8 max-w-3xl leading-8 text-muted-foreground">{property.description}</p>
  <section className="mt-10"><h2 className="text-2xl font-black">What’s verified</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="flex gap-3 rounded-2xl border bg-card p-4"><ShieldCheck className="size-5 shrink-0 text-primary" /><div><p className="font-semibold">Identity verified</p><p className="mt-1 text-xs text-muted-foreground">Host identity has been checked by the platform.</p></div></div><div className="flex gap-3 rounded-2xl border bg-card p-4"><ShieldCheck className="size-5 shrink-0 text-primary" /><div><p className="font-semibold">Documents verified</p><p className="mt-1 text-xs text-muted-foreground">Submitted property documents have passed review.</p></div></div><div className="flex gap-3 rounded-2xl border bg-card p-4"><ShieldCheck className="size-5 shrink-0 text-primary" /><div><p className="font-semibold">Tourism registration</p><p className="mt-1 text-xs text-muted-foreground">Registration status recorded in the property profile.</p></div></div><div className="flex gap-3 rounded-2xl border bg-card p-4"><ShieldCheck className="size-5 shrink-0 text-primary" /><div><p className="font-semibold">Property verified</p><p className="mt-1 text-xs text-muted-foreground">Platform verification level: {property.verificationLevel}.</p></div></div></div></section>
  <section className="mt-10"><h2 className="text-2xl font-black">Amenities</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{property.amenities.map((a) => <div key={a} className="flex items-center gap-3 rounded-xl border bg-card p-3 text-sm"><Wifi className="size-4 text-primary" />{a}</div>)}</div></section>
  <section className="mt-10"><h2 className="text-2xl font-black">Location</h2><div className="mt-4 grid min-h-56 place-items-center rounded-2xl border bg-card text-center"><div><MapPin className="mx-auto size-9 text-primary" /><p className="mt-2 font-semibold">{property.location}, Mizoram</p><p className="mt-1 text-sm text-muted-foreground">Map provider abstraction ready for production integration.</p></div></div></section></div>
  <aside className="lg:sticky lg:top-24 lg:h-fit"><Card className="overflow-hidden"><CardHeader><CardTitle>Choose your room</CardTitle><p className="text-sm text-muted-foreground">{property.cancellation}</p></CardHeader><CardContent className="space-y-4">{property.rooms.map((room) => <div key={room.id} className="rounded-2xl border p-4"><p className="font-bold">{room.name}</p><div className="mt-2 grid gap-1 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Users className="size-3.5" />Up to {room.maxGuests}</span><span className="flex items-center gap-1"><BedDouble className="size-3.5" />{room.beds}</span><span className="flex items-center gap-1"><Bath className="size-3.5" />{room.bathroom}</span></div><div className="mt-4 flex items-end justify-between"><div><span className="text-lg font-black">{formatINR(room.price)}</span><span className="text-xs text-muted-foreground"> / night</span></div><Link href={`/booking/new?property=${property.id}&room=${room.id}`}><Button>Book</Button></Link></div></div>)}</CardContent></Card></aside></div></main>
}
