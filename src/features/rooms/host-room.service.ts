import type { SupabaseClient } from '@supabase/supabase-js'

export type HostRoom = {
  id: string
  propertyId: string
  propertyName: string
  name: string
  description: string
  roomType: string
  maxGuests: number
  beds: string
  bathroomType: string
  basePrice: number
  status: string
}

export class HostRoomService {
  constructor(private readonly db: SupabaseClient) {}

  async getHostId() {
    const { data: { user } } = await this.db.auth.getUser()
    if (!user) return null
    const { data } = await this.db.from('host_profiles').select('id').eq('user_id', user.id).maybeSingle()
    return data?.id ?? null
  }

  async list(hostId: string): Promise<HostRoom[]> {
    const { data, error } = await this.db
      .from('rooms')
      .select('id,property_id,name,description,room_type,max_guests,beds,bathroom_type,base_price,status,properties:property_id(name)')
      .in('property_id', await this.propertyIds(hostId))
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []).map((row) => {
      const property = Array.isArray(row.properties) ? row.properties[0] : row.properties
      return {
        id: row.id,
        propertyId: row.property_id,
        propertyName: property?.name ?? 'Property',
        name: row.name,
        description: row.description ?? '',
        roomType: row.room_type ?? '',
        maxGuests: Number(row.max_guests ?? 1),
        beds: row.beds ?? '',
        bathroomType: row.bathroom_type ?? '',
        basePrice: Number(row.base_price ?? 0),
        status: row.status,
      }
    })
  }

  async update(roomId: string, hostId: string, input: Omit<HostRoom, 'id' | 'propertyId' | 'propertyName' | 'status'>) {
    const propertyIds = await this.propertyIds(hostId)
    const { error } = await this.db.from('rooms').update({
      name: input.name,
      description: input.description || null,
      room_type: input.roomType || null,
      max_guests: input.maxGuests,
      beds: input.beds || null,
      bathroom_type: input.bathroomType || null,
      base_price: input.basePrice,
      updated_at: new Date().toISOString(),
    }).eq('id', roomId).in('property_id', propertyIds)
    if (error) throw new Error(error.message)
  }

  private async propertyIds(hostId: string) {
    const { data, error } = await this.db.from('properties').select('id').eq('host_id', hostId)
    if (error) throw new Error(error.message)
    return (data ?? []).map((row) => row.id)
  }
}