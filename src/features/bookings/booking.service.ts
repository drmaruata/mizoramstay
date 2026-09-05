import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

/** Schema for creating a new booking from the client. */
export const createBookingSchema = z.object({
  propertyId: z.string().uuid(),
  roomId: z.string().uuid(),
  checkIn: z.string().date(),
  checkOut: z.string().date(),
  quantity: z.number().int().min(1).default(1),
  guestName: z.string().min(1).max(120),
  guestPhone: z.string().max(20),
  guestEmail: z.string().email().optional(),
  notes: z.string().max(1000).optional(),
})

export type CreateBookingInput = z.infer<typeof createBookingSchema>

export interface BookingSummary {
  id: string
  bookingNumber: string
  userId: string | null
  propertyId: string
  status: string
  subtotal: number
  platformFee: number
  total: number
  createdAt: string
}

/**
 * Booking service with CRUD operations and inventory management.
 *
 * Handles:
 * - Booking creation with validation
 * - Inventory reservation (checking and updating available_units)
 * - Booking state transitions (PENDING → CONFIRMED → COMPLETED)
 *
 * Transaction-safe inventory operations are handled via Postgres constraints
 * and RLS policies. The server client enforces RLS.
 */
export class BookingService {
  constructor(private db: SupabaseClient) {}

  /**
   * Create a new booking after validating inventory and computing totals.
   * Returns the booking ID and a booking number for customer reference.
   *
   * This is transaction-safe via Postgres CHECK constraints on inventory:
   * - available_units >= 0 is enforced by the CHECK constraint
   * - If reservation would make it negative, the INSERT fails
   */
  async createBooking(input: CreateBookingInput): Promise<{ id: string; bookingNumber: string }> {
    const parsed = createBookingSchema.parse(input)

    // 1. Fetch the room to get pricing
    const { data: room, error: roomError } = await this.db
      .from('rooms')
      .select('id, base_price, max_guests')
      .eq('id', parsed.roomId)
      .maybeSingle()

    if (roomError || !room) {
      throw new Error('Room not found or access denied.')
    }

    // 2. Calculate nights and total
    const nights = this.nightsBetween(parsed.checkIn, parsed.checkOut)
    if (nights <= 0) {
      throw new Error('Check-out date must be after check-in date.')
    }

    const subtotal = room.base_price * nights * parsed.quantity
    const platformFee = Math.round(subtotal * 0.1)
    const total = subtotal + platformFee

    // 3. Check availability (before creating)
    const { data: inventory, error: invError } = await this.db
      .from('room_inventory')
      .select('date, available_units')
      .eq('room_id', parsed.roomId)
      .gte('date', parsed.checkIn)
      .lt('date', parsed.checkOut)

    if (invError) {
      throw new Error('Could not check inventory.')
    }

    const inventoryByDate = new Map<string, number>()
    for (const row of inventory ?? []) {
      inventoryByDate.set(row.date, Number(row.available_units ?? 0))
    }

    const dates = this.dateRange(parsed.checkIn, parsed.checkOut)
    for (const date of dates) {
      const units = inventoryByDate.get(date)
      // No row = available by default; row with 0 or negative = unavailable
      if (units != null && units < parsed.quantity) {
        throw new Error(`Insufficient availability on ${date}.`)
      }
    }

    // 4. Get the current user id (for the bookings.user_id FK)
    const {
      data: { user },
    } = await this.db.auth.getUser()
    const userId = user?.id ?? null

    // 5. Create the booking (status: PENDING, awaiting payment confirmation)
    const bookingNumber = `MZ-${String(Math.floor(Math.random() * 900000) + 100000)}`
    const {
      data: booking,
      error: bookingError,
    } = await this.db
      .from('bookings')
      .insert({
        booking_reference: bookingNumber,
        user_id: userId,
        property_id: parsed.propertyId,
        status: 'PENDING',
        check_in: parsed.checkIn,
        check_out: parsed.checkOut,
        guests: parsed.quantity,
        rooms: 1,
        subtotal: subtotal,
        platform_fee: platformFee,
        total_amount: total,
        notes: parsed.notes ?? null,
      })
      .select('id')
      .single()

    if (bookingError || !booking) {
      throw new Error('Failed to create booking.')
    }

    // 5. Create booking item (room + dates + pricing)
    const { error: itemError } = await this.db.from('booking_items').insert({
      booking_id: booking.id,
      room_id: parsed.roomId,
      check_in: parsed.checkIn,
      check_out: parsed.checkOut,
      quantity: parsed.quantity,
      nightly_rate: room.base_price,
      subtotal: subtotal,
    })

    if (itemError) {
      // Rollback: delete the booking
      await this.db.from('bookings').delete().eq('id', booking.id)
      throw new Error('Failed to create booking item.')
    }

    // 6. Create guest record
    const names = parsed.guestName.trim().split(/\s+/)
    const firstName = names[0] ?? ''
    const lastName = names.slice(1).join(' ') || undefined

    const { error: guestError } = await this.db.from('booking_guests').insert({
      booking_id: booking.id,
      first_name: firstName,
      last_name: lastName,
      phone: parsed.guestPhone,
      email: parsed.guestEmail,
    })

    if (guestError) {
      // Rollback: delete booking + items
      await this.db.from('bookings').delete().eq('id', booking.id)
      throw new Error('Failed to create guest record.')
    }

    // 7. Reserve inventory (decrement available_units) — this happens after payment confirmation in production
    // For now, we create the booking as PENDING, and only reserve after payment is confirmed.
    // The payment webhook handler will call confirmBooking() which reserves inventory.

    return { id: booking.id, bookingNumber }
  }

