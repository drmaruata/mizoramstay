import Image from 'next/image'
import Link from 'next/link'
import { BadgeCheck, MapPin, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { WishlistButton } from '@/components/public/wishlist-button'
import type { Property } from '@/types/domain'
import { formatINR } from '@/lib/utils'

export function PropertyCard({ property }: { property: Property }) {
  return <article className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <div className="relative aspect-[4/3] overflow-hidden"><Image src={property.imageUrl} alt={property.name} fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" />
      <div className="absolute left-3 top-3 flex gap-2"><Badge className="border-white/70 bg-white/90 text-foreground"><BadgeCheck className="mr-1 size-3" /> Verified</Badge><Badge className="border-white/70 bg-white/90 text-foreground">{property.propertyType.replace('_',' ')}</Badge></div>
      <div className="absolute right-3 top-3"><WishlistButton propertyId={property.id}/></div>
    </div>
    <div className="space-y-3 p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold">{property.name}</h3><p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-3.5" />{property.location}, {property.district}</p></div><div className="flex items-center gap-1 text-sm font-semibold"><Star className="size-4 fill-current text-accent" />{property.rating}</div></div>
      <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">{property.amenities.slice(0,3).map((amenity)=><span key={amenity} className="rounded-full bg-muted px-2.5 py-1">{amenity}</span>)}</div>
      <div className="flex items-end justify-between gap-3"><div><span className="text-lg font-black">{formatINR(property.priceFrom)}</span><span className="text-sm text-muted-foreground"> / night</span></div><Link href={`/stays/${property.slug}`}><Button size="sm">View stay</Button></Link></div>
    </div>
  </article>
}
