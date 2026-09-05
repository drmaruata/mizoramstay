'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { createHostProperty, updateHostProperty } from '@/features/properties/host.actions'
import { getAmenities, type AmenityOption } from '@/features/properties/amenity.actions'
import type { HostPropertyInput } from '@/features/properties/host.service'

const PROPERTY_TYPES = ['HOMESTAY', 'HOTEL', 'GUESTHOUSE', 'LODGE', 'RESORT', 'VILLAGE_STAY'] as const

interface RoomDraft {
  id?: string
  name: string
  description: string
  maxGuests: number
  basePrice: number
  roomType: string
  beds: string
  bathroomType: string
}

interface HostPropertyFormProps {
  propertyId?: string
  initial?: Partial<HostPropertyInput> & { rooms?: RoomDraft[] }
}

export function HostPropertyForm({ propertyId, initial }: HostPropertyFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [amenities, setAmenities] = useState<AmenityOption[]>([])
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(initial?.amenityIds ?? [])

  const [name, setName] = useState(initial?.name ?? '')
  const [propertyType, setPropertyType] = useState(initial?.propertyType ?? 'HOMESTAY')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [address, setAddress] = useState(initial?.address ?? '')
  const [village, setVillage] = useState(initial?.village ?? '')
  const [town, setTown] = useState(initial?.town ?? '')
  const [district, setDistrict] = useState(initial?.district ?? '')
  const [pincode, setPincode] = useState(initial?.pincode ?? '')
  const [cancellationPolicy, setCancellationPolicy] = useState(initial?.cancellationPolicy ?? '')
  const [rooms, setRooms] = useState<RoomDraft[]>(initial?.rooms ?? [])

  // Load amenities on mount
  useEffect(() => {
    getAmenities().then(setAmenities)
  }, [])

  function toggleAmenity(id: string) {
    setSelectedAmenities((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload: HostPropertyInput = {
      name,
      propertyType,
      description,
      address,
      village,
      town,
      district,
      pincode,
      cancellationPolicy,
      amenityIds: selectedAmenities,
      rooms: rooms.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        maxGuests: r.maxGuests,
        basePrice: r.basePrice,
        roomType: r.roomType,
        beds: r.beds,
        bathroomType: r.bathroomType,
      })),
    }

    const result = propertyId
      ? await updateHostProperty(propertyId, payload)
      : await createHostProperty(payload)

    if (!result.ok) {
      setError(result.error)
      setSaving(false)
      return
    }

    router.refresh()
    if (!propertyId) {
      router.push(`/host/properties/${result.slug}`)
    }
  }

  function addRoom() {
    setRooms((prev) => [
      ...prev,
      { name: '', description: '', maxGuests: 2, basePrice: 0, roomType: '', beds: '', bathroomType: '' },
    ])
  }

  function updateRoom(index: number, patch: Partial<RoomDraft>) {
    setRooms((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  function removeRoom(index: number) {
    setRooms((prev) => prev.filter((_, i) => i !== index))
  }

  // Group amenities by category for display
  const groupedAmenities = amenities.reduce<Record<string, AmenityOption[]>>((acc, a) => {
    const cat = a.category ?? 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(a)
    return acc
  }, {})

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="name">Property name</Label>
          <Input
            id="name"
            className="mt-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mizoram Hills Homestay"
            required
          />
        </div>

        <div>
          <Label htmlFor="propertyType">Property type</Label>
          <select
            id="propertyType"
            className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value as HostPropertyInput['propertyType'])}
          >
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="district">District</Label>
          <Input
            id="district"
            className="mt-2"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            placeholder="e.g. Aizawl"
          />
        </div>

        <div>
          <Label htmlFor="town">Town / Village</Label>
          <Input
            id="town"
            className="mt-2"
            value={town}
            onChange={(e) => setTown(e.target.value)}
            placeholder="e.g. Reiek"
          />
        </div>

        <div>
          <Label htmlFor="village">Village</Label>
          <Input
            id="village"
            className="mt-2"
            value={village}
            onChange={(e) => setVillage(e.target.value)}
            placeholder="Optional"
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            className="mt-2"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street address"
          />
        </div>

        <div>
          <Label htmlFor="pincode">PIN code</Label>
          <Input
            id="pincode"
            className="mt-2"
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            placeholder="796001"
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            className="mt-2 min-h-32"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your stay…"
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="cancellationPolicy">Cancellation policy</Label>
          <Textarea
            id="cancellationPolicy"
            className="mt-2 min-h-20"
            value={cancellationPolicy}
            onChange={(e) => setCancellationPolicy(e.target.value)}
            placeholder="e.g. Free cancellation up to 48 hours before check-in."
          />
        </div>
      </div>

      {/* Amenities */}
      <div>
        <h3 className="text-lg font-bold">Amenities</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Select the facilities your property offers.
        </p>
        <div className="mt-4 space-y-4">
          {Object.entries(groupedAmenities).map(([category, items]) => (
            <div key={category}>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {category}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {items.map((amenity) => {
                  const isSelected = selectedAmenities.includes(amenity.id)
                  return (
                    <button
                      key={amenity.id}
                      type="button"
                      onClick={() => toggleAmenity(amenity.id)}
                      className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                      }`}
                    >
                      {amenity.name}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rooms */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Rooms</h3>
          <Button type="button" variant="outline" size="sm" onClick={addRoom}>
            <Plus className="size-4" /> Add room
          </Button>
        </div>

        {rooms.length === 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            No rooms yet. Add at least one room with a nightly price.
          </p>
        )}

        <div className="mt-3 space-y-4">
          {rooms.map((room, index) => (
            <div key={index} className="rounded-2xl border p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Room name</Label>
                  <Input
                    className="mt-1"
                    value={room.name}
                    onChange={(e) => updateRoom(index, { name: e.target.value })}
                    placeholder="e.g. Deluxe Double"
                    required
                  />
                </div>
                <div>
                  <Label>Room type</Label>
                  <Input
                    className="mt-1"
                    value={room.roomType}
                    onChange={(e) => updateRoom(index, { roomType: e.target.value })}
                    placeholder="e.g. Double"
                  />
                </div>
                <div>
                  <Label>Max guests</Label>
                  <Input
                    type="number"
                    min={1}
                    className="mt-1"
                    value={room.maxGuests}
                    onChange={(e) => updateRoom(index, { maxGuests: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Nightly price (₹)</Label>
                  <Input
                    type="number"
                    min={0}
                    className="mt-1"
                    value={room.basePrice}
                    onChange={(e) => updateRoom(index, { basePrice: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Beds</Label>
                  <Input
                    className="mt-1"
                    value={room.beds}
                    onChange={(e) => updateRoom(index, { beds: e.target.value })}
                    placeholder="e.g. 1 Queen"
                  />
                </div>
                <div>
                  <Label>Bathroom</Label>
                  <Input
                    className="mt-1"
                    value={room.bathroomType}
                    onChange={(e) => updateRoom(index, { bathroomType: e.target.value })}
                    placeholder="e.g. Private"
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-3 text-destructive"
                onClick={() => removeRoom(index)}
              >
                Remove room
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {propertyId ? 'Save changes' : 'Create property'}
        </Button>
      </div>
    </form>
  )
}
