import type { SupabaseClient } from '@supabase/supabase-js'
import type { Property, Room, VerificationLevel } from '@/types/domain'
import type { PropertyRepository, PropertySearchInput } from './property.repository'

/** Fallback image used when a property has no hero image or media yet. */
const DEFAULT_PROPERTY_IMAGE =
  'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=80'

/**
 * Supabase-backed implementation of PropertyRepository.
 *
 * Assembles the public `Property` projection from the normalized schema:
 *   properties + rooms + property_amenities/amenities + property_media.
 *
 * Only PUBLISHED properties are returned to the public. This repository is
 * used by Server Components / Route Handlers via the server client, so RLS
 * (published properties are public) applies naturally.
 */
export class SupabasePropertyRepository implements PropertyRepository<Property> {
  constructor(private readonly db: SupabaseClient) {}

  async listPublished(input?: PropertySearchInput): Promise<Property[]> {
    let query = this.db
      .from('properties')
      .select(
        `id, slug, name, property_type, description, district, town, village,
         latitude, longitude, price_from, rating, review_count, hero_image,
         cancellation_policy, verification_level, tourism_registration_status,
         host_id,
         host:host_profiles!inner(display_name),
         rooms:rooms(id, name, description, max_guests, base_price, room_type, beds, bathroom_type),
         property_amenities(amenity:amenities(name)),
         property_media(url, alt_text, sort_order, is_hero)`
      )
      .eq('status', 'PUBLISHED')
      .order('rating', { ascending: false })

    const destination = input?.destination?.trim().toLowerCase()
    if (destination) {
      query = query.or(
        `name.ilike.%${destination}%,town.ilike.%${destination}%,district.ilike.%${destination}%,village.ilike.%${destination}%`
      )
    }

    const district = input?.district?.trim()
    if (district) {
      query = query.eq('district', district)
    }

    const propertyType = input?.propertyType?.trim()
    if (propertyType) {
      query = query.eq('property_type', propertyType)
    }

    if (input?.minPrice != null) {
      query = query.gte('price_from', input.minPrice)
    }
    if (input?.maxPrice != null) {
      query = query.lte('price_from', input.maxPrice)
    }

    if (input?.minVerification != null) {
      query = query.gte('verification_level', input.minVerification)
    }

    const { data, error } = await query
    if (error) {
      console.error('[PropertyRepository] listPublished error:', error.message)
      return []
    }

    let rows = data ?? []

    // Amenity filtering must happen in-memory because amenities are a nested
    // relation (property_amenities -> amenities.name).
    if (input?.amenities && input.amenities.length > 0) {
      const wanted = input.amenities.map((a) => a.toLowerCase())
      rows = rows.filter((row: any) => {
        const names = (row.property_amenities ?? [])
          .map((pa: any) => pa.amenity?.name?.toLowerCase())
          .filter(Boolean)
        return wanted.every((w) => names.includes(w))
      })
    }

    return rows.map((row) => this.toProperty(row))
  }

  async findById(id: string): Promise<Property | null> {
    const { data, error } = await this.db
      .from('properties')
      .select(
        `id, slug, name, property_type, description, district, town, village,
         latitude, longitude, price_from, rating, review_count, hero_image,
         cancellation_policy, verification_level, tourism_registration_status,
         host_id,
         host:host_profiles!inner(display_name),
         rooms:rooms(id, name, description, max_guests, base_price, room_type, beds, bathroom_type),
         property_amenities(amenity:amenities(name)),
         property_media(url, alt_text, sort_order, is_hero)`
      )
      .eq('id', id)
      .eq('status', 'PUBLISHED')
      .maybeSingle()

    if (error) {
      console.error('[PropertyRepository] findById error:', error.message)
      return null
    }
    if (!data) return null

    return this.toProperty(data)
  }

  async findBySlug(slug: string): Promise<Property | null> {
    const { data, error } = await this.db
      .from('properties')
      .select(
        `id, slug, name, property_type, description, district, town, village,
         latitude, longitude, price_from, rating, review_count, hero_image,
         cancellation_policy, verification_level, tourism_registration_status,
         host_id,
         host:host_profiles!inner(display_name),
         rooms:rooms(id, name, description, max_guests, base_price, room_type, beds, bathroom_type),
         property_amenities(amenity:amenities(name)),
         property_media(url, alt_text, sort_order, is_hero)`
      )
      .eq('slug', slug)
      .eq('status', 'PUBLISHED')
      .maybeSingle()

    if (error) {
      console.error('[PropertyRepository] findBySlug error:', error.message)
      return null
    }
    if (!data) return null

    return this.toProperty(data)
  }

  /** Map a raw Supabase row into the public Property projection. */
  private toProperty(row: any): Property {
    const rooms: Room[] = (row.rooms ?? []).map((r: any) => ({
      id: r.id,
      name: r.name,
      maxGuests: r.max_guests,
      beds: r.beds ?? '',
      bathroom: r.bathroom_type ?? '',
      price: Number(r.base_price ?? 0),
    }))

    const amenities: string[] = (row.property_amenities ?? [])
      .map((pa: any) => pa.amenity?.name)
      .filter(Boolean)

    const media = (row.property_media ?? []) as Array<{
      url: string
      sort_order: number
      is_hero: boolean
    }>
    const hero =
      media.find((m) => m.is_hero)?.url ??
      [...media].sort((a, b) => a.sort_order - b.sort_order)[0]?.url ??
      row.hero_image ??
      ''

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      location: row.town ?? row.village ?? row.district ?? '',
      district: row.district ?? '',
      propertyType: row.property_type,
      description: row.description ?? '',
      priceFrom: Number(row.price_from ?? 0),
      rating: Number(row.rating ?? 0),
      reviewCount: Number(row.review_count ?? 0),
      imageUrl: hero || DEFAULT_PROPERTY_IMAGE,
      amenities,
      verificationLevel: Number(row.verification_level ?? 0) as VerificationLevel,
      tourismRegistered: row.tourism_registration_status === 'VERIFIED',
      cancellation: row.cancellation_policy ?? '',
      hostName: row.host?.display_name ?? '',
      latitude: row.latitude ?? 0,
      longitude: row.longitude ?? 0,
      rooms,
    }
  }
}
