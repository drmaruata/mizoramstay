'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { updateHostRoom } from './actions'
import type { HostRoom } from '@/features/rooms/host-room.service'

export function RoomEditForm({ room }: { room: HostRoom }) {
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(formData: FormData) {
    setSaving(true); setMessage('')
    try { await updateHostRoom(formData); setMessage('Saved') } catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to save.') } finally { setSaving(false) }
  }

  return <form action={submit} className="grid gap-4 md:grid-cols-2">
    <input type="hidden" name="roomId" value={room.id} />
    <label className="space-y-1.5"><span className="text-xs font-bold text-[#415b52]">Room name</span><Input name="name" defaultValue={room.name} required className="h-11 rounded-xl" /></label>
    <label className="space-y-1.5"><span className="text-xs font-bold text-[#415b52]">Room type</span><Input name="roomType" defaultValue={room.roomType} placeholder="Deluxe, family, twin..." className="h-11 rounded-xl" /></label>
    <label className="space-y-1.5"><span className="text-xs font-bold text-[#415b52]">Maximum guests</span><Input name="maxGuests" type="number" min={1} max={20} defaultValue={room.maxGuests} required className="h-11 rounded-xl" /></label>
    <label className="space-y-1.5"><span className="text-xs font-bold text-[#415b52]">Base nightly price (₹)</span><Input name="basePrice" type="number" min={0} step="1" defaultValue={room.basePrice} required className="h-11 rounded-xl" /></label>
    <label className="space-y-1.5"><span className="text-xs font-bold text-[#415b52]">Beds</span><Input name="beds" defaultValue={room.beds} placeholder="1 king bed" className="h-11 rounded-xl" /></label>
    <label className="space-y-1.5"><span className="text-xs font-bold text-[#415b52]">Bathroom</span><Input name="bathroomType" defaultValue={room.bathroomType} placeholder="Private attached" className="h-11 rounded-xl" /></label>
    <label className="space-y-1.5 md:col-span-2"><span className="text-xs font-bold text-[#415b52]">Description</span><Textarea name="description" defaultValue={room.description} rows={4} className="rounded-xl" /></label>
    <div className="flex items-center justify-between gap-3 md:col-span-2"><p className="text-xs text-[#6c7d76]">Changes apply to the live room record. Availability and date-specific pricing are managed separately.</p><div className="flex items-center gap-3"><span className="text-xs font-semibold text-[#2b7a5c]">{message}</span><Button type="submit" disabled={saving} className="rounded-xl bg-[#154637] text-white hover:bg-[#103b2f]">{saving ? 'Saving…' : 'Save room'}</Button></div></div>
  </form>
}
