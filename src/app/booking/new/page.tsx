import { notFound } from 'next/navigation'
import { BookingForm } from '@/components/public/booking-form'
import { createClient } from '@/lib/supabase/server'
import { createSupabasePropertyService } from '@/features/properties/property.service'

export default async function NewBookingPage({ searchParams }: { searchParams: Promise<{ property?: string; room?: string }> }) {
  const params = await searchParams
  const db = await createClient()
  const service = createSupabasePropertyService(db)
  const property = params.property ? await service.findById(params.property) : null
  if (!property) notFound()
  const room = params.room ? property.rooms.find((r) => r.id === params.room) ?? null : null
  return <BookingForm property={property} room={room} />
}
