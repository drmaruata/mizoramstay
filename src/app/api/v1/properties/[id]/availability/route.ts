import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AvailabilityService } from '@/features/bookings/availability.service'

/**
 * GET /api/v1/properties/[id]/availability?roomId=...&checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD
 *
 * Real availability check against transactional `room_inventory`. A room is
 * available for a range when every night has `available_units > 0`. Dates with
 * no inventory row are treated as available (default availability).
 *
 * The transactional RPC (`create_booking_transaction`) remains the
 * authoritative gate when a booking is actually created.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const url = new URL(_request.url)
  const roomId = url.searchParams.get('roomId')?.trim()
  const checkIn = url.searchParams.get('checkIn')?.trim()
  const checkOut = url.searchParams.get('checkOut')?.trim()

  if (!roomId || !checkIn || !checkOut) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'roomId, checkIn and checkOut are required.' } },
      { status: 400 }
    )
  }

  const datePattern = /^\d{4}-\d{2}-\d{2}$/
  if (!datePattern.test(checkIn) || !datePattern.test(checkOut)) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'checkIn and checkOut must be YYYY-MM-DD dates.' } },
      { status: 400 }
    )
  }

  const db = await createClient()
  const service = new AvailabilityService(db)

  try {
    const result = await service.checkRoomAvailability(roomId, checkIn, checkOut)
    return NextResponse.json(
      {
        data: {
          propertyId: id,
          roomId,
          checkIn,
          checkOut,
          available: result.available,
          unavailableDate: result.unavailableDate,
          nights: result.nights,
        },
        meta: { source: 'room_inventory' },
      },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    console.error('[availability]', error)
    return NextResponse.json(
      { error: { code: 'AVAILABILITY_ERROR', message: 'Could not check availability.' } },
      { status: 500 }
    )
  }
}
