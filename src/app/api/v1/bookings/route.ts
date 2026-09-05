import { NextResponse } from 'next/server'
import { createBookingSchema } from '@/lib/validation/booking'

export async function POST(request: Request) {
  const parsed = createBookingSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', issues: parsed.error.flatten() } }, { status: 400 })
  // Intentionally fail closed until Supabase RPC + payment provider secrets are configured.
  return NextResponse.json({ error: { code: 'BACKEND_NOT_CONFIGURED', message: 'Transactional booking requires the production Supabase RPC and payment integration.' } }, { status: 503 })
}
