import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PortalShell } from '@/components/host/portal-shell'
import { HostPropertyForm } from '@/components/host/property-form'
import { createClient } from '@/lib/supabase/server'
import { HostPropertyService } from '@/features/properties/host.service'

export const dynamic = 'force-dynamic'

export default async function HostPropertyEditPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const db = await createClient()
  const service = new HostPropertyService(db)
  const hostProfileId = await service.getHostProfileId()

  if (!hostProfileId) {
    notFound()
  }

  // Resolve the property id from its slug (owned by this host).
  const { data: propertyRow } = await db
    .from('properties')
    .select('id')
    .eq('slug', slug)
    .eq('host_id', hostProfileId)
    .maybeSingle()

  if (!propertyRow) {
    notFound()
  }

  const property = await service.getForEdit(propertyRow.id)
  if (!property) {
    notFound()
  }

  return (
    <PortalShell>
      <div className="flex items-center gap-3">
        <Link href="/host/properties">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="size-4" /> Back
          </Button>
        </Link>
        <div>
          <p className="text-sm text-muted-foreground">Manage listing</p>
          <h1 className="mt-1 text-3xl font-black">{property.name}</h1>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Edit property</CardTitle>
        </CardHeader>
        <CardContent>
          <HostPropertyForm propertyId={property.id} initial={property} />
        </CardContent>
      </Card>
    </PortalShell>
  )
}
