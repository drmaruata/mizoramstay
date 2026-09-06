'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/**
 * Host booking lifecycle actions. These call SECURITY DEFINER RPCs
 * (migration 0026) that verify host ownership server-side, since hosts have
 * no direct UPDATE policy on `bookings`.
 */

export type HostActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string }

/** Mark a CONFIRMED booking as COMPLETED (host of the property only). */
export async function markBookingCompleted(bookingId: string): Promise<HostActionResult> {
  if (!bookingId) return { ok: false, error: 'Booking id is required.' }

  const db = await createClient()
  const { data, error } = await db.rpc('mark_booking_completed_transaction', {
    p_booking_id: bookingId,
  })

  if (error) {
    console.error('[markBookingCompleted]', error)
    return { ok: false, error: error.message }
  }

  revalidatePath('/host/bookings')
  revalidatePath('/host/dashboard')
  revalidatePath('/host/calendar')
  return { ok: true, message: `Booking ${data?.[0]?.booking_reference ?? ''} marked as completed.` }
}

/** Block or unblock a date range on a room's inventory (host of the property only). */
export async function setRoomBlocked(
  roomId: string,
  startDate: string,
  endDate: string,
  blocked: boolean
): Promise<HostActionResult> {
  if (!roomId || !startDate || !endDate) return { ok: false, error: 'Room and dates are required.' }
  if (endDate < startDate) return { ok: false, error: 'End date must be on or after the start date.' }

  const db = await createClient()
  const { data, error } = await db.rpc('set_room_inventory_block', {
    p_room_id: roomId,
    p_start_date: startDate,
    p_end_date: endDate,
    p_blocked: blocked,
  })

  if (error) {
    console.error('[setRoomBlocked]', error)
    return { ok: false, error: error.message }
  }

  revalidatePath('/host/calendar')
  return {
    ok: true,
    message: `${blocked ? 'Blocked' : 'Unblocked'} ${data?.length ?? 0} date(s).`,
  }
}