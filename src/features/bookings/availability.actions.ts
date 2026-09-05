'use server'

import { createClient } from '@/lib/supabase/server'
import { AvailabilityService } from './availability.service'

/**
 * Check whether a room is available for a date range.
 * Called from the client booking form before confirming a booking.
 */
export async function checkRoomAvailability(roomId: string, checkIn: string, checkOut: string) {
  if (!roomId || !checkIn || !checkOut) {
    return { available: false, unavailableDate: null, nights: 0, error: 'Missing booking dates.' }
  }

  const db = await createClient()
  const service = new AvailabilityService(db)
  try {
    const result = await service.checkRoomAvailability(roomId, checkIn, checkOut)
    return { ...result, error: null }
  } catch (err) {
    console.error('[checkRoomAvailability]', err)
    return {
      available: true,
      unavailableDate: null,
      nights: 0,
      error: err instanceof Error ? err.message : 'Could not check availability.',
    }
  }
}
