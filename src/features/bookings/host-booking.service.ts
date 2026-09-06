import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Host-side booking management service.
 *
 * Uses the authenticated server client (RLS-enforced). Hosts can read
 * bookings for their own properties via the "hosts can read property
 * bookings" policy; the booking_items / booking_guests / room_inventory
 * read policies were added in migration 0023.
 */

export interface HostBookingSummary {
  id: string
  bookingReference: string
  propertyId: string
  propertyName: string
  roomName: string | null
  checkIn: string
  checkOut: string
  guests: number
  totalAmount: number
  status: string
  guestName: string
  guestPhone: string | null
  createdAt: string
}

export interface HostDashboardStats {
  todayCheckIns: number
  todayCheckOuts: number
  upcomingBookings: number
  pendingRequests: number
  monthRevenue: number
  occupancyRate: number
  recentBookings: HostBookingSummary[]
}

export type CalendarDayState = 'AVAILABLE' | 'BOOKED' | 'BLOCKED' | 'UNAVAILABLE'

export interface RoomCalendar {
  roomId: string
  roomName: string
  propertyName: string
  days: { date: string; state: CalendarDayState }[]
}

/** Raw row shapes returned by the Supabase embedded-resource queries. */
interface BookingRow {
  id: string
  booking_reference: string
  property_id: string
  check_in: string
  check_out: string
  guests: number
  total_amount: number | null
  status: string
  created_at: string
  properties?: { name: string } | null
  booking_items?: { rooms?: { name: string } | null }[] | null
  booking_guests?: { first_name: string | null; last_name: string | null; phone: string | null }[] | null
}

interface RoomRow {
  id: string
  name: string
  property_id: string
  properties?: { name: string } | null
}

interface InventoryRow {
  room_id: string
  date: string
  available_units: number
  blocked_units: number
}

/** Row shape for the calendar bookings query (includes per-room items). */
interface CalendarBookingRow {
  id: string
  property_id: string
  check_in: string
  check_out: string
  status: string
  inventory_reserved: boolean | null
  booking_items?: { room_id: string }[] | null
}

const ACTIVE_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED']

export class HostBookingService {
  constructor(private db: SupabaseClient) {}

  /** Resolve the host profile id for the current authenticated user. */
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

  /** All bookings across the host's properties, newest first. */
  async listBookings(hostProfileId: string): Promise<HostBookingSummary[]> {
    const propertyIds = await this.getPropertyIds(hostProfileId)
    if (propertyIds.length === 0) return []

    const { data, error } = await this.db
      .from('bookings')
      .select(
        `id, booking_reference, property_id, check_in, check_out, guests,
         total_amount, status, created_at,
         properties:property_id(name),
         booking_items:booking_items(rooms:room_id(name)),
         booking_guests:booking_guests(first_name, last_name, phone)`
      )
      .in('property_id', propertyIds)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[HostBookingService] listBookings error:', error.message)
      return []
    }

