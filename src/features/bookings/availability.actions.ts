'use server'

import { createClient } from '@/lib/supabase/server'
import { AvailabilityService } from './availability.service'

/**
 * Check whether a room is available for a date range.
 * Called from the booking form as a fast pre-check; the transactional RPC
 * remains the authoritative availability gate when the booking is created.
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
      available: false,
      unavailableDate: null,
      nights: 0,
      error: err instanceof Error ? err.message : 'Could not verify availability. Please try again.',
    }
  }
}
