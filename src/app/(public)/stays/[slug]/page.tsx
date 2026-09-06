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

const FALLBACK_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=80'
const FALLBACK_ROOM_IMAGE = 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const db = await createClient()
  const service = createSupabasePropertyService(db)
  const property = await service.findBySlug(slug)
  return { title: property?.name ?? 'Stay', description: property?.description }
}

export default async function PropertyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const db = await createClient()
  const service = createSupabasePropertyService(db)
  const property = await service.findBySlug(slug)
  if (!property) notFound()
  void trackEvent({ eventName: 'property_viewed', properties: { property_slug: slug }, pagePath: `/stays/${slug}` })

  const propertyGallery = property.media.filter((media) => !media.roomId)
  const gallery = propertyGallery.length > 0 ? propertyGallery : [{ id: 'fallback', url: property.imageUrl || FALLBACK_PROPERTY_IMAGE, altText: property.name, sortOrder: 0, isHero: true, roomId: null }]

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <div className="grid gap-3 md:grid-cols-[2fr_1fr] md:grid-rows-2">
        <div className="relative min-h-[320px] overflow-hidden rounded-2xl md:row-span-2 md:min-h-[510px]">
          <Image src={gallery[0].url} alt={gallery[0].altText || property.name} fill priority unoptimized sizes="(max-width:768px) 100vw, 66vw" className="object-cover" />
        </div>
        {gallery.slice(1, 5).map((media) => (
          <div key={media.id} className="relative hidden min-h-[150px] overflow-hidden rounded-2xl md:block">
            <Image src={media.url} alt={media.altText || property.name} fill unoptimized sizes="25vw" className="object-cover" />
          </div>
        ))}
        {gallery.length === 1 && (
          <>
            <div className="relative min-h-[150px] overflow-hidden rounded-2xl md:block">
              <Image src={FALLBACK_PROPERTY_IMAGE} alt="Property interior" fill unoptimized sizes="25vw" className="object-cover" />
            </div>
            <div className="relative min-h-[150px] overflow-hidden rounded-2xl md:block">
              <Image src={FALLBACK_ROOM_IMAGE} alt="Room interior" fill unoptimized sizes="25vw" className="object-cover" />
            </div>
          </>
        )}
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_390px]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-primary/20 bg-primary/5 text-primary"><CheckCircle2 className="mr-1 size-3.5" />Platform verified</Badge>
            {property.tourismRegistered && <Badge className="border-accent/30 bg-accent/10 text-foreground">Tourism registration verified</Badge>}
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-tight">{property.name}</h1>
          <p className="mt-2 flex items-center gap-2 text-muted-foreground"><MapPin className="size-4 text-primary" />{property.location}, {property.district} · Hosted by {property.hostName}</p>
          <div className="mt-5 flex items-center gap-4"><span className="flex items-center gap-1 font-semibold"><Star className="size-4 fill-current text-accent" />{property.rating}</span><span className="text-sm text-muted-foreground">{property.reviewCount} verified reviews</span></div>
          <p className="mt-8 max-w-3xl leading-8 text-muted-foreground">{property.description}</p>

          <section className="mt-10">
            <h2 className="text-2xl font-black">Rooms you can book</h2>
            <p className="mt-1 text-sm text-muted-foreground">Photos below are attached to the exact room, so you can see what you are selecting before payment.</p>
            <div className="mt-5 space-y-5">
              {property.rooms.map((room) => {
                const roomHero = room.images[0]?.url ?? FALLBACK_ROOM_IMAGE
                return (
                  <Card key={room.id} className="overflow-hidden">
                    <div className="grid md:grid-cols-[220px_1fr]">
                      <div className="relative min-h-[190px] bg-muted">
                        <Image src={roomHero} alt={room.images[0]?.altText || `${room.name} at ${property.name}`} fill unoptimized sizes="220px" className="object-cover" />
                        {room.images.length > 0 && <span className="absolute bottom-3 left-3 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-bold text-white">{room.images.length} room photo{room.images.length === 1 ? '' : 's'}</span>}
                      </div>
                      <CardContent className="p-5">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <h3 className="text-xl font-black">{room.name}</h3>
                            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-primary">{room.roomType || 'Room'}</p>
                          </div>
                          <div className="text-right"><p className="text-lg font-black">{formatINR(room.price)}</p><p className="text-xs text-muted-foreground">per night</p></div>
                        </div>
                        {room.description && <p className="mt-4 text-sm leading-6 text-muted-foreground">{room.description}</p>}
                        <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                          <span className="flex items-center gap-1.5"><Users className="size-3.5 text-primary" />Up to {room.maxGuests}</span>
                          <span className="flex items-center gap-1.5"><BedDouble className="size-3.5 text-primary" />{room.beds || 'Comfortable bedding'}</span>
                          <span className="flex items-center gap-1.5"><Bath className="size-3.5 text-primary" />{room.bathroom || 'Private bathroom'}</span>
                        </div>
                        {room.images.length > 1 && <div className="mt-4 grid grid-cols-4 gap-2">{room.images.slice(1, 5).map((image) => <div key={image.id} className="relative aspect-[4/3] overflow-hidden rounded-lg"><Image src={image.url} alt={image.altText || room.name} fill unoptimized sizes="120px" className="object-cover" /></div>)}</div>}
                        <div className="mt-5 flex justify-end"><Link href={`/booking/new?property=${property.id}&room=${room.id}`}><Button>Book this room</Button></Link></div>
                      </CardContent>
                    </div>
                  </Card>
                )
              })}
            </div>
          </section>

          <section className="mt-10">
            <h2 className="text-2xl font-black">What’s verified</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {['Identity verified', 'Documents verified', 'Tourism registration', 'Property verified'].map((item) => <div key={item} className="flex gap-3 rounded-2xl border bg-card p-4"><ShieldCheck className="size-5 shrink-0 text-primary" /><div><p className="font-semibold">{item}</p><p className="mt-1 text-xs text-muted-foreground">{item === 'Property verified' ? `Platform verification level: ${property.verificationLevel}.` : 'Verification status is recorded in the property profile.'}</p></div></div>)}
            </div>
          </section>

          <section className="mt-10"><h2 className="text-2xl font-black">Amenities</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{property.amenities.map((amenity) => <div key={amenity} className="flex items-center gap-3 rounded-xl border bg-card p-3 text-sm"><Wifi className="size-4 text-primary" />{amenity}</div>)}</div></section>
          <section className="mt-10"><h2 className="text-2xl font-black">Location</h2><div className="mt-4 grid min-h-56 place-items-center rounded-2xl border bg-card text-center"><div><MapPin className="mx-auto size-9 text-primary" /><p className="mt-2 font-semibold">{property.location}, Mizoram</p><p className="mt-1 text-sm text-muted-foreground">Map provider abstraction ready for production integration.</p></div></div></section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <Card className="overflow-hidden">
            <CardHeader><CardTitle>Choose your room</CardTitle><p className="text-sm text-muted-foreground">{property.cancellation}</p></CardHeader>
            <CardContent className="space-y-4">
              {property.rooms.map((room) => (
                <Link key={room.id} href={`/booking/new?property=${property.id}&room=${room.id}`} className="block rounded-2xl border p-3 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
                  <div className="flex gap-3">
                    <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted"><Image src={room.images[0]?.url ?? FALLBACK_ROOM_IMAGE} alt={room.name} fill unoptimized sizes="80px" className="object-cover" /></div>
                    <div className="min-w-0 flex-1"><p className="font-bold">{room.name}</p><p className="mt-1 text-xs text-muted-foreground">Up to {room.maxGuests} · {room.beds || 'Room bedding'}</p><p className="mt-2 font-black">{formatINR(room.price)} <span className="text-xs font-normal text-muted-foreground">/ night</span></p></div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  )
}
