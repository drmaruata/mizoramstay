import type { PropertyRepository, PropertySearchInput } from './property.repository'
import { SupabasePropertyRepository } from './property.repository.supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

export function createPropertyService<TProperty>(repository: PropertyRepository<TProperty>) {
  return {
    listPublished: (input?: PropertySearchInput) => repository.listPublished(input),
    findById: (id: string) => repository.findById(id),
    findBySlug: (slug: string) => repository.findBySlug(slug),
  }
}

/**
 * Create a property service backed by a Supabase client (server-side).
 * Pass the server client from `src/lib/supabase/server.ts`.
 */
export function createSupabasePropertyService(db: SupabaseClient) {
  return createPropertyService(new SupabasePropertyRepository(db))
}
