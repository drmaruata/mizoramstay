import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { HostSettlementService } from '@/features/payments/host-settlement.service'

export const dynamic = 'force-dynamic'

async function processPayouts(request: Request) {
  const expected = process.env.CRON_SECRET
  const authorization = request.headers.get('authorization')
  if (!expected || authorization !== `Bearer ${expected}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createAdminClient()
  const service = new HostSettlementService(db)
  const results = await service.processDueSettlements()
  return NextResponse.json({ ok: true, results })
}

export async function GET(request: Request) {
  return processPayouts(request)
}

export async function POST(request: Request) {
  return processPayouts(request)
}
