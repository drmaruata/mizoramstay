import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET
  const authorization = request.headers.get('authorization')
  if (!secret || authorization !== `Bearer ${secret}`) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  try {
    const admin = createAdminClient()
    const { data, error } = await admin.rpc('release_expired_booking_holds')
    if (error) throw error
    return NextResponse.json({ released: Number(data ?? 0) })
  } catch (error) {
    console.error('[booking-hold-cleanup]', error)
    return NextResponse.json({ error: 'Hold cleanup failed.' }, { status: 500 })
  }
}
