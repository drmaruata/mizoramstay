import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSupabasePropertyService } from '@/features/properties/property.service'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const destination = url.searchParams.get('destination')?.trim() || undefined
  const db = await createClient()
  const service = createSupabasePropertyService(db)
  const result = await service.listPublished(destination ? { destination } : undefined)
  return NextResponse.json({ data: result, meta: { count: result.length, source: 'supabase' } }, { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } })
}
