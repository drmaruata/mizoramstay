import type { SupabaseClient } from '@supabase/supabase-js'

export type RoomPrice = {
  id: string
  roomId: string
  roomName: string
  date: string
  basePrice: number
  weekendPrice: number | null
  seasonalPrice: number | null
  specialPrice: number | null
  minimumStay: number
}

export class HostPricingService {
  constructor(private readonly db: SupabaseClient) {}

  async getHostId() {
    const { data: { user } } = await this.db.auth.getUser()
    if (!user) return null
    const { data } = await this.db.from('host_profiles').select('id').eq('user_id', user.id).maybeSingle()
    return data?.id ?? null
  }

  async listRooms(hostId: string) {
    const { data, error } = await this.db.from('rooms').select('id,name,base_price,properties:property_id!inner(host_id,name)').eq('properties.host_id', hostId).eq('status','ACTIVE').order('name')
    if (error) throw new Error(error.message)
    return (data ?? []).map((r) => ({ id: r.id, name: r.name, basePrice: Number(r.base_price ?? 0), propertyName: Array.isArray(r.properties) ? r.properties[0]?.name ?? 'Property' : r.properties?.name ?? 'Property' }))
  }

  async listMonth(hostId: string, year: number, month: number): Promise<RoomPrice[]> {
    const rooms = await this.listRooms(hostId)
    if (!rooms.length) return []
    const ids = rooms.map((r) => r.id)
    const start = `${year}-${String(month).padStart(2,'0')}-01`
    const endDate = new Date(Date.UTC(year, month, 0))
    const end = endDate.toISOString().slice(0,10)
    const { data, error } = await this.db.from('room_prices').select('id,room_id,date,base_price,weekend_price,seasonal_price,special_price,minimum_stay').in('room_id', ids).gte('date', start).lte('date', end).order('date')
    if (error) throw new Error(error.message)
    const byRoom = new Map(rooms.map((r) => [r.id, r]))
    return (data ?? []).map((r) => ({ id:r.id, roomId:r.room_id, roomName:byRoom.get(r.room_id)?.name ?? 'Room', date:r.date, basePrice:Number(r.base_price ?? byRoom.get(r.room_id)?.basePrice ?? 0), weekendPrice:r.weekend_price == null ? null : Number(r.weekend_price), seasonalPrice:r.seasonal_price == null ? null : Number(r.seasonal_price), specialPrice:r.special_price == null ? null : Number(r.special_price), minimumStay:Number(r.minimum_stay ?? 1) }))
  }

  async upsertDate(hostId: string, input: { roomId:string; date:string; basePrice:number; weekendPrice:number|null; seasonalPrice:number|null; specialPrice:number|null; minimumStay:number }) {
    const rooms = await this.listRooms(hostId)
    if (!rooms.some((r) => r.id === input.roomId)) throw new Error('Room is not owned by this host.')
    const { error } = await this.db.from('room_prices').upsert({ room_id:input.roomId,date:input.date,base_price:input.basePrice,weekend_price:input.weekendPrice,seasonal_price:input.seasonalPrice,special_price:input.specialPrice,minimum_stay:input.minimumStay,updated_at:new Date().toISOString() }, { onConflict:'room_id,date' })
    if (error) throw new Error(error.message)
  }
}