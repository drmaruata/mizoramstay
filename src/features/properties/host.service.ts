import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { PropertyType } from '@/types/domain'

/**
 * Host-side property management service.
 *
 * Uses the authenticated server client (RLS-enforced) so a host can only
 * create/read/update/delete their OWN properties, rooms, and amenity links.
 * The RLS policies for this live in `supabase/migrations/0020_host_property_crud_policies.sql`.
 */

export const hostPropertySchema = z.object({
  name: z.string().min(2).max(160),
  propertyType: z.enum(['HOMESTAY', 'HOTEL', 'GUESTHOUSE', 'LODGE', 'RESORT', 'VILLAGE_STAY']),
  description: z.string().max(10000).optional().default(''),
  address: z.string().max(300).optional().default(''),
  village: z.string().max(120).optional().default(''),
  town: z.string().max(120).optional().default(''),
  district: z.string().max(120).optional().default(''),
  pincode: z.string().max(20).optional().default(''),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  cancellationPolicy: z.string().max(2000).optional().default(''),
  amenityIds: z.array(z.string().uuid()).optional().default([]),
  rooms: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        name: z.string().min(1).max(160),
        description: z.string().max(2000).optional().default(''),
        maxGuests: z.number().int().min(1),
        basePrice: z.number().min(0),
        roomType: z.string().max(60).optional().default(''),
        beds: z.string().max(120).optional().default(''),
        bathroomType: z.string().max(60).optional().default(''),
      })
    )
    .optional()
    .default([]),
})

export type HostPropertyInput = z.infer<typeof hostPropertySchema>

export interface HostPropertySummary {
  id: string
  slug: string
  name: string
  propertyType: PropertyType
  district: string
  status: string
  verificationLevel: number
  priceFrom: number | null
  heroImage: string | null
  roomCount: number
  createdAt: string
  updatedAt: string
}

export class HostPropertyService {
  constructor(private db: SupabaseClient) {}

  /**
   * Resolve the host profile id for the current authenticated user.
   * Returns null when the user is not signed in or has no host profile.
   */
  async getHostProfileId(): Promise<string | null> {
    const {
      data: { user },
    } = await this.db.auth.getUser()
    if (!user) return null

    const { data, error } = await this.db
      .from('host_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error || !data) return null
    return data.id
  }

  /** List all properties owned by the given host profile. */
  async listForHost(hostProfileId: string): Promise<HostPropertySummary[]> {
    const { data, error } = await this.db
      .from('properties')
      .select(
        `id, slug, name, property_type, district, status, verification_level,
         price_from, hero_image, created_at, updated_at,
         rooms:rooms(id)`
      )
      .eq('host_id', hostProfileId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[HostPropertyService] listForHost error:', error.message)
      return []
    }

    return (data ?? []).map((row: any) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      propertyType: row.property_type as PropertyType,
      district: row.district ?? '',
      status: row.status,
      verificationLevel: Number(row.verification_level ?? 0),
      priceFrom: row.price_from != null ? Number(row.price_from) : null,
      heroImage: row.hero_image ?? null,
      roomCount: (row.rooms ?? []).length,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))
  }

  /**
   * Create a property (plus its rooms and amenity links) for a host.
   * Returns the new property id.
   */
  async createProperty(
    hostProfileId: string,
    input: HostPropertyInput
  ): Promise<{ id: string; slug: string }> {
    const parsed = hostPropertySchema.parse(input)
    const slug = await this.generateUniqueSlug(parsed.name)

    const { data: property, error } = await this.db
      .from('properties')
      .insert({
        host_id: hostProfileId,
        name: parsed.name,
        slug,
        property_type: parsed.propertyType,
        description: parsed.description || null,
        address: parsed.address || null,
        village: parsed.village || null,
        town: parsed.town || null,
        district: parsed.district || null,
        pincode: parsed.pincode || null,
        latitude: parsed.latitude ?? null,
        longitude: parsed.longitude ?? null,
        check_in_time: parsed.checkInTime || null,
        check_out_time: parsed.checkOutTime || null,
        cancellation_policy: parsed.cancellationPolicy || null,
        status: 'DRAFT',
        verification_level: 0,
        tourism_registration_status: 'PENDING',
      })
      .select('id, slug')
      .single()

    if (error) {
      console.error('[HostPropertyService] createProperty error:', error.message)
      throw new Error(error.message)
    }

    await this.upsertRooms(property.id, parsed.rooms)
    await this.replaceAmenities(property.id, parsed.amenityIds)

    return { id: property.id, slug: property.slug }
  }

