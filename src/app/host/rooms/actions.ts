'use server'

import { revalidatePath } from 'next/cache'
import { requireHost } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { HostRoomService } from '@/features/rooms/host-room.service'

export async function updateHostRoom(formData: FormData) {
  await requireHost()
  const db = await createClient()
  const service = new HostRoomService(db)
  const hostId = await service.getHostId()
  if (!hostId) throw new Error('Host profile not found.')

  const maxGuests = Number(formData.get('maxGuests') ?? 1)
  const basePrice = Number(formData.get('basePrice') ?? 0)
  if (!Number.isInteger(maxGuests) || maxGuests < 1 || maxGuests > 20) throw new Error('Maximum guests must be between 1 and 20.')
  if (!Number.isFinite(basePrice) || basePrice < 0) throw new Error('Base price must be zero or greater.')

  await service.update(String(formData.get('roomId')), hostId, {
    name: String(formData.get('name') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
    roomType: String(formData.get('roomType') ?? '').trim(),
    maxGuests,
    beds: String(formData.get('beds') ?? '').trim(),
    bathroomType: String(formData.get('bathroomType') ?? '').trim(),
    basePrice,
  })
  revalidatePath('/host/rooms')
  revalidatePath('/host/properties')
  return { ok: true }
}
