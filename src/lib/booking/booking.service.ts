import type { CreateBookingInput } from '@/lib/validation/booking'

export interface BookingRepository { createReservation(input: CreateBookingInput): Promise<{ bookingId: string; status: 'PENDING' }> }

/** Domain service boundary. In production this is backed by a transactional Supabase/PostgreSQL RPC. */
export async function createBooking(input: CreateBookingInput, repository: BookingRepository) { return repository.createReservation(input) }