  /**
   * Update an existing property's details, rooms, and amenity links.
   * Only succeeds if RLS allows the host to update this property.
   */
  async updateProperty(
    propertyId: string,
    input: HostPropertyInput
  ): Promise<{ id: string; slug: string }> {
    const parsed = hostPropertySchema.parse(input)

    const { data: property, error } = await this.db
      .from('properties')
      .update({
        name: parsed.name,
        property_type: parsed.propertyType,
        description: parsed.description || null,
        address: parsed.address || null,
        village: parsed.village || null,
        town: parsed.town || null,
        district: parsed.district || null,
        pincode: parsed.pincode || null,
        latitude: parsed.latitude ?? null,
        longitude: parsed.longitude ?? null,
        check_in_time: parsed.checkInTime || null,
        check_out_time: parsed.checkOutTime || null,
        cancellation_policy: parsed.cancellationPolicy || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', propertyId)
      .select('id, slug')
      .single()

    if (error) {
      console.error('[HostPropertyService] updateProperty error:', error.message)
      throw new Error(error.message)
    }

    await this.upsertRooms(propertyId, parsed.rooms)
    await this.replaceAmenities(propertyId, parsed.amenityIds)

    return { id: property.id, slug: property.slug }
  }

  /** Delete a property (cascades to rooms, media, amenities). */
  async deleteProperty(propertyId: string): Promise<void> {
    const { error } = await this.db.from('properties').delete().eq('id', propertyId)
    if (error) {
      console.error('[HostPropertyService] deleteProperty error:', error.message)
      throw new Error(error.message)
    }
  }

  /** Set a property's status (e.g. submit for review). */
  async setStatus(propertyId: string, status: 'DRAFT' | 'PENDING_REVIEW'): Promise<void> {
    const { error } = await this.db
      .from('properties')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', propertyId)
    if (error) {
      console.error('[HostPropertyService] setStatus error:', error.message)
      throw new Error(error.message)
    }
  }

  /**
   * Fetch a single property (with rooms) for the host edit form.
   * Returns null when the property is not found or not owned by this host.
   */
  async getForEdit(propertyId: string): Promise<HostPropertyInput & { id: string; slug: string } | null> {
    const { data, error } = await this.db
      .from('properties')
      .select(
        `id, slug, name, property_type, description, address, village, town, district,
         pincode, latitude, longitude, check_in_time, check_out_time, cancellation_policy,
         rooms:rooms(id, name, description, max_guests, base_price, room_type, beds, bathroom_type),
         property_amenities(amenity_id)`
      )
      .eq('id', propertyId)
      .maybeSingle()

    if (error || !data) return null

    return {
      id: data.id,
      slug: data.slug,
      name: data.name,
      propertyType: data.property_type as PropertyType,
      description: data.description ?? '',
      address: data.address ?? '',
      village: data.village ?? '',
      town: data.town ?? '',
      district: data.district ?? '',
      pincode: data.pincode ?? '',
      latitude: data.latitude ?? undefined,
      longitude: data.longitude ?? undefined,
      checkInTime: data.check_in_time ?? undefined,
      checkOutTime: data.check_out_time ?? undefined,
      cancellationPolicy: data.cancellation_policy ?? '',
      amenityIds: (data.property_amenities ?? []).map((pa: any) => pa.amenity_id),
      rooms: (data.rooms ?? []).map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description ?? '',
        maxGuests: r.max_guests,
        basePrice: Number(r.base_price ?? 0),
        roomType: r.room_type ?? '',
        beds: r.beds ?? '',
        bathroomType: r.bathroom_type ?? '',
      })),
    }
  }

  // ------------------------------------------------------------------
  // Private helpers
  // ------------------------------------------------------------------

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60)
    const candidate = base || 'property'

    const { data, error } = await this.db
      .from('properties')
      .select('slug')
      .eq('slug', candidate)
      .maybeSingle()

    if (error || !data) return candidate

    // Slug taken — append a short random suffix.
    return `${candidate}-${Math.random().toString(36).slice(2, 8)}`
  }

  private async upsertRooms(propertyId: string, rooms: HostPropertyInput['rooms']): Promise<void> {
    for (const room of rooms) {
      if (room.id) {
        await this.db
          .from('rooms')
          .update({
            name: room.name,
            description: room.description || null,
            max_guests: room.maxGuests,
            base_price: room.basePrice,
            room_type: room.roomType || null,
            beds: room.beds || null,
            bathroom_type: room.bathroomType || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', room.id)
      } else {
        await this.db.from('rooms').insert({
          property_id: propertyId,
          name: room.name,
          description: room.description || null,
          max_guests: room.maxGuests,
          base_price: room.basePrice,
          room_type: room.roomType || null,
          beds: room.beds || null,
          bathroom_type: room.bathroomType || null,
        })
      }
    }
  }

  private async replaceAmenities(propertyId: string, amenityIds: string[]): Promise<void> {
    // Remove existing links, then insert the new set.
    await this.db.from('property_amenities').delete().eq('property_id', propertyId)
    if (amenityIds.length > 0) {
      await this.db.from('property_amenities').insert(
        amenityIds.map((amenityId) => ({ property_id: propertyId, amenity_id: amenityId }))
      )
    }
  }
}
