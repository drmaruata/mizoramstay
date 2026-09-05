'use server'

import { createClient } from '@/lib/supabase/server'
import { createBookingSchema, BookingService, type CreateBookingInput } from './booking.service'

/**
 * Server action to create a new booking (PENDING state).
 * Validates input, checks inventory, and returns booking ID and number.
 */
export async function createBooking(input: CreateBookingInput) {
  try {
    createBookingSchema.parse(input)
    const db = await createClient()
    const service = new BookingService(db)
    const result = await service.createBooking(input)
    return { ok: true, data: result }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create booking.'
    console.error('[createBooking]', message)
    return { ok: false, error: message }
  }
}

/**
 * Server action to confirm a booking after payment is received.
 * This reserves inventory and transitions the booking to CONFIRMED.
 */
export async function confirmBooking(bookingId: string) {
  try {
    const db = await createClient()
    const service = new BookingService(db)
    await service.confirmBooking(bookingId)
    return { ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to confirm booking.'
    console.error('[confirmBooking]', message)
    return { ok: false, error: message }
  }
}

/**
 * Server action to cancel a booking and release inventory.
 */
export async function cancelBooking(bookingId: string, reason?: string) {
  try {
    const db = await createClient()
    const service = new BookingService(db)
    await service.cancelBooking(bookingId, reason)
    return { ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to cancel booking.'
    console.error('[cancelBooking]', message)
    return { ok: false, error: message }
  }
}

/**
 * Server action to fetch a booking by ID.
 */
export async function getBooking(bookingId: string) {
  try {
    const db = await createClient()
    const service = new BookingService(db)
    const booking = await service.getBooking(bookingId)
    return { ok: true, data: booking }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch booking.'
    console.error('[getBooking]', message)
    return { ok: false, error: message }
  }
}
