import Link from 'next/link'
import { BedDouble, Home, Users } from 'lucide-react'
import { requireHost } from '@/lib/auth/session'
import { PortalShell } from '@/components/host/portal-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { HostRoomService } from '@/features/rooms/host-room.service'
import { RoomEditForm } from './RoomEditForm'

export const dynamic = 'force-dynamic'

export default async function HostRoomsPage() {
  await requireHost()
  const db = await (await import('@/lib/supabase/server')).createClient()
  const service = new HostRoomService(db)
  const hostId = await service.getHostId()
  const rooms = hostId ? await service.list(hostId) : []

  return (
    <PortalShell>
      <div className="mx-auto w-full max-w-[1240px] space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#81918a]">Accommodation</p>
            <h1 className="mt-2 text-3xl font-black tracking-[-.04em] text-[#17332e] sm:text-[40px]">Rooms</h1>
            <p className="mt-2 text-sm leading-6 text-[#66776f]">Manage the exact rooms guests see, book and pay for.</p>
          </div>
          <Link href="/host/properties">
            <Button className="rounded-xl bg-[#154637] text-white hover:bg-[#103b2f]">
              <Home className="size-4" /> Manage properties
            </Button>
          </Link>
        </div>

        {rooms.length === 0 ? (
          <Card className="rounded-[28px] border-[#d6ded9]">
            <CardContent className="p-10 text-center">
              <BedDouble className="mx-auto size-10 text-[#6f827a]" />
              <p className="mt-4 text-lg font-black text-[#17332e]">No rooms yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Add rooms from the property registration or edit flow.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {rooms.map((room) => (
              <Card key={room.id} className="rounded-[28px] border-[#d6ded9] bg-white shadow-[0_8px_26px_rgba(21,70,55,.045)]">
                <CardHeader className="border-b border-[#edf0ed] px-5 pb-4 pt-5 md:px-6">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-xl text-[#17332e]">{room.name}</CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground">{room.propertyName} · {room.status}</p>
                    </div>
                    <span className="flex items-center gap-1.5 text-xs font-bold text-[#557169]">
                      <Users className="size-3.5" /> Up to {room.maxGuests} guests
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-5 md:p-6">
                  <RoomEditForm room={room} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  )
}
