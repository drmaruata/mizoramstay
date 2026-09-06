import { requireAdmin } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { VerificationConsole, type VerificationProperty } from './VerificationConsole'

export const dynamic = 'force-dynamic'

export default async function AdminVerificationPage() {
  await requireAdmin()
  const db = createAdminClient()

  const { data: properties, error } = await db
    .from('properties')
    .select(`
      id, slug, name, status, verification_level, created_at,
      address, district, town, tourism_registration_number, tourism_registration_status,
      latitude, longitude,
      host_profiles!inner(display_name, user_id),
      property_documents(id, document_type, document_number, verification_status, file_url),
      property_media(id, url, alt_text, room_id),
      rooms(id, name, max_guests, base_price, description)
    `)
    .eq('status', 'PENDING_REVIEW')
    .order('created_at', { ascending: true })

  if (error) {
    return <div className="mx-auto max-w-[1240px] rounded-[28px] border border-red-200 bg-red-50 p-6 text-sm text-red-800">Unable to load verification queue: {error.message}</div>
  }

  const propertyRows = properties ?? []
  const propertyIds = propertyRows.map((row) => row.id)

  const [{ data: cases }, { data: events }] = await Promise.all([
    propertyIds.length
      ? db.from('verification_cases').select('id, property_id, verification_type, risk_level, status, submitted_at, assigned_to, notes').in('property_id', propertyIds).order('submitted_at', { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    propertyIds.length
      ? db.from('verification_events').select('id, case_id, action, old_status, new_status, notes, created_at, actor_id').order('created_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ])

  const actorIds = [...new Set((events ?? []).map((event) => event.actor_id).filter(Boolean))] as string[]
  const { data: actors } = actorIds.length
    ? await db.from('profiles').select('id, first_name, last_name, email').in('id', actorIds)
    : { data: [] as Array<{ id: string; first_name: string | null; last_name: string | null; email: string | null }> }

  const actorNames = new Map((actors ?? []).map((actor) => [actor.id, [actor.first_name, actor.last_name].filter(Boolean).join(' ') || actor.email || 'Admin']))
  const casesByProperty = new Map<string, NonNullable<typeof cases>>()
  for (const item of cases ?? []) {
    const current = casesByProperty.get(item.property_id) ?? []
    current.push(item)
    casesByProperty.set(item.property_id, current)
  }

  const eventsByCase = new Map<string, NonNullable<typeof events>>()
  for (const item of events ?? []) {
    const current = eventsByCase.get(item.case_id) ?? []
    current.push(item)
    eventsByCase.set(item.case_id, current)
  }

  const normalized: VerificationProperty[] = propertyRows.map((property) => {
    const host = Array.isArray(property.host_profiles) ? property.host_profiles[0] : property.host_profiles
    const rawMedia = (property.property_media ?? []) as Array<{ id: string; url: string; alt_text: string | null; room_id: string | null }>
    const rawRooms = (property.rooms ?? []) as Array<{ id: string; name: string; max_guests: number; base_price: number; description: string | null }>
    const documentRows = (property.property_documents ?? []) as Array<{ id: string; document_type: string; document_number: string | null; verification_status: string; file_url: string }>
    const propertyCases = (casesByProperty.get(property.id) ?? []).map((item) => ({
      id: item.id,
      verificationType: item.verification_type,
      riskLevel: item.risk_level,
      status: item.status,
      submittedAt: item.submitted_at,
      assignedTo: item.assigned_to,
      notes: item.notes,
    }))
    const caseIds = new Set(propertyCases.map((item) => item.id))
    const propertyEvents = (events ?? []).filter((item) => caseIds.has(item.case_id)).map((item) => ({
      id: item.id,
      action: item.action,
      oldStatus: item.old_status,
      newStatus: item.new_status,
      notes: item.notes,
      createdAt: item.created_at,
      actorName: item.actor_id ? actorNames.get(item.actor_id) ?? null : null,
    }))
    return {
      id: property.id,
      name: property.name,
      slug: property.slug,
      status: property.status,
      verificationLevel: Number(property.verification_level ?? 0),
      createdAt: property.created_at,
      hostName: host?.display_name ?? 'Unknown host',
      hostUserId: host?.user_id ?? null,
      district: property.district ?? '',
      town: property.town ?? '',
      address: property.address ?? '',
      tourismRegistrationNumber: property.tourism_registration_number ?? '',
      tourismRegistrationStatus: property.tourism_registration_status ?? 'PENDING',
      latitude: property.latitude ?? null,
      longitude: property.longitude ?? null,
      documents: documentRows.map((document) => ({
        id: document.id,
        documentType: document.document_type,
        documentNumber: document.document_number,
        verificationStatus: document.verification_status,
        fileUrl: document.file_url,
      })),
      media: rawMedia.map((media) => {
        const room = rawRooms.find((candidate) => candidate.id === media.room_id)
        return { id: media.id, url: media.url, altText: media.alt_text ?? '', roomId: media.room_id, roomName: room?.name ?? null }
      }),
      rooms: rawRooms.map((room) => ({
        id: room.id,
        name: room.name,
        maxGuests: Number(room.max_guests),
        basePrice: Number(room.base_price ?? 0),
        description: room.description,
        images: rawMedia.filter((media) => media.room_id === room.id).map((media) => ({ id: media.id, url: media.url, altText: media.alt_text ?? '' })),
      })),
      openCases: propertyCases.filter((item) => ['OPEN', 'IN_PROGRESS', 'REQUEST_CHANGES'].includes(item.status)),
      events: propertyEvents,
    }
  })

  return (
    <div className="mx-auto max-w-[1360px] space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#72827b]">Trust & safety</p><h1 className="mt-2 text-3xl font-black tracking-tight text-[#183a31] md:text-4xl">Property verification</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Review submitted properties, inspect evidence, verify every bookable room and record auditable decisions before inventory reaches the marketplace.</p></div>
        <div className="rounded-2xl bg-[#eaf2ec] px-4 py-3 text-sm font-semibold text-[#215d48]">{normalized.length} submission{normalized.length === 1 ? '' : 's'} awaiting review</div>
      </div>
      <VerificationConsole properties={normalized} />
    </div>
  )
}
