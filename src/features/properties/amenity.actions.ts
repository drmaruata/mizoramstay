'use server'

import { createClient } from '@/lib/supabase/server'

export interface AmenityOption {
  id: string
  name: string
  category: string | null
  icon: string | null
}

/**
 * Fetch all active amenities for the host property form.
 * Uses the server client so RLS (public read for ACTIVE amenities) applies.
 */
export async function getAmenities(): Promise<AmenityOption[]> {
  const db = await createClient()
  const { data, error } = await db
    .from('amenities')
    .select('id, name, category, icon')
    .eq('status', 'ACTIVE')
    .order('name')

  if (error) {
    console.error('[getAmenities] error:', error.message)
    return []
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category ?? null,
    icon: row.icon ?? null,
  }))
}
