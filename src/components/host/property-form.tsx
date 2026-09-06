'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Camera,
  Check,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { createHostProperty, updateHostProperty } from '@/features/properties/host.actions'
import { getAmenities, type AmenityOption } from '@/features/properties/amenity.actions'
import type { HostPropertyInput, PropertyMediaDraft } from '@/features/properties/host.service'
import { createClient } from '@/lib/supabase/browser'

const PROPERTY_TYPES = ['HOMESTAY', 'HOTEL', 'GUESTHOUSE', 'LODGE', 'RESORT', 'VILLAGE_STAY'] as const
const MAX_IMAGE_SIZE = 8 * 1024 * 1024
const MAX_PROPERTY_IMAGES = 8
const MAX_ROOM_IMAGES = 6
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

interface MediaDraft extends Omit<PropertyMediaDraft, 'id'> {
  id?: string
  file?: File
}

interface RoomDraft {
  id?: string
  name: string
  description: string
  maxGuests: number
  basePrice: number
  roomType: string
  beds: string
  bathroomType: string
  images: MediaDraft[]
}

interface HostPropertyInitial extends Partial<HostPropertyInput> {
  media?: PropertyMediaDraft[]
  rooms?: Array<Omit<RoomDraft, 'images'> & { images?: MediaDraft[] }>
}

interface HostPropertyFormProps {
  propertyId?: string
  initial?: HostPropertyInitial
}

function toMediaDraft(media: PropertyMediaDraft): MediaDraft {
  return { ...media }
}

function fileExtension(file: File) {
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  return 'jpg'
}

