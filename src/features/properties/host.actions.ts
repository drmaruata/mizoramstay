'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { HostPropertyService, hostPropertySchema } from './host.service'

async function getService() {
  const db = await createClient()
  return new HostPropertyService(db)
}

/**
 * Create a new property for the signed-in host.
 * Redirects to the property edit page on success.
 */
export async function createHostProperty(input: unknown) {
  const parsed = hostPropertySchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, error: 'Please fix the highlighted fields.' }
  }

  const service = await getService()
  const hostProfileId = await service.getHostProfileId()
  if (!hostProfileId) {
    return { ok: false as const, error: 'You must be signed in as a host to create a property.' }
  }

  try {
    const { id, slug } = await service.createProperty(hostProfileId, parsed.data)
    revalidatePath('/host/properties')
    redirect(`/host/properties/${slug}`)
    return { ok: true as const, id, slug }
  } catch (err) {
    console.error('[createHostProperty]', err)
    return { ok: false as const, error: err instanceof Error ? err.message : 'Failed to create property.' }
  }
}

/**
 * Update an existing property owned by the signed-in host.
 */
export async function updateHostProperty(propertyId: string, input: unknown) {
  const parsed = hostPropertySchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, error: 'Please fix the highlighted fields.' }
  }

  const service = await getService()
  const hostProfileId = await service.getHostProfileId()
  if (!hostProfileId) {
    return { ok: false as const, error: 'You must be signed in as a host.' }
  }

  try {
    const { id, slug } = await service.updateProperty(propertyId, parsed.data)
    revalidatePath('/host/properties')
    revalidatePath(`/host/properties/${slug}`)
    return { ok: true as const, id, slug }
  } catch (err) {
    console.error('[updateHostProperty]', err)
    return { ok: false as const, error: err instanceof Error ? err.message : 'Failed to update property.' }
  }
}

/**
 * Delete a property owned by the signed-in host.
 */
export async function deleteHostProperty(propertyId: string) {
  const service = await getService()
  const hostProfileId = await service.getHostProfileId()
  if (!hostProfileId) {
    return { ok: false as const, error: 'You must be signed in as a host.' }
  }

  try {
    await service.deleteProperty(propertyId)
    revalidatePath('/host/properties')
    return { ok: true as const }
  } catch (err) {
    console.error('[deleteHostProperty]', err)
    return { ok: false as const, error: err instanceof Error ? err.message : 'Failed to delete property.' }
  }
}

/**
 * Submit a property for review (host → admin).
 */
export async function submitPropertyForReview(propertyId: string) {
  const service = await getService()
  const hostProfileId = await service.getHostProfileId()
  if (!hostProfileId) {
    return { ok: false as const, error: 'You must be signed in as a host.' }
  }

  try {
    await service.setStatus(propertyId, 'PENDING_REVIEW')
    revalidatePath('/host/properties')
    return { ok: true as const }
  } catch (err) {
    console.error('[submitPropertyForReview]', err)
    return { ok: false as const, error: err instanceof Error ? err.message : 'Failed to submit property.' }
  }
}
