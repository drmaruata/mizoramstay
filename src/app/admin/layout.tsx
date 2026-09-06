import Link from 'next/link'
import { Bell, ArrowLeft, LogOut, ShieldCheck } from 'lucide-react'
import { requireAdmin } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { AdminNav } from '@/components/admin/admin-nav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin()
  const supabase = await createClient()
  const { data: profile } = await supabase.from('profiles').select('first_name, last_name, role').eq('id', user.id).single()
  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || user.email || 'Admin'
  const initials = displayName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-[#f4f6f3] text-[#172d26]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[264px] shrink-0 border-r border-[#dbe3de] bg-[#eef3ef] lg:flex lg:flex-col">
          <div className="p-5">
            <Link href="/admin" className="flex items-center gap-3 rounded-2xl px-2 py-2">
              <span className="grid size-10 place-items-center rounded-2xl bg-[#183a31] text-white shadow-sm"><ShieldCheck className="size-5" /></span>
              <span><span className="block text-[17px] font-black tracking-tight">mizoram<span className="text-[#d89b36]">stay</span></span><span className="block text-[9px] font-bold uppercase tracking-[.18em] text-[#77857f]">Operations console</span></span>
            </Link>
          </div>
          <div className="px-5"><AdminNav /></div>
          <div className="mt-auto p-5">
            <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5">
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#7a8983]">System status</p>
              <div className="mt-3 flex items-center gap-2"><span className="size-2 rounded-full bg-emerald-500" /><span className="text-xs font-semibold">All core services online</span></div>
              <Link href="/" className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#5f7069] hover:text-[#183a31]"><ArrowLeft className="size-3.5" /> Public marketplace</Link>
            </div>
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-[#dde4df] bg-white/95 px-4 backdrop-blur md:px-6 lg:px-8">
            <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#85928d]">MizoramStay</p><p className="mt-0.5 text-sm font-bold">Admin operations</p></div>
            <div className="flex items-center gap-2 md:gap-3">
              <Button variant="ghost" size="icon-sm" className="rounded-full" aria-label="Notifications"><Bell className="size-4" /></Button>
              <div className="hidden text-right sm:block"><p className="text-sm font-bold">{displayName}</p><Badge variant="secondary" className="mt-0.5">{profile?.role ?? 'ADMIN'}</Badge></div>
              <Avatar><AvatarFallback className="bg-[#183a31] text-white font-bold">{initials}</AvatarFallback></Avatar>
              <Link href="/signout" className="hidden md:block"><Button variant="outline" size="sm"><LogOut className="size-4" /> Sign out</Button></Link>
            </div>
          </header>
          <main className="min-w-0 px-4 pb-24 pt-6 md:px-6 lg:px-8 lg:pb-8">{children}</main>
          <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#dbe3de] bg-white/95 px-2 py-2 backdrop-blur lg:hidden"><AdminNav mobile /></nav>
        </div>
      </div>
    </div>
  )
}