function ImagePicker({
  title,
  description,
  images,
  maxImages,
  onChange,
}: {
  title: string
  description: string
  images: MediaDraft[]
  maxImages: number
  onChange: (images: MediaDraft[]) => void
}) {
  const [message, setMessage] = useState<string | null>(null)

  function addFiles(files: FileList | null) {
    if (!files) return
    setMessage(null)
    const remaining = maxImages - images.length
    if (remaining <= 0) {
      setMessage(`Maximum ${maxImages} images.`)
      return
    }

    const selected = Array.from(files).slice(0, remaining)
    const invalidType = selected.find((file) => !IMAGE_TYPES.has(file.type))
    if (invalidType) {
      setMessage('Use JPG, PNG or WebP images only.')
      return
    }
    const oversized = selected.find((file) => file.size > MAX_IMAGE_SIZE)
    if (oversized) {
      setMessage('Each image must be 8 MB or smaller.')
      return
    }

    const next = selected.map((file) => ({
      id: undefined,
      url: URL.createObjectURL(file),
      altText: title,
      sortOrder: images.length,
      isHero: false,
      mediaType: 'IMAGE',
      roomId: null,
      storagePath: null,
      file,
    }))
    onChange([...images, ...next])
  }

  function removeImage(index: number) {
    const image = images[index]
    if (image?.file) URL.revokeObjectURL(image.url)
    onChange(images.filter((_, i) => i !== index).map((image, i) => ({ ...image, sortOrder: i })))
  }

  return (
    <div className="rounded-2xl border border-[#d8d3c8] bg-white/70 p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Camera className="size-4 text-[#0f5a45]" />
            <h4 className="font-bold text-[#17332e]">{title}</h4>
            <span className="rounded-full bg-[#edf3ee] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0f5a45]">
              {images.length}/{maxImages}
            </span>
          </div>
          <p className="mt-1 text-xs leading-5 text-[#75827d]">{description}</p>
        </div>
      </div>

      <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#c8d4ce] bg-[#f6faf7] px-4 py-7 text-center transition hover:border-[#0f5a45]/50 hover:bg-[#edf3ee]">
        <span className="grid size-11 place-items-center rounded-full bg-white text-[#0f5a45] shadow-sm">
          <Upload className="size-5" />
        </span>
        <span className="mt-3 text-sm font-semibold text-[#17332e]">Add photos</span>
        <span className="mt-1 text-xs text-[#75827d]">JPG, PNG or WebP · up to 8 MB each</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          onChange={(event) => {
            addFiles(event.target.files)
            event.currentTarget.value = ''
          }}
        />
      </label>

      {message && (
        <p className="mt-3 rounded-xl bg-[#fff4df] px-3 py-2 text-xs font-medium text-[#8a5b10]">{message}</p>
      )}

      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((image, index) => (
            <div key={image.id ?? image.url} className="group relative aspect-square overflow-hidden rounded-xl border bg-[#edf3ee]">
              <Image
                src={image.url}
                alt={image.altText || `${title} ${index + 1}`}
                fill
                unoptimized
                sizes="(max-width:640px) 45vw, (max-width:1024px) 25vw, 180px"
                className="object-cover"
              />
              {index === 0 && (
                <span className="absolute bottom-2 left-2 rounded-full bg-[#17332e]/90 px-2 py-1 text-[10px] font-bold text-white">
                  Cover
                </span>
              )}
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-white/95 text-[#7d3730] shadow-sm transition hover:bg-white"
                aria-label={`Remove ${title.toLowerCase()} ${index + 1}`}
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function HostPropertyForm({ propertyId, initial }: HostPropertyFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [amenities, setAmenities] = useState<AmenityOption[]>([])
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(initial?.amenityIds ?? [])
  const [activePropertyId, setActivePropertyId] = useState(propertyId)
  const [propertyImages, setPropertyImages] = useState<MediaDraft[]>(() =>
    (initial?.media ?? []).filter((media) => !media.roomId).map(toMediaDraft)
  )

  const initialMediaIds = useRef(new Set((initial?.media ?? []).map((media) => media.id)))

  const [name, setName] = useState(initial?.name ?? '')
  const [propertyType, setPropertyType] = useState(initial?.propertyType ?? 'HOMESTAY')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [address, setAddress] = useState(initial?.address ?? '')
  const [village, setVillage] = useState(initial?.village ?? '')
  const [town, setTown] = useState(initial?.town ?? '')
  const [district, setDistrict] = useState(initial?.district ?? '')
  const [pincode, setPincode] = useState(initial?.pincode ?? '')
  const [cancellationPolicy, setCancellationPolicy] = useState(initial?.cancellationPolicy ?? '')
  const [rooms, setRooms] = useState<RoomDraft[]>(() =>
    (initial?.rooms ?? []).map((room) => ({
      id: room.id,
      name: room.name,
      description: room.description,
      maxGuests: room.maxGuests,
      basePrice: room.basePrice,
      roomType: room.roomType,
      beds: room.beds,
      bathroomType: room.bathroomType,
      images: room.images ?? (initial?.media ?? []).filter((media) => media.roomId === room.id).map(toMediaDraft),
    }))
  )

  useEffect(() => {
    getAmenities().then(setAmenities)
  }, [])

  function toggleAmenity(id: string) {
    setSelectedAmenities((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  function addRoom() {
    setRooms((prev) => [
      ...prev,
      {
        name: '',
        description: '',
        maxGuests: 2,
        basePrice: 0,
        roomType: '',
        beds: '',
        bathroomType: '',
        images: [],
      },
    ])
  }

  function updateRoom(index: number, patch: Partial<RoomDraft>) {
    setRooms((prev) => prev.map((room, i) => (i === index ? { ...room, ...patch } : room)))
  }

  function removeRoom(index: number) {
    setRooms((prev) => {
      const room = prev[index]
      room?.images.forEach((image) => {
        if (image.file) URL.revokeObjectURL(image.url)
      })
      return prev.filter((_, i) => i !== index)
    })
  }

  const groupedAmenities = useMemo(
    () =>
      amenities.reduce<Record<string, AmenityOption[]>>((acc, amenity) => {
        const cat = amenity.category ?? 'Other'
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(amenity)
        return acc
      }, {}),
    [amenities]
  )

  async function syncMedia(propertyIdToSave: string, savedRooms: Array<{ id: string; name: string }>) {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Your session expired. Please sign in again.')

    const desired: Array<{ draft: MediaDraft; roomId: string | null; sortOrder: number; isHero: boolean }> = []
    propertyImages.forEach((image, index) => {
      desired.push({ draft: image, roomId: null, sortOrder: index, isHero: index === 0 })
    })
    rooms.forEach((room, roomIndex) => {
      const savedRoomId = savedRooms[roomIndex]?.id
      if (!savedRoomId) return
      room.images.forEach((image, imageIndex) => {
        desired.push({ draft: image, roomId: savedRoomId, sortOrder: imageIndex, isHero: false })
      })
    })

    const desiredIds = new Set(desired.map((item) => item.draft.id).filter(Boolean) as string[])
    const mediaToDelete = Array.from(initialMediaIds.current).filter((id) => !desiredIds.has(id))

    for (const id of mediaToDelete) {
      const { data: mediaRow } = await supabase
        .from('property_media')
        .select('storage_path')
        .eq('id', id)
        .maybeSingle()

      if (mediaRow?.storage_path) {
        await supabase.storage.from('property-media').remove([mediaRow.storage_path])
      }
      const { error: deleteError } = await supabase.from('property_media').delete().eq('id', id)
      if (deleteError) throw new Error(deleteError.message)
    }

    for (const item of desired) {
      const draft = item.draft

      if (draft.id) {
        const { error: updateError } = await supabase
          .from('property_media')
          .update({
            room_id: item.roomId,
            sort_order: item.sortOrder,
            is_hero: item.isHero,
            alt_text: draft.altText || null,
          })
          .eq('id', draft.id)
        if (updateError) throw new Error(updateError.message)
        continue
      }

      if (!draft.file) continue

      const path = `${user.id}/${propertyIdToSave}/${item.roomId ? `rooms/${item.roomId}` : 'property'}/${crypto.randomUUID()}.${fileExtension(draft.file)}`
      const { error: uploadError } = await supabase.storage
        .from('property-media')
        .upload(path, draft.file, {
          contentType: draft.file.type,
          cacheControl: '31536000',
          upsert: false,
        })

      if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`)

      const { data: publicUrl } = supabase.storage.from('property-media').getPublicUrl(path)
      const { error: insertError } = await supabase.from('property_media').insert({
        property_id: propertyIdToSave,
        room_id: item.roomId,
        url: publicUrl.publicUrl,
        alt_text: draft.altText || null,
        sort_order: item.sortOrder,
        is_hero: item.isHero,
        media_type: 'IMAGE',
        storage_path: path,
      })

      if (insertError) {
        await supabase.storage.from('property-media').remove([path])
        throw new Error(`Photo record failed: ${insertError.message}`)
      }
    }

    const hero = propertyImages[0]?.url ?? rooms[0]?.images[0]?.url ?? null
    const { error: heroError } = await supabase
      .from('properties')
      .update({ hero_image: hero })
      .eq('id', propertyIdToSave)
    if (heroError) throw new Error(heroError.message)

    const { data: finalMedia, error: finalMediaError } = await supabase
      .from('property_media')
      .select('id, url, alt_text, sort_order, is_hero, media_type, room_id, storage_path')
      .eq('property_id', propertyIdToSave)
      .order('sort_order', { ascending: true })
    if (finalMediaError) throw new Error(finalMediaError.message)

    return (finalMedia ?? []).map((media: any): PropertyMediaDraft => ({
      id: media.id,
      url: media.url,
      altText: media.alt_text ?? '',
      sortOrder: Number(media.sort_order ?? 0),
      isHero: Boolean(media.is_hero),
      mediaType: media.media_type ?? 'IMAGE',
      roomId: media.room_id ?? null,
      storagePath: media.storage_path ?? null,
    }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    if (rooms.length === 0) {
      setError('Add at least one bookable room before saving the listing.')
      setSaving(false)
      return
    }
    if (propertyImages.length === 0 && rooms.every((room) => room.images.length === 0)) {
      setError('Add at least one property or room photo so guests can see what they are booking.')
      setSaving(false)
      return
    }

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
      rooms: rooms.map((room) => ({
        id: room.id,
        name: room.name,
        description: room.description,
        maxGuests: room.maxGuests,
        basePrice: room.basePrice,
        roomType: room.roomType,
        beds: room.beds,
        bathroomType: room.bathroomType,
      })),
    }

    const result = activePropertyId
      ? await updateHostProperty(activePropertyId, payload)
      : await createHostProperty(payload)

    if (!result.ok) {
      setError(result.error)
      setSaving(false)
      return
    }

    const savedPropertyId = result.id
    setActivePropertyId(savedPropertyId)

    try {
      const finalMedia = await syncMedia(savedPropertyId, result.rooms)
      initialMediaIds.current = new Set(finalMedia.map((media) => media.id))
      setPropertyImages(finalMedia.filter((media) => !media.roomId).map(toMediaDraft))
      setRooms((currentRooms) =>
        currentRooms.map((room, index) => ({
          ...room,
          id: result.rooms[index]?.id ?? room.id,
          images: finalMedia.filter((media) => media.roomId === result.rooms[index]?.id).map(toMediaDraft),
        }))
      )

      router.refresh()
      if (!propertyId) {
        router.push(`/host/properties/${result.slug}`)
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'The property was saved, but photo upload failed. Please retry.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-2xl border border-[#e5b0a8] bg-[#fff1ef] px-4 py-3 text-sm text-[#8a3128]">
          {error}
        </div>
      )}

      <section>
        <div className="mb-5">
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#0f5a45]">01 · Listing basics</p>
          <h3 className="mt-1 text-2xl font-black tracking-tight text-[#17332e]">Tell guests about your stay</h3>
          <p className="mt-1 text-sm text-[#75827d]">Clear, specific information makes a listing easier to trust and book.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="name">Property name</Label>
            <Input id="name" className="mt-2" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mizoram Hills Homestay" required />
          </div>

          <div>
            <Label htmlFor="propertyType">Property type</Label>
            <select id="propertyType" className="mt-2 h-11 w-full rounded-xl border border-[#cfc9bc] bg-white px-3 text-sm" value={propertyType} onChange={(e) => setPropertyType(e.target.value as HostPropertyInput['propertyType'])}>
              {PROPERTY_TYPES.map((type) => (
                <option key={type} value={type}>{type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="district">District</Label>
            <Input id="district" className="mt-2" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="e.g. Aizawl" />
          </div>

          <div>
            <Label htmlFor="town">Town / Village</Label>
            <Input id="town" className="mt-2" value={town} onChange={(e) => setTown(e.target.value)} placeholder="e.g. Reiek" />
          </div>

          <div>
            <Label htmlFor="village">Village</Label>
            <Input id="village" className="mt-2" value={village} onChange={(e) => setVillage(e.target.value)} placeholder="Optional" />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" className="mt-2" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street address" />
          </div>

          <div>
            <Label htmlFor="pincode">PIN code</Label>
            <Input id="pincode" className="mt-2" value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="796001" />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" className="mt-2 min-h-32" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the stay, what makes it special, and what guests should know." />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="cancellationPolicy">Cancellation policy</Label>
            <Textarea id="cancellationPolicy" className="mt-2 min-h-20" value={cancellationPolicy} onChange={(e) => setCancellationPolicy(e.target.value)} placeholder="e.g. Free cancellation up to 48 hours before check-in." />
          </div>
        </div>
      </section>

      <section>
        <div className="mb-5">
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#0f5a45]">02 · Property photography</p>
          <h3 className="mt-1 text-2xl font-black tracking-tight text-[#17332e]">Show the experience, not just the building</h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#75827d]">Upload a strong cover image and a few wider property views. These photos are used throughout the tourist marketplace.</p>
        </div>

        <ImagePicker
          title="Property gallery"
          description="Best for the exterior, living areas, views, dining spaces and shared facilities. The first photo becomes the listing cover."
          images={propertyImages}
          maxImages={MAX_PROPERTY_IMAGES}
          onChange={setPropertyImages}
        />
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#0f5a45]">03 · Rooms & rates</p>
            <h3 className="mt-1 text-2xl font-black tracking-tight text-[#17332e]">Give every bookable room its own identity</h3>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#75827d]">Room photos stay attached to the room. Tourists will see the correct images beside the room they select.</p>
          </div>
          <Button type="button" variant="outline" onClick={addRoom} className="shrink-0 rounded-xl border-[#c5d2cb]">
            <Plus className="size-4" /> Add room
          </Button>
        </div>

        {rooms.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#c8d4ce] bg-[#f6faf7] p-8 text-center">
            <ImagePlus className="mx-auto size-8 text-[#0f5a45]" />
            <p className="mt-3 font-semibold text-[#17332e]">Start with your first room</p>
            <p className="mt-1 text-sm text-[#75827d]">Add the room name, nightly price and at least one photo.</p>
            <Button type="button" variant="outline" onClick={addRoom} className="mt-4 rounded-xl">
              <Plus className="size-4" /> Add your first room
            </Button>
          </div>
        )}

        <div className="space-y-5">
          {rooms.map((room, index) => (
            <div key={room.id ?? `new-room-${index}`} className="rounded-3xl border border-[#d8d3c8] bg-[#fbfaf6] p-4 sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-full bg-[#17332e] text-xs font-bold text-white">{index + 1}</span>
                    <p className="text-lg font-black text-[#17332e]">{room.name || `Room ${index + 1}`}</p>
                  </div>
                  <p className="mt-1 pl-10 text-xs text-[#75827d]">Room details and guest-facing photography</p>
                </div>
                <Button type="button" variant="ghost" size="sm" className="text-[#8a3128] hover:bg-[#fff1ef] hover:text-[#8a3128]" onClick={() => removeRoom(index)}>
                  <Trash2 className="size-4" /> Remove
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Room name</Label>
                  <Input className="mt-2" value={room.name} onChange={(e) => updateRoom(index, { name: e.target.value })} placeholder="e.g. Deluxe Double" required />
                </div>
                <div>
                  <Label>Room type</Label>
                  <Input className="mt-2" value={room.roomType} onChange={(e) => updateRoom(index, { roomType: e.target.value })} placeholder="e.g. Double" />
                </div>
                <div>
                  <Label>Max guests</Label>
                  <Input type="number" min={1} className="mt-2" value={room.maxGuests} onChange={(e) => updateRoom(index, { maxGuests: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Nightly price (₹)</Label>
                  <Input type="number" min={0} className="mt-2" value={room.basePrice} onChange={(e) => updateRoom(index, { basePrice: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Beds</Label>
                  <Input className="mt-2" value={room.beds} onChange={(e) => updateRoom(index, { beds: e.target.value })} placeholder="e.g. 1 Queen" />
                </div>
                <div>
                  <Label>Bathroom</Label>
                  <Input className="mt-2" value={room.bathroomType} onChange={(e) => updateRoom(index, { bathroomType: e.target.value })} placeholder="e.g. Private" />
                </div>
                <div className="sm:col-span-2">
                  <Label>Room description</Label>
                  <Textarea className="mt-2 min-h-24" value={room.description} onChange={(e) => updateRoom(index, { description: e.target.value })} placeholder="Describe the room, bedding, view and what guests can expect." />
                </div>
              </div>

              <div className="mt-5">
                <ImagePicker
                  title={`${room.name || `Room ${index + 1}`} photos`}
                  description="Use photos of this exact room: bed, bathroom, seating area, storage and view. The first photo is shown as the room cover when guests choose this room."
                  images={room.images}
                  maxImages={MAX_ROOM_IMAGES}
                  onChange={(images) => updateRoom(index, { images })}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-5">
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#0f5a45]">04 · Amenities</p>
          <h3 className="mt-1 text-2xl font-black tracking-tight text-[#17332e]">Set guest expectations</h3>
        </div>

        <div className="space-y-4">
          {Object.entries(groupedAmenities).map(([category, items]) => (
            <div key={category}>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#75827d]">{category}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {items.map((amenity) => {
                  const selected = selectedAmenities.includes(amenity.id)
                  return (
                    <button
                      key={amenity.id}
                      type="button"
                      onClick={() => toggleAmenity(amenity.id)}
                      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition ${selected ? 'border-[#0f5a45] bg-[#edf3ee] text-[#0f5a45]' : 'border-[#d8d3c8] bg-white text-[#66736e] hover:border-[#0f5a45]/40 hover:bg-[#f6faf7]'}`}
                    >
                      {selected && <Check className="size-3.5" />}
                      {amenity.name}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="sticky bottom-3 z-10 rounded-2xl border border-[#cfd8d3] bg-white/95 p-3 shadow-xl backdrop-blur sm:flex sm:items-center sm:justify-between sm:gap-4 sm:p-4">
        <div className="hidden items-center gap-3 sm:flex">
          <span className="grid size-10 place-items-center rounded-full bg-[#edf3ee] text-[#0f5a45]"><Camera className="size-4" /></span>
          <div>
            <p className="text-sm font-bold text-[#17332e]">Photos make the room selection concrete</p>
            <p className="text-xs text-[#75827d]">{propertyImages.length} property photos · {rooms.reduce((count, room) => count + room.images.length, 0)} room photos</p>
          </div>
        </div>
        <Button type="submit" disabled={saving} size="lg" className="h-12 w-full rounded-xl bg-[#0f5a45] font-semibold text-white shadow-sm hover:bg-[#0b4736] sm:w-auto sm:min-w-52">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {saving ? 'Saving & uploading…' : activePropertyId ? 'Save listing' : 'Create listing'}
        </Button>
      </div>
    </form>
  )
}
