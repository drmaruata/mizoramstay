'use client'

import { useState, useTransition } from 'react'
import { Ban, Loader2, Unlock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { setRoomBlocked } from '@/features/bookings/host-booking.actions'

export interface BlockableRoom {
  id: string
  name: string
  propertyName: string
}

/** Block or unblock a date range on a room's inventory (host of the property only). */
export function InventoryBlockForm({ rooms }: { rooms: BlockableRoom[] }) {
  const [roomId, setRoomId] = useState(rooms[0]?.id ?? '')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [blocked, setBlocked] = useState(true)
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit() {
    if (!roomId || !startDate || !endDate) {
      setError('Select a room and a date range.')
      return
    }
    if (endDate < startDate) {
      setError('End date must be on or after the start date.')
      return
    }
    setError(null)
    setMessage(null)
    startTransition(async () => {
      const result = await setRoomBlocked(roomId, startDate, endDate, blocked)
      if (result.ok) setMessage(result.message ?? 'Updated.')
      else setError(result.error)
    })
  }

  return (
    <div className="rounded-xl border p-4">
      <p className="text-sm font-semibold">Block / unblock dates</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold">
          Room
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="mt-1 flex h-9 w-full rounded-md border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} — {r.propertyName}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs font-semibold">
            From
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1"
            />
          </label>
          <label className="text-xs font-semibold">
            To
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1"
            />
          </label>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={() => setBlocked(true)}
            className={`rounded-full px-3 py-1 font-semibold transition-colors ${
              blocked ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'
            }`}
          >
            Block
          </button>
          <button
            type="button"
            onClick={() => setBlocked(false)}
            className={`rounded-full px-3 py-1 font-semibold transition-colors ${
              !blocked ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'
            }`}
          >
            Unblock
          </button>
        </div>
        <Button size="sm" onClick={handleSubmit} disabled={pending}>
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : blocked ? (
            <Ban className="size-4" />
          ) : (
            <Unlock className="size-4" />
          )}
          {blocked ? 'Block dates' : 'Unblock dates'}
        </Button>
      </div>
      {message && <p className="mt-2 text-xs text-emerald-600">{message}</p>}
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  )
}