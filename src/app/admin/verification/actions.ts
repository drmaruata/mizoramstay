'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { PropertyAdminService } from '@/features/properties/admin.service'

export async function approveProperty(input: { propertyId: string; verificationLevel?: number; notes?: string | null }) {
  const admin = await requireAdmin()
  const service = new PropertyAdminService(createAdminClient())
  await service.approveProperty({ propertyId: input.propertyId, adminId: admin.id, verificationLevel: input.verificationLevel ?? 4, notes: input.notes ?? null })
  revalidatePath('/admin/verification')
  revalidatePath('/admin')
  revalidatePath('/host/properties')
}

export async function rejectProperty(input: { propertyId: string; reason: string }) {
  const admin = await requireAdmin()
  if (!input.reason.trim()) throw new Error('A rejection reason is required.')
  const service = new PropertyAdminService(createAdminClient())
  await service.rejectProperty({ propertyId: input.propertyId, adminId: admin.id, reason: input.reason.trim() })
  revalidatePath('/admin/verification')
  revalidatePath('/admin')
  revalidatePath('/host/properties')
}

export async function requestPropertyChanges(input: { propertyId: string; requiredChanges: string[]; reason: string }) {
  const admin = await requireAdmin()
  if (!input.requiredChanges.length) throw new Error('Select at least one required change.')
  if (!input.reason.trim()) throw new Error('A change request explanation is required.')
  const service = new PropertyAdminService(createAdminClient())
  await service.requestChanges({ propertyId: input.propertyId, adminId: admin.id, requiredChanges: [...input.requiredChanges, input.reason.trim()] })
  revalidatePath('/admin/verification')
  revalidatePath('/admin')
}
