import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { HostPayoutService } from '@/features/payouts/host-payout.service'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET
  const authorization = request.headers.get('authorization')
  if (!expected || authorization !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createAdminClient()
  const service = new HostPayoutService(db)
  const results = await service.processDuePayouts()
  return NextResponse.json({ ok: true, results })
}
