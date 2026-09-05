import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createSupabasePropertyService } from '@/features/properties/property.service'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const now = new Date()
  const db = await createClient()
  const service = createSupabasePropertyService(db)
  const properties = await service.listPublished()
  const { data: destinations } = await db
    .from('destinations')
    .select('slug')
    .eq('status', 'PUBLISHED')
  return [
    { url: base, lastModified: now },
    { url: `${base}/stays`, lastModified: now },
    { url: `${base}/destinations`, lastModified: now },
    ...properties.map((p) => ({ url: `${base}/stays/${p.slug}`, lastModified: now })),
    ...(destinations ?? []).map((d) => ({ url: `${base}/destinations/${d.slug}`, lastModified: now })),
  ]
}
