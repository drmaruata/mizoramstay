import Link from 'next/link'
import { MessageSquare, Star } from 'lucide-react'
import { requireUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ReviewForm } from './ReviewForm'

export const dynamic='force-dynamic'

export default async function AccountReviewsPage(){
  const user=await requireUser(); const db=await createClient()
  const {data:completed}=await db.from('bookings').select('id,booking_reference,check_in,check_out,properties:property_id(name),reviews(id,rating,comment,status,created_at)').eq('user_id',user.id).eq('status','COMPLETED').order('check_out',{ascending:false})
  const rows=(completed??[]).filter((b)=>{const review=Array.isArray(b.reviews)?b.reviews[0]:b.reviews; return !review})
  const {data:reviews}=await db.from('reviews').select('id,rating,comment,status,created_at,properties:property_id(name),booking_id').eq('user_id',user.id).order('created_at',{ascending:false})
  return <main className="min-h-screen bg-[#f7f3eb]"><section className="mx-auto max-w-5xl px-5 py-10 md:px-8"><div className="flex items-end justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-[.25em] text-primary">Traveller account</p><h1 className="mt-2 text-4xl font-black text-[#17332e]">Reviews</h1><p className="mt-2 text-sm text-muted-foreground">Review completed stays and manage your published guest feedback.</p></div><Link href="/account"><Button variant="outline" className="rounded-xl bg-white">Back to account</Button></Link></div><div className="mt-8 space-y-5">{rows.map(b=><Card key={b.id} className="border-[#ddd8cc]"><CardHeader><CardTitle>{(Array.isArray(b.properties)?b.properties[0]:b.properties)?.name??'Stay'}</CardTitle><p className="text-sm text-muted-foreground">{b.booking_reference} · {b.check_in} → {b.check_out}</p></CardHeader><CardContent><ReviewForm bookingId={b.id}/></CardContent></Card>)}{reviews?.map(r=><Card key={r.id} className="border-[#ddd8cc]"><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-[#17332e]">{(Array.isArray(r.properties)?r.properties[0]:r.properties)?.name??'Stay'}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</p></div><Badge><Star className="mr-1 size-3 fill-current"/>{r.rating}</Badge></div><p className="mt-3 text-sm leading-6 text-[#52645c]">{r.comment||'Rating submitted without comment.'}</p></CardContent></Card>)}{!rows.length&&!reviews?.length&&<Card className="border-[#ddd8cc]"><CardContent className="p-10 text-center"><MessageSquare className="mx-auto size-10 text-[#74867e]"/><p className="mt-3 font-bold">No review activity yet</p><p className="mt-1 text-sm text-muted-foreground">After a completed stay, you can leave a verified review here.</p></CardContent></Card>}</div></section></main>
}
