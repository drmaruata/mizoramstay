import { Bell, CheckCheck } from 'lucide-react'
import { requireHost } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { PortalShell } from '@/components/host/portal-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { markAllNotificationsRead } from './actions'

export const dynamic='force-dynamic'

export default async function HostNotificationsPage(){
  const host=await requireHost(); const db=await createClient(); const {data:notifications}=await db.from('notifications').select('id,type,subject,body,status,created_at').eq('user_id',host.id).order('created_at',{ascending:false}).limit(100)
  const unread=(notifications??[]).filter(n=>n.status!=='READ').length
  return <PortalShell><div className="mx-auto w-full max-w-[1240px] space-y-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#81918a]">Inbox</p><h1 className="mt-2 text-3xl font-black tracking-[-.04em] text-[#17332e] sm:text-[40px]">Notifications</h1><p className="mt-2 text-sm text-[#66776f]">Booking, verification, review and payout updates for your host account.</p></div>{unread>0?<form action={markAllNotificationsRead}><button className="inline-flex items-center gap-2 rounded-xl border border-[#d7dfda] bg-white px-4 py-2.5 text-sm font-bold text-[#17332e]"><CheckCheck className="size-4"/> Mark all read</button></form>:<Badge className="w-fit bg-[#edf4ef] text-[#2b7a5c]">All caught up</Badge>}</div><Card className="rounded-[28px] border-[#d6ded9]"><CardHeader className="border-b border-[#edf0ed] px-5 pb-4 pt-5 md:px-6"><CardTitle className="flex items-center gap-2 text-xl text-[#17332e]"><Bell className="size-5 text-[#154637]"/>{notifications?.length??0} messages</CardTitle></CardHeader><CardContent className="p-0">{notifications?.length?(<div className="divide-y divide-[#e8ede9]">{notifications.map(n=><div key={n.id} className={`px-5 py-4 md:px-6 ${n.status!=='READ'?'bg-[#f7faf7]':''}`}><div className="flex gap-3"><span className={`mt-1 size-2 shrink-0 rounded-full ${n.status!=='READ'?'bg-[#d4942f]':'bg-[#cbd7d1]'}`}/><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-bold text-[#17332e]">{n.subject}</p><Badge variant="secondary" className="text-[9px] uppercase">{n.type}</Badge></div><p className="mt-1 text-sm leading-6 text-[#596b64]">{n.body}</p><p className="mt-2 text-[11px] text-[#8a9892]">{new Date(n.created_at).toLocaleString('en-IN')}</p></div></div></div>)}</div>):<div className="p-12 text-center"><Bell className="mx-auto size-10 text-[#71847b]"/><p className="mt-4 font-black text-[#17332e]">No notifications yet</p><p className="mt-1 text-sm text-muted-foreground">Updates will appear here as your properties receive activity.</p></div>}</CardContent></Card></div></PortalShell>
}
