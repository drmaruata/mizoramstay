import type { SupabaseClient } from '@supabase/supabase-js'

export interface AvailabilityResult {
  available: boolean
  /** The first unavailable date, if any. */
  unavailableDate: string | null
  /** Number of nights in the requested range. */
  nights: number
}

/**
 * Availability service backed by the `room_inventory` table.
 *
 * A room is considered available for a date range when every night in the
 * range has `available_units > 0` in `room_inventory`. Dates with no inventory
 * row are treated as available (default availability).
 *
 * Uses the server client so RLS (published inventory is public) applies.
 */
export class AvailabilityService {
  constructor(private db: SupabaseClient) {}

  /**
   * Check whether a room is available for the given date range.
   * `checkIn`/`checkOut` are ISO date strings (YYYY-MM-DD). The range is
   * [checkIn, checkOut) — checkOut night is not included.
   */
  async checkRoomAvailability(
    roomId: string,
    checkIn: string,
    checkOut: string
  ): Promise<AvailabilityResult> {
    const nights = this.nightsBetween(checkIn, checkOut)
    if (nights <= 0) {
      return { available: false, unavailableDate: checkIn, nights: 0 }
    }

    const dates = this.dateRange(checkIn, checkOut)

    const { data, error } = await this.db
      .from('room_inventory')
      .select('date, available_units')
      .eq('room_id', roomId)
      .gte('date', checkIn)
      .lt('date', checkOut)

    if (error) {
      console.error('[AvailabilityService] checkRoomAvailability error:', error.message)
      // Fail open: if we can't read inventory, don't block the booking.
      return { available: true, unavailableDate: null, nights }
    }

    const inventoryByDate = new Map<string, number>()
    for (const row of data ?? []) {
      inventoryByDate.set(row.date, Number(row.available_units ?? 0))
    }

    for (const date of dates) {
      const units = inventoryByDate.get(date)
      // No inventory row → available by default.
      if (units != null && units <= 0) {
        return { available: false, unavailableDate: date, nights }
      }
    }

    return { available: true, unavailableDate: null, nights }
  }

  /** Number of nights between two ISO dates (checkOut exclusive). */
  private nightsBetween(checkIn: string, checkOut: string): number {
    const start = new Date(`${checkIn}T00:00:00Z`).getTime()
    const end = new Date(`${checkOut}T00:00:00Z`).getTime()
    return Math.round((end - start) / 86400000)
  }

  /** List of ISO dates in [checkIn, checkOut). */
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