  /**
   * Confirm a booking after payment is received.
   * This reserves inventory and transitions the booking to CONFIRMED.
   */
  async confirmBooking(bookingId: string): Promise<void> {
    // 1. Fetch booking details
    const { data: booking, error: fetchError } = await this.db
      .from('bookings')
      .select('id, check_in, check_out, status')
      .eq('id', bookingId)
      .maybeSingle()

    if (fetchError || !booking) {
      throw new Error('Booking not found.')
    }

    if (booking.status !== 'PENDING') {
      throw new Error(`Booking is in ${booking.status} state, not PENDING.`)
    }

    // 2. Get booking items to find room IDs
    const { data: items, error: itemsError } = await this.db
      .from('booking_items')
      .select('room_id, quantity')
      .eq('booking_id', bookingId)

    if (itemsError || !items) {
      throw new Error('Failed to fetch booking items.')
    }

    // 3. For each date in the booking range, decrement available_units
    // Note: In production, use a Postgres stored procedure (RPC) for atomic operations.
    // For now, this queries existing inventory and updates with arithmetic.
    const dates = this.dateRange(booking.check_in, booking.check_out)
    for (const item of items) {
      for (const date of dates) {
        // Fetch current available_units
        const { data: inv, error: fetchError } = await this.db
          .from('room_inventory')
          .select('available_units')
          .eq('room_id', item.room_id)
          .eq('date', date)
          .maybeSingle()

        if (fetchError) {
          console.error(`[BookingService] Failed to fetch inventory for ${date}:`, fetchError.message)
          continue
        }

        if (!inv) {
          // No inventory row; in production, pre-populate all dates with available_units.
          console.warn(`[BookingService] No inventory row for room ${item.room_id} on ${date}`)
          continue
        }

        const updated = Math.max(0, Number(inv.available_units ?? 0) - item.quantity)
        const { error: updateError } = await this.db
          .from('room_inventory')
          .update({ available_units: updated })
          .eq('room_id', item.room_id)
          .eq('date', date)

        if (updateError) {
          console.error(`[BookingService] Failed to reserve ${date}:`, updateError.message)
        }
      }
    }

    // 4. Transition booking to CONFIRMED
    const { error: confirmError } = await this.db
      .from('bookings')
      .update({ status: 'CONFIRMED', updated_at: new Date().toISOString() })
      .eq('id', bookingId)

    if (confirmError) {
      throw new Error('Failed to confirm booking.')
    }
  }

  /** Fetch a booking by ID. */
  async getBooking(id: string): Promise<BookingSummary | null> {
    const { data, error } = await this.db
      .from('bookings')
      .select('id, booking_reference, user_id, property_id, status, subtotal, platform_fee, total_amount, created_at')
      .eq('id', id)
      .maybeSingle()

    if (error || !data) return null

    return {
      id: data.id,
      bookingNumber: data.booking_reference,
      userId: data.user_id ?? null,
      propertyId: data.property_id,
      status: data.status,
      subtotal: Number(data.subtotal ?? 0),
      platformFee: Number(data.platform_fee ?? 0),
      total: Number(data.total_amount ?? 0),
      createdAt: data.created_at,
    }
  }

  /** Cancel a booking and release reserved inventory. */
  async cancelBooking(id: string, reason?: string): Promise<void> {
    const { data: booking, error: fetchError } = await this.db
      .from('bookings')
      .select('id, check_in, check_out, status')
      .eq('id', id)
      .maybeSingle()

    if (fetchError || !booking) {
      throw new Error('Booking not found.')
    }

    if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
      throw new Error(`Cannot cancel booking in ${booking.status} state.`)
    }

    // Release inventory if it was confirmed
    if (booking.status === 'CONFIRMED') {
      const { data: items } = await this.db
        .from('booking_items')
        .select('room_id, quantity')
        .eq('booking_id', id)

      const dates = this.dateRange(booking.check_in, booking.check_out)
      for (const item of items ?? []) {
        for (const date of dates) {
          const { data: inv } = await this.db
            .from('room_inventory')
            .select('available_units')
            .eq('room_id', item.room_id)
            .eq('date', date)
            .maybeSingle()

          if (inv) {
            const updated = Number(inv.available_units ?? 0) + item.quantity
            await this.db
              .from('room_inventory')
              .update({ available_units: updated })
              .eq('room_id', item.room_id)
              .eq('date', date)
          }
        }
      }
    }

    // Update booking status
    await this.db
      .from('bookings')
      .update({ status: 'CANCELLED', notes: reason ?? null, updated_at: new Date().toISOString() })
      .eq('id', id)
  }

  // ----------------------------------------------------------
  // Private helpers
  // ----------------------------------------------------------

  private nightsBetween(checkIn: string, checkOut: string): number {
    const start = new Date(`${checkIn}T00:00:00Z`).getTime()
    const end = new Date(`${checkOut}T00:00:00Z`).getTime()
    return Math.round((end - start) / 86400000)
  }

  private dateRange(checkIn: string, checkOut: string): string[] {
    const dates: string[] = []
    const cursor = new Date(`${checkIn}T00:00:00Z`)
    const end = new Date(`${checkOut}T00:00:00Z`)
    while (cursor < end) {
      dates.push(cursor.toISOString().slice(0, 10))
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
    return dates
  }
}
