import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
export async function GET() {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('properties')
    .select('id, name, district, town, verification_level, status')
    .in('status', ['DRAFT', 'PENDING_REVIEW'])
    .order('created_at', { ascending: true })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({
    data: (data ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      location: p.town ?? p.district ?? '',
      verificationLevel: p.verification_level,
    })),
  })
}
