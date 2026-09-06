'use client'

import { useMemo, useState, useTransition } from 'react'
import { AlertTriangle, ArrowRight, CalendarClock, Check, CheckCircle2, FileCheck2, FileText, Home, MapPin, MessageSquare, ShieldCheck, UserRound, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { requestPropertyChanges, approveProperty, rejectProperty } from './actions'

export type VerificationProperty = {
  id: string
  name: string
  slug: string
  status: string
  verificationLevel: number
  createdAt: string
  hostName: string
  hostUserId?: string | null
  district: string
  town: string
  address: string
  tourismRegistrationNumber: string
  tourismRegistrationStatus: string
  latitude: number | null
  longitude: number | null
  documents: Array<{ id: string; documentType: string; documentNumber: string | null; verificationStatus: string; fileUrl: string }>
  media: Array<{ id: string; url: string; altText: string; roomId: string | null; roomName: string | null }>
  rooms: Array<{ id: string; name: string; maxGuests: number; basePrice: number; description: string | null; images: Array<{ id: string; url: string; altText: string }> }>
  openCases: Array<{ id: string; verificationType: string; riskLevel: string; status: string; submittedAt: string; assignedTo: string | null; notes: string | null }>
  events: Array<{ id: string; action: string; oldStatus: string | null; newStatus: string | null; notes: string | null; createdAt: string; actorName: string | null }>
}

const checklist = [
  { key: 'identity', label: 'Identity verified' },
  { key: 'ownership', label: 'Ownership document' },
  { key: 'tourism', label: 'Tourism registration' },
  { key: 'photos', label: 'Property photos' },
  { key: 'location', label: 'Address/location' },
] as const

function riskClass(value: string) {
  if (value === 'HIGH') return 'bg-red-50 text-red-700'
  if (value === 'MEDIUM') return 'bg-amber-50 text-amber-700'
  return 'bg-emerald-50 text-emerald-700'
}

export function VerificationConsole({ properties }: { properties: VerificationProperty[] }) {
  const [selectedId, setSelectedId] = useState(properties[0]?.id ?? '')
  const [query, setQuery] = useState('')
  const [selectedChanges, setSelectedChanges] = useState<string[]>([])
  const [reason, setReason] = useState('')
  const [inspectionDate, setInspectionDate] = useState('')
  const [pending, startTransition] = useTransition()
  const selected = properties.find((property) => property.id === selectedId) ?? null

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return properties
    return properties.filter((property) => [property.name, property.hostName, property.district, property.town].join(' ').toLowerCase().includes(term))
  }, [properties, query])

  const derivedChecks = selected ? new Set([
    selected.hostUserId ? 'identity' : '',
    selected.documents.some((document) => document.documentType === 'OWNERSHIP' && document.verificationStatus === 'VERIFIED') ? 'ownership' : '',
    selected.tourismRegistrationStatus === 'VERIFIED' ? 'tourism' : '',
    selected.media.length > 0 ? 'photos' : '',
    selected.latitude != null && selected.longitude != null && Boolean(selected.address || selected.town || selected.district) ? 'location' : '',
  ]) : new Set<string>()

  function run(action: () => Promise<void>) {
    startTransition(() => {
      void action()
    })
  }

  if (!selected) {
    return <div className="rounded-[28px] border border-dashed border-[#d8e2dc] bg-white p-12 text-center"><ShieldCheck className="mx-auto size-10 text-[#2b7a5c]" /><h2 className="mt-3 text-xl font-black">Verification queue is clear</h2><p className="mt-1 text-sm text-muted-foreground">There are no submitted properties waiting for operator review.</p></div>
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
      <section className="rounded-[28px] border border-[#d9e2dd] bg-white shadow-sm">
        <div className="border-b border-[#edf1ee] p-4"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#7e8e87]">Verification queue</p><h2 className="mt-1 text-xl font-black">Submitted properties</h2><div className="relative mt-4"><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search host, property, district" className="pl-3" /></div></div>
        <div className="max-h-[65vh] overflow-y-auto p-2">
          {filtered.map((property) => {
            const active = property.id === selected.id
            return <button key={property.id} type="button" onClick={() => setSelectedId(property.id)} className={`w-full rounded-2xl p-3 text-left transition ${active ? 'bg-[#183a31] text-white shadow-sm' : 'hover:bg-[#f5f8f5]'}`}><div className="flex items-start gap-3"><span className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl ${active ? 'bg-white/10' : 'bg-[#eaf1ec] text-[#2b7a5c]'}`}><Home className="size-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{property.name}</span><span className={`mt-1 block truncate text-xs ${active ? 'text-white/65' : 'text-muted-foreground'}`}>{property.hostName} · {property.district || property.town || 'Location pending'}</span></span>{property.openCases[0] && <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${active ? 'bg-white/10 text-white' : riskClass(property.openCases[0].riskLevel)}`}>{property.openCases[0].riskLevel}</span>}</div></button>
          })}
          {!filtered.length && <p className="p-5 text-sm text-muted-foreground">No properties match the search.</p>}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-4 rounded-[28px] border border-[#d9e2dd] bg-white p-5 shadow-sm md:flex-row md:items-start md:justify-between md:p-6"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#7e8e87]">Property verification</p><h1 className="mt-2 text-3xl font-black tracking-tight text-[#183a31]">{selected.name}</h1><p className="mt-1 text-sm text-muted-foreground">Submitted {new Date(selected.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {selected.hostName}</p></div><div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">Level {selected.verificationLevel}</Badge>{selected.openCases[0] && <Badge className={riskClass(selected.openCases[0].riskLevel)}>{selected.openCases[0].riskLevel} risk</Badge>}</div></div>

        <div className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-[28px] border border-[#d9e2dd] bg-white shadow-sm"><div className="border-b border-[#edf1ee] px-5 py-4"><h2 className="font-black">Applicant & property</h2></div><div className="space-y-3 p-5"><div className="rounded-2xl bg-[#f6f9f6] p-4"><div className="flex gap-3"><UserRound className="mt-0.5 size-5 text-[#2b7a5c]" /><div><p className="text-sm font-bold">Host identity</p><p className="mt-1 text-xs text-muted-foreground">{selected.hostName} · {selected.hostUserId ? 'Authenticated host account' : 'Identity data incomplete'}</p></div></div></div><div className="rounded-2xl bg-[#f6f9f6] p-4"><div className="flex gap-3"><MapPin className="mt-0.5 size-5 text-[#2b7a5c]" /><div><p className="text-sm font-bold">Location</p><p className="mt-1 text-xs text-muted-foreground">{[selected.address, selected.town, selected.district].filter(Boolean).join(' · ') || 'No address supplied'}{selected.latitude != null && selected.longitude != null ? ` · ${selected.latitude.toFixed(5)}, ${selected.longitude.toFixed(5)}` : ''}</p></div></div></div><div className="rounded-2xl bg-[#f6f9f6] p-4"><div className="flex gap-3"><ShieldCheck className="mt-0.5 size-5 text-[#2b7a5c]" /><div><p className="text-sm font-bold">Tourism registration</p><p className="mt-1 text-xs text-muted-foreground">{selected.tourismRegistrationNumber || 'Number not supplied'} · {selected.tourismRegistrationStatus}</p></div></div></div></div></article>

          <article className="rounded-[28px] border border-[#d9e2dd] bg-white shadow-sm"><div className="border-b border-[#edf1ee] px-5 py-4"><h2 className="font-black">Documents</h2></div><div className="space-y-2 p-5">{selected.documents.length ? selected.documents.map((document) => <div key={document.id} className="flex items-center gap-3 rounded-2xl border border-[#edf1ee] p-3"><span className="grid size-10 place-items-center rounded-xl bg-[#edf4ef] text-[#2b7a5c]"><FileText className="size-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{document.documentType.replace(/_/g, ' ')}</p><p className="mt-0.5 text-xs text-muted-foreground">{document.documentNumber || 'No document number'} · {document.verificationStatus}</p></div>{document.fileUrl && <a href={document.fileUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#1f624b]">Open <ArrowRight className="inline size-3.5" /></a>}</div>) : <p className="text-sm text-muted-foreground">No documents were supplied.</p>}</div></article>
        </div>

        <article className="rounded-[28px] border border-[#d9e2dd] bg-white shadow-sm"><div className="border-b border-[#edf1ee] px-5 py-4"><div className="flex items-center justify-between"><div><h2 className="font-black">Rooms & property photography</h2><p className="mt-1 text-xs text-muted-foreground">Confirm that every bookable room is represented accurately before approval.</p></div><Badge variant="secondary">{selected.rooms.length} rooms · {selected.media.length} photos</Badge></div></div><div className="space-y-4 p-5">{selected.rooms.map((room) => <div key={room.id} className="rounded-2xl border border-[#edf1ee] p-4"><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><p className="font-bold">{room.name}</p><p className="mt-1 text-xs text-muted-foreground">Up to {room.maxGuests} guests · ₹{room.basePrice.toLocaleString('en-IN')} / night</p><p className="mt-2 text-sm text-muted-foreground">{room.description || 'No room description supplied.'}</p></div><span className={room.images.length ? 'text-xs font-bold text-emerald-700' : 'text-xs font-bold text-amber-700'}>{room.images.length ? `${room.images.length} room photo${room.images.length === 1 ? '' : 's'}` : 'No room photos'}</span></div>{room.images.length > 0 && <div className="mt-3 grid grid-cols-3 gap-2 md:grid-cols-5">{room.images.map((image) => <img key={image.id} src={image.url} alt={image.altText || room.name} className="aspect-[4/3] w-full rounded-xl object-cover" />)}</div>}</div>)}{selected.media.filter((image) => !image.roomId).length > 0 && <div><p className="mb-2 text-xs font-bold uppercase tracking-[.14em] text-[#7d8d86]">Property gallery</p><div className="grid grid-cols-3 gap-2 md:grid-cols-5">{selected.media.filter((image) => !image.roomId).map((image) => <img key={image.id} src={image.url} alt={image.altText || selected.name} className="aspect-[4/3] w-full rounded-xl object-cover" />)}</div></div>}</div></article>

        <article className="rounded-[28px] border border-[#d9e2dd] bg-white shadow-sm"><div className="border-b border-[#edf1ee] px-5 py-4"><h2 className="font-black">Verification checklist</h2><p className="mt-1 text-xs text-muted-foreground">Record only evidence the platform has actually checked.</p></div><div className="space-y-2 p-5">{checklist.map(({ key, label }) => { const checked = derivedChecks.has(key); const manual = selectedChanges.includes(key); return <button type="button" key={key} onClick={() => setSelectedChanges((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key])} className="flex w-full items-center gap-3 rounded-2xl border border-[#edf1ee] p-3 text-left"><span className={`grid size-8 place-items-center rounded-full ${checked ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{checked ? <Check className="size-4" /> : <AlertTriangle className="size-4" />}</span><span className="flex-1"><span className="block text-sm font-semibold">{label}</span><span className="block text-xs text-muted-foreground">{manual ? 'Marked for change request' : checked ? 'Evidence supplied' : 'Needs operator review'}</span></span></button> })}</div></article>

        <div className="grid gap-6 lg:grid-cols-3">
          <article className="rounded-[28px] border border-[#d9e2dd] bg-white shadow-sm"><div className="border-b border-[#edf1ee] px-5 py-4"><h2 className="font-black">Request changes</h2></div><div className="space-y-3 p-5"><p className="text-xs text-muted-foreground">Select checklist items above, then explain what the host must correct.</p><Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Describe the required changes…" rows={4} /><Button disabled={pending || selectedChanges.length === 0 || !reason.trim()} variant="outline" className="w-full" onClick={() => run(async () => { await requestPropertyChanges({ propertyId: selected.id, requiredChanges: selectedChanges.map((item) => checklist.find((entry) => entry.key === item)?.label ?? item), reason }) })}><MessageSquare className="size-4" /> Request changes</Button></div></article>
          <article className="rounded-[28px] border border-[#d9e2dd] bg-white shadow-sm"><div className="border-b border-[#edf1ee] px-5 py-4"><h2 className="font-black">Inspection</h2></div><div className="space-y-3 p-5"><p className="text-xs text-muted-foreground">Schedule a field visit when document review is insufficient.</p><Input type="datetime-local" value={inspectionDate} onChange={(e) => setInspectionDate(e.target.value)} /><Button disabled={pending || !inspectionDate} variant="outline" className="w-full" onClick={() => run(async () => { await requestPropertyChanges({ propertyId: selected.id, requiredChanges: [`Inspection scheduled for ${inspectionDate}`], reason: 'Operator requested a property inspection.' }) })}><CalendarClock className="size-4" /> Schedule inspection</Button></div></article>
          <article className="rounded-[28px] border border-[#d9e2dd] bg-[#f4faf6] shadow-sm"><div className="border-b border-[#e3efe7] px-5 py-4"><h2 className="font-black">Decision</h2></div><div className="space-y-3 p-5"><Button disabled={pending || selectedChanges.length > 0 || checklist.some(({ key }) => !derivedChecks.has(key))} className="w-full bg-[#176148] hover:bg-[#176148]/90" onClick={() => run(async () => { await approveProperty({ propertyId: selected.id, verificationLevel: 4, notes: 'Approved after operator verification.' }) })}><CheckCircle2 className="size-4" /> Approve property</Button><Button disabled={pending || !reason.trim()} variant="outline" className="w-full" onClick={() => run(async () => { await rejectProperty({ propertyId: selected.id, reason }) })}><X className="size-4" /> Reject property</Button><div className="rounded-2xl bg-white p-3 text-xs leading-5 text-muted-foreground">Approval requires all required checklist signals to be evidenced. The platform verification level is separate from government tourism registration.</div></div></article>
        </div>

        <article className="rounded-[28px] border border-[#d9e2dd] bg-white shadow-sm"><div className="border-b border-[#edf1ee] px-5 py-4"><h2 className="font-black">Audit trail</h2></div><div className="divide-y divide-[#edf1ee]">{selected.events.length ? selected.events.map((event) => <div key={event.id} className="flex gap-3 p-4"><span className="mt-0.5 grid size-8 place-items-center rounded-full bg-[#eef4ef] text-[#2b7a5c]"><FileCheck2 className="size-4" /></span><div><p className="text-sm font-semibold">{event.action.replace(/_/g, ' ')}</p><p className="mt-1 text-xs text-muted-foreground">{event.actorName || 'System'} · {new Date(event.createdAt).toLocaleString('en-IN')}</p>{event.notes && <p className="mt-2 text-sm text-muted-foreground">{event.notes}</p>}</div></div>) : <p className="p-5 text-sm text-muted-foreground">No audit events have been recorded for this case yet.</p>}</div></article>
      </section>
    </div>
  )
}
