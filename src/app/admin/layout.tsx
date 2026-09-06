import Link from 'next/link'
import { Bell, ArrowLeft, Leaf, ShieldCheck } from 'lucide-react'
import { requireAdmin } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { AdminNav } from '@/components/admin/admin-nav'
import { ExitAdminButton } from '@/components/admin/exit-admin-button'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin()
  const supabase = await createClient()
  const { data: profile } = await supabase.from('profiles').select('first_name, last_name, role').eq('id', user.id).single()
  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || user.email || 'Admin'
  const initials = displayName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  const role = profile?.role ?? user.role
  const isElevated = role === 'SUPER_ADMIN'

  return (
    <div className="min-h-screen bg-[#f4f6f3] text-[#172d26]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[272px] shrink-0 border-r border-[#dbe3de] bg-[#edf3ef] lg:flex lg:flex-col">
          <div className="px-5 pb-3 pt-6">
            <Link href="/admin" className="flex items-center gap-3 rounded-2xl px-2 py-2">
              <span className="grid size-11 place-items-center rounded-2xl bg-[#183a31] text-white shadow-[0_8px_24px_rgba(24,58,49,.16)]"><ShieldCheck className="size-5" /></span>
              <span><span className="block text-[18px] font-black tracking-tight">mizoram<span className="text-[#d89b36]">stay</span></span><span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[.18em] text-[#77857f]">Operations console</span></span>
            </Link>
          </div>

          <div className="px-5 pt-4">
            <div className="rounded-[26px] bg-[#183a31] p-4 text-white shadow-[0_16px_38px_rgba(24,58,49,.14)]">
              <p className="text-[9px] font-bold uppercase tracking-[.2em] text-white/50">Operator workspace</p>
              <div className="mt-3 flex items-center gap-3">
                <Avatar className="size-10 ring-1 ring-white/20"><AvatarFallback className="bg-white/10 text-sm font-bold text-white">{initials}</AvatarFallback></Avatar>
                <div className="min-w-0"><p className="truncate text-sm font-bold">{displayName}</p><p className="mt-0.5 text-[10px] uppercase tracking-[.12em] text-white/55">{isElevated ? 'Super admin' : 'Platform admin'}</p></div>
              </div>
            </div>
          </div>

          <div className="px-5 pt-6"><p className="px-3 pb-2 text-[9px] font-bold uppercase tracking-[.18em] text-[#8a9892]">Platform</p><AdminNav /></div>

          <div className="mt-auto space-y-3 p-5">
            <div className="rounded-[24px] border border-[#dbe3de] bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-emerald-500" /><span className="text-xs font-bold">All core services online</span></div>
              <p className="mt-1 text-[10px] leading-5 text-[#7a8983]">Authentication, inventory and booking operations are available.</p>
            </div>
            <div className="grid gap-1">
              <Link href="/" className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-semibold text-[#65766f] transition hover:bg-white hover:text-[#183a31]"><ArrowLeft className="size-3.5" /> Public marketplace</Link>
              <ExitAdminButton />
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-[#dde4df] bg-[#f8faf8]/95 backdrop-blur">
            <div className="flex h-[68px] items-center justify-between px-4 md:px-6 lg:px-8">
              <div className="flex items-center gap-3 lg:hidden">
                <Link href="/admin" className="grid size-9 place-items-center rounded-xl bg-[#183a31] text-white"><Leaf className="size-4" /></Link>
                <div><p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#86938e]">MizoramStay</p><p className="text-sm font-bold">Admin operations</p></div>
              </div>
              <div className="hidden lg:block"><p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#8a9892]">Control room</p><p className="mt-0.5 text-sm font-bold">Admin operations</p></div>
              <div className="flex items-center gap-2 md:gap-3">
                <Button variant="ghost" size="icon-sm" className="rounded-full text-[#536760]" aria-label="Notifications"><Bell className="size-4" /></Button>
                <div className="hidden text-right sm:block"><p className="max-w-[180px] truncate text-sm font-bold">{displayName}</p><Badge variant="secondary" className="mt-0.5 text-[9px] uppercase tracking-wide">{role}</Badge></div>
                <Avatar className="size-9"><AvatarFallback className="bg-[#183a31] text-white font-bold">{initials}</AvatarFallback></Avatar>
                <div className="hidden md:block"><ExitAdminButton compact /></div>
              </div>
            </div>
          </header>

          <main className="min-w-0 px-4 pb-28 pt-5 sm:px-5 md:px-6 md:pt-6 lg:px-8 lg:pb-8 lg:pt-7">{children}</main>
          <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#dbe3de] bg-[#f8faf8]/96 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(24,58,49,.08)] backdrop-blur lg:hidden"><AdminNav mobile /></nav>
        </div>
      </div>
    </div>
  )
}
