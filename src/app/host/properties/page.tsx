import Link from 'next/link'
import { ArrowUpRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PortalShell } from '@/components/host/portal-shell'
import { HostPropertyForm } from '@/components/host/property-form'
import { createClient } from '@/lib/supabase/server'
import { HostPropertyService } from '@/features/properties/host.service'

export const dynamic = 'force-dynamic'

function statusBadge(status: string) {
  const map: Record<string, string> = {
    PUBLISHED: 'bg-primary/10 text-primary',
    PENDING_REVIEW: 'bg-accent/15 text-accent-foreground',
    DRAFT: 'bg-muted text-muted-foreground',
    SUSPENDED: 'bg-destructive/10 text-destructive',
    ARCHIVED: 'bg-muted text-muted-foreground',
  }
  return map[status] ?? 'bg-muted text-muted-foreground'
}

export default async function HostPropertiesPage() {
  const db = await createClient()
  const service = new HostPropertyService(db)
  const hostProfileId = await service.getHostProfileId()

  let properties: Awaited<ReturnType<typeof service.listForHost>> = []
  if (hostProfileId) {
    properties = await service.listForHost(hostProfileId)
  }

  return (
    <PortalShell>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted-foreground">Manage listing</p>
          <h1 className="mt-1 text-3xl font-black">Your properties</h1>
        </div>
      </div>

      {!hostProfileId ? (
        <Card className="mt-6">
          <CardContent className="p-8 text-center">
            <p className="font-semibold">You are not set up as a host yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Complete your host profile to start listing properties.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((p) => (
              <Card key={p.id} className="overflow-hidden">
                <div className="h-36 w-full bg-muted" />
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold">{p.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {p.district || 'No district'} • {p.roomCount} room
                        {p.roomCount === 1 ? '' : 's'}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusBadge(p.status)}`}
                    >
                      {p.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-sm font-semibold">
                      {p.priceFrom != null ? `₹${p.priceFrom}` : 'No price'}
                    </p>
                    <Link href={`/host/properties/${p.slug}`}>
                      <Button variant="outline" size="sm">
                        Manage <ArrowUpRight className="size-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}

            {properties.length === 0 && (
              <Card className="md:col-span-2 lg:col-span-3">
                <CardContent className="p-8 text-center">
                  <p className="font-semibold">No properties yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Create your first listing below to get started.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="size-5" /> New property
              </CardTitle>
            </CardHeader>
            <CardContent>
              <HostPropertyForm />
            </CardContent>
          </Card>
        </>
      )}
    </PortalShell>
  )
}
