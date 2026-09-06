import Link from 'next/link'
import { CalendarRange, Home, IndianRupee } from 'lucide-react'
import { requireHost } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { HostPricingService } from '@/features/pricing/host-pricing.service'
import { PortalShell } from '@/components/host/portal-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PriceEditor } from './PriceEditor'

export const dynamic='force-dynamic'

export default async function HostPricingPage({ searchParams }:{ searchParams: Promise<{ date?:string }> }){
  await requireHost(); const { date }=await searchParams; const db=await createClient(); const service=new HostPricingService(db); const hostId=await service.getHostId();
  const today=new Date(); const selected=/^\d{4}-\d{2}-\d{2}$/.test(date??'')?String(date):today.toISOString().slice(0,10)
  const [rooms,prices]=hostId?await Promise.all([service.listRooms(hostId),service.listMonth(hostId,today.getFullYear(),today.getMonth()+1)]):[[],[]]
  const priceByRoom=new Map(prices.map(p=>[`${p.roomId}:${p.date}`,p]))
  return <PortalShell><div className="mx-auto w-full max-w-[1240px] space-y-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#81918a]">Pricing</p><h1 className="mt-2 text-3xl font-black tracking-[-.04em] text-[#17332e] sm:text-[40px]">Room pricing</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#66776f]">Set base, weekend, seasonal and special-date prices without changing inventory.</p></div><Link href="/host/calendar"><Button variant="outline" className="rounded-xl bg-white text-[#17332e]"><CalendarRange className="size-4"/> Open calendar</Button></Link></div>{rooms.length===0?<Card className="rounded-[28px] border-[#d6ded9]"><CardContent className="p-10 text-center"><Home className="mx-auto size-9 text-[#6f827a]"/><p className="mt-4 font-black text-[#17332e]">Add a room before setting prices</p><Link href="/host/properties" className="mt-4 inline-flex"><Button className="rounded-xl bg-[#154637] text-white">Manage properties</Button></Link></CardContent></Card>:<div className="space-y-4">{rooms.map(room=><Card key={room.id} className="rounded-[28px] border-[#d6ded9] bg-white shadow-[0_8px_26px_rgba(21,70,55,.045)]"><CardHeader className="border-b border-[#edf0ed] px-5 pb-4 pt-5 md:px-6"><div className="flex items-center justify-between gap-3"><div><CardTitle className="flex items-center gap-2 text-xl text-[#17332e]"><IndianRupee className="size-5 text-[#154637]"/>{room.name}</CardTitle><p className="mt-1 text-xs text-muted-foreground">{room.propertyName} · Base price {room.basePrice.toLocaleString('en-IN')}/night</p></div><span className="rounded-full bg-[#edf4ef] px-3 py-1 text-xs font-bold text-[#2b7a5c]">{selected}</span></div></CardHeader><CardContent className="p-5 md:p-6"><PriceEditor roomId={room.id} defaultPrice={priceByRoom.get(`${room.id}:${selected}`)?.basePrice??room.basePrice} date={selected}/></CardContent></Card>)}</div>}<div className="rounded-2xl bg-[#edf4ef] p-4 text-sm leading-6 text-[#456257]"><strong>Pricing rule:</strong> booking totals continue to use the transactional room price baseline; date-specific pricing is stored here for the Host workflow and can be incorporated into booking quote selection as the pricing engine is expanded.</div></div></PortalShell>
}
