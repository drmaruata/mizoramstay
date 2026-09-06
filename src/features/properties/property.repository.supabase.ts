import type { SupabaseClient } from '@supabase/supabase-js'
import type { Property, PropertyMedia, Room, VerificationLevel } from '@/types/domain'
import type { PropertyRepository, PropertySearchInput } from './property.repository'

const DEFAULT_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=80'

export class SupabasePropertyRepository implements PropertyRepository<Property> {
  constructor(private readonly db: SupabaseClient) {}

  async listPublished(input?: PropertySearchInput): Promise<Property[]> {
    let query = this.db.from('properties').select(`id, slug, name, property_type, description, district, town, village, latitude, longitude, price_from, rating, review_count, hero_image, cancellation_policy, verification_level, tourism_registration_status, host_id, host:host_profiles!inner(display_name), rooms:rooms(id, name, description, max_guests, base_price, room_type, beds, bathroom_type), property_amenities(amenity:amenities(name)), property_media(id, url, alt_text, sort_order, is_hero, media_type, room_id)`).eq('status', 'PUBLISHED')

    const destination = input?.destination?.trim().toLowerCase()
    if (destination) query = query.or(`name.ilike.%${destination}%,town.ilike.%${destination}%,district.ilike.%${destination}%,village.ilike.%${destination}%`)
    if (input?.district?.trim()) query = query.eq('district', input.district.trim())
    if (input?.propertyType?.trim()) query = query.eq('property_type', input.propertyType.trim())
    if (input?.minPrice != null) query = query.gte('price_from', input.minPrice)
    if (input?.maxPrice != null) query = query.lte('price_from', input.maxPrice)
    if (input?.minVerification != null) query = query.gte('verification_level', input.minVerification)

    const { data, error } = await query
    if (error) { console.error('[PropertyRepository] listPublished error:', error.message); return [] }
    let rows = data ?? []

    if (input?.amenities?.length) {
      const wanted = input.amenities.map((a) => a.toLowerCase())
      rows = rows.filter((row: any) => {
        const names = (row.property_amenities ?? []).map((pa:any)=>pa.amenity?.name?.toLowerCase()).filter(Boolean)
        return wanted.every((a)=>names.includes(a))
      })
    }

    let properties = rows.map((row) => this.toProperty(row))
    if (input?.guests && input.guests > 0) properties = properties.filter((p) => p.rooms.some((room) => room.maxGuests >= input.guests!))

    if (input?.checkIn && input?.checkOut && input.checkOut > input.checkIn) {
      const { data: inventory } = await this.db.from('room_inventory').select('room_id,date,available_units,blocked_units').gte('date', input.checkIn).lt('date', input.checkOut)
      const available = new Map<string, Set<string>>()
      for (const row of inventory ?? []) {
        if (Number(row.available_units) > 0 && Number(row.blocked_units) === 0) {
          if (!available.has(row.room_id)) available.set(row.room_id, new Set())
          available.get(row.room_id)!.add(row.date)
        }
      }
      const start = new Date(`${input.checkIn}T00:00:00Z`)
      const end = new Date(`${input.checkOut}T00:00:00Z`)
      const nights = Math.max(0, Math.round((end.getTime()-start.getTime())/86400000))
      properties = properties.filter((p) => p.rooms.some((room) => {
        const roomDates = available.get(room.id)
        if (!roomDates || nights === 0) return false
        for (let i=0;i<nights;i++) { const d=new Date(start.getTime()+i*86400000).toISOString().slice(0,10); if(!roomDates.has(d)) return false }
        return true
      }))
    }

    switch(input?.sort){
      case 'price_asc': properties.sort((a,b)=>a.priceFrom-b.priceFrom); break
      case 'price_desc': properties.sort((a,b)=>b.priceFrom-a.priceFrom); break
      case 'rating': properties.sort((a,b)=>b.rating-a.rating); break
      default: properties.sort((a,b)=>((b.verificationLevel-a.verificationLevel)*100)+(b.rating-a.rating)+(b.reviewCount-a.reviewCount)/1000)
    }
    return properties
  }

  async findById(id: string): Promise<Property | null> {
    const { data, error } = await this.db.from('properties').select(`id, slug, name, property_type, description, district, town, village, latitude, longitude, price_from, rating, review_count, hero_image, cancellation_policy, verification_level, tourism_registration_status, host_id, host:host_profiles!inner(display_name), rooms:rooms(id, name, description, max_guests, base_price, room_type, beds, bathroom_type), property_amenities(amenity:amenities(name)), property_media(id, url, alt_text, sort_order, is_hero, media_type, room_id)`).eq('id', id).eq('status', 'PUBLISHED').maybeSingle()
    if (error || !data) return null
    return this.toProperty(data)
  }

  async findBySlug(slug: string): Promise<Property | null> {
    const { data, error } = await this.db.from('properties').select(`id, slug, name, property_type, description, district, town, village, latitude, longitude, price_from, rating, review_count, hero_image, cancellation_policy, verification_level, tourism_registration_status, host_id, host:host_profiles!inner(display_name), rooms:rooms(id, name, description, max_guests, base_price, room_type, beds, bathroom_type), property_amenities(amenity:amenities(name)), property_media(id, url, alt_text, sort_order, is_hero, media_type, room_id)`).eq('slug', slug).eq('status', 'PUBLISHED').maybeSingle()
    if (error || !data) return null
    return this.toProperty(data)
  }

  private toProperty(row: any): Property {
    const media: PropertyMedia[] = (row.property_media ?? []).map((m:any)=>({id:m.id,url:m.url,altText:m.alt_text??'',sortOrder:Number(m.sort_order??0),isHero:Boolean(m.is_hero),roomId:m.room_id??null})).sort((a,b)=>a.sortOrder-b.sortOrder)
    const rooms: Room[] = (row.rooms ?? []).map((r:any)=>({id:r.id,name:r.name,maxGuests:r.max_guests,beds:r.beds??'',bathroom:r.bathroom_type??'',price:Number(r.base_price??0),description:r.description??'',roomType:r.room_type??'',images:media.filter((m)=>m.roomId===r.id)}))
    const amenities:string[]=(row.property_amenities??[]).map((pa:any)=>pa.amenity?.name).filter(Boolean)
    const hero=media.find((m)=>m.isHero&&!m.roomId)?.url??media.find((m)=>!m.roomId)?.url??row.hero_image??media[0]?.url??''
    return {id:row.id,slug:row.slug,name:row.name,location:row.town??row.village??row.district??'',district:row.district??'',propertyType:row.property_type,description:row.description??'',priceFrom:Number(row.price_from??0),rating:Number(row.rating??0),reviewCount:Number(row.review_count??0),imageUrl:hero||DEFAULT_PROPERTY_IMAGE,amenities,verificationLevel:Number(row.verification_level??0) as VerificationLevel,tourismRegistered:row.tourism_registration_status==='VERIFIED',cancellation:row.cancellation_policy??'',hostName:row.host?.display_name??'',latitude:row.latitude??0,longitude:row.longitude??0,media,rooms}
  }
}
