'use server'

import { revalidatePath } from 'next/cache'
import { requireHost } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { HostPricingService } from '@/features/pricing/host-pricing.service'

export async function saveRoomPrice(formData: FormData) {
  await requireHost()
  const db = await createClient(); const service = new HostPricingService(db)
  const hostId = await service.getHostId(); if (!hostId) throw new Error('Host profile not found.')
  const basePrice = Number(formData.get('basePrice') ?? 0)
  const minimumStay = Number(formData.get('minimumStay') ?? 1)
  if (!Number.isFinite(basePrice) || basePrice < 0) throw new Error('Base price must be zero or greater.')
  if (!Number.isInteger(minimumStay) || minimumStay < 1 || minimumStay > 30) throw new Error('Minimum stay must be between 1 and 30 nights.')
  const nullable = (key:string) => { const v=String(formData.get(key)??'').trim(); return v ? Number(v) : null }
  const date = String(formData.get('date')??''); if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Select a valid date.')
  await service.upsertDate(hostId,{roomId:String(formData.get('roomId')),date,basePrice,weekendPrice:nullable('weekendPrice'),seasonalPrice:nullable('seasonalPrice'),specialPrice:nullable('specialPrice'),minimumStay})
  revalidatePath('/host/pricing')
  return { ok:true }
}