    return (data ?? []).map((row) => this.toSummary(row as unknown as BookingRow))
  }

  /** Aggregate KPIs for the host dashboard. */
  async getDashboardStats(hostProfileId: string): Promise<HostDashboardStats> {
    const bookings = await this.listBookings(hostProfileId)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayIso = today.toISOString().slice(0, 10)
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()

    const active = bookings.filter((b) => ACTIVE_STATUSES.includes(b.status))
    const todayCheckIns = active.filter((b) => b.checkIn === todayIso).length
    const todayCheckOuts = active.filter((b) => b.checkOut === todayIso).length
    const upcomingBookings = active.filter((b) => b.checkIn >= todayIso).length
    const pendingRequests = bookings.filter((b) => b.status === 'PENDING').length
    const monthRevenue = bookings
      .filter((b) => ['CONFIRMED', 'COMPLETED'].includes(b.status) && b.createdAt >= monthStart)
      .reduce((sum, b) => sum + b.totalAmount, 0)

    const occupancyRate = await this.computeOccupancy(hostProfileId)

    return {
      todayCheckIns,
      todayCheckOuts,
      upcomingBookings,
      pendingRequests,
      monthRevenue,
      occupancyRate,
      recentBookings: bookings.slice(0, 5),
    }
  }

  /** Per-room availability for a given month (1-based month number). */
  async getCalendar(hostProfileId: string, year: number, month: number): Promise<RoomCalendar[]> {
    const propertyIds = await this.getPropertyIds(hostProfileId)
    if (propertyIds.length === 0) return []

    const { data: rooms, error: roomsError } = await this.db
      .from('rooms')
      .select('id, name, property_id, properties:property_id(name)')
      .in('property_id', propertyIds)
      .eq('status', 'ACTIVE')
    if (roomsError) {
      console.error('[HostBookingService] getCalendar rooms error:', roomsError.message)
      return []
    }

    const roomIds = (rooms ?? []).map((r) => r.id)
    if (roomIds.length === 0) return []

    const monthStart = new Date(Date.UTC(year, month - 1, 1))
    const monthEnd = new Date(Date.UTC(year, month, 0))
    const startIso = monthStart.toISOString().slice(0, 10)
    const endIso = monthEnd.toISOString().slice(0, 10)

    const { data: inventory, error: inventoryError } = await this.db
      .from('room_inventory')
      .select('room_id, date, available_units, blocked_units')
      .in('room_id', roomIds)
      .gte('date', startIso)
      .lte('date', endIso)
    if (inventoryError) {
      console.error('[HostBookingService] getCalendar inventory error:', inventoryError.message)
      return []
    }

    const { data: bookings, error: bookingsError } = await this.db
      .from('bookings')
      .select(
        'id, property_id, check_in, check_out, status, inventory_reserved, booking_items:booking_items(room_id)'
      )
      .in('property_id', propertyIds)
      .in('status', ['PENDING', 'CONFIRMED'])
      .lte('check_in', endIso)
      .gte('check_out', startIso)
    if (bookingsError) {
      console.error('[HostBookingService] getCalendar bookings error:', bookingsError.message)
      return []
    }

    const inventoryByRoom = new Map<string, Map<string, InventoryRow>>()
    for (const row of (inventory ?? []) as unknown as InventoryRow[]) {
      if (!inventoryByRoom.has(row.room_id)) inventoryByRoom.set(row.room_id, new Map())
      inventoryByRoom.get(row.room_id)!.set(row.date, row)
    }

    const activeBookings = ((bookings ?? []) as unknown as CalendarBookingRow[]).filter(
      (b) => b.status === 'CONFIRMED' || b.inventory_reserved === true
    )

    const dayCount = monthEnd.getUTCDate()
    const days: { date: string; state: CalendarDayState }[] = []
    for (let d = 1; d <= dayCount; d++) {
      days.push({ date: `${startIso.slice(0, 8)}${String(d).padStart(2, '0')}`, state: 'AVAILABLE' })
    }

    return (rooms ?? []).map((room) => {
      const roomInventory = inventoryByRoom.get(room.id) ?? new Map<string, InventoryRow>()
      const roomDays = days.map((day) => {
        const inv = roomInventory.get(day.date)
        const isBooked = activeBookings.some(
          (b) =>
            b.check_in <= day.date &&
            day.date < b.check_out &&
            (b.booking_items ?? []).some((bi) => bi.room_id === room.id)
        )
        if (isBooked) return { ...day, state: 'BOOKED' as const }
        if (inv && inv.blocked_units > 0) return { ...day, state: 'BLOCKED' as const }
        if (inv && inv.available_units > 0) return { ...day, state: 'AVAILABLE' as const }
        return { ...day, state: 'UNAVAILABLE' as const }
      })
      return {
        roomId: room.id,
        roomName: room.name,
        propertyName: (room as unknown as RoomRow).properties?.name ?? 'Property',
        days: roomDays,
      }
    })
  }

  private async getPropertyIds(hostProfileId: string): Promise<string[]> {
    const { data, error } = await this.db
      .from('properties')
      .select('id')
      .eq('host_id', hostProfileId)
    if (error) {
      console.error('[HostBookingService] getPropertyIds error:', error.message)
      return []
    }
    return (data ?? []).map((row) => row.id)
  }

  /** Occupancy over the next 30 days: booked nights / total room-nights. */
  private async computeOccupancy(hostProfileId: string): Promise<number> {
    const propertyIds = await this.getPropertyIds(hostProfileId)
    if (propertyIds.length === 0) return 0

    const { data: rooms } = await this.db
      .from('rooms')
      .select('id')
      .in('property_id', propertyIds)
      .eq('status', 'ACTIVE')
    const roomIds = (rooms ?? []).map((r) => r.id)
    if (roomIds.length === 0) return 0

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startIso = today.toISOString().slice(0, 10)
    const end = new Date(today.getTime() + 30 * 86400000)
    const endIso = end.toISOString().slice(0, 10)

    const { data: bookings } = await this.db
      .from('bookings')
      .select('check_in, check_out, status, inventory_reserved')
      .in('property_id', propertyIds)
      .in('status', ['PENDING', 'CONFIRMED'])
      .lte('check_in', endIso)
      .gte('check_out', startIso)

    const active = (bookings ?? []).filter(
      (b) => b.status === 'CONFIRMED' || b.inventory_reserved === true
    )

    let bookedNights = 0
    for (let i = 0; i < 30; i++) {
      const day = new Date(today.getTime() + i * 86400000).toISOString().slice(0, 10)
      const bookedThatDay = active.some((b) => b.check_in <= day && day < b.check_out)
      if (bookedThatDay) bookedNights += 1
    }

    const totalNights = roomIds.length * 30
    if (totalNights === 0) return 0
    return Math.round((bookedNights / totalNights) * 100)
  }

  private toSummary(row: BookingRow): HostBookingSummary {
    const guest = row.booking_guests?.[0]
    return {
      id: row.id,
      bookingReference: row.booking_reference,
      propertyId: row.property_id,
      propertyName: row.properties?.name ?? 'Unknown property',
      roomName: row.booking_items?.[0]?.rooms?.name ?? null,
      checkIn: row.check_in,
      checkOut: row.check_out,
      guests: row.guests,
      totalAmount: Number(row.total_amount ?? 0),
      status: row.status,
      guestName:
        [guest?.first_name, guest?.last_name].filter(Boolean).join(' ').trim() || 'Guest',
      guestPhone: guest?.phone ?? null,
      createdAt: row.created_at,
    }
  }
}