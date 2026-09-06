'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Building2, CalendarCheck, CreditCard, MoreHorizontal, Settings, ShieldCheck, Star, Users } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ExitAdminButton } from '@/components/admin/exit-admin-button'

const items = [
  { href: '/admin', label: 'Overview', icon: BarChart3 },
  { href: '/admin/properties', label: 'Properties', icon: Building2 },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/bookings', label: 'Bookings', icon: CalendarCheck },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/verification', label: 'Verification', icon: ShieldCheck, badge: 'Queue' },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
] as const

const primaryMobileItems = items.slice(0, 5)
const secondaryMobileItems = items.slice(5)

type AdminIcon = (typeof items)[number]['icon']

function NavLink({ href, label, Icon, mobile = false }: { href: string; label: string; Icon: AdminIcon; mobile?: boolean }) {
  const pathname = usePathname()
  const active = href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        mobile
          ? 'flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[9px] font-semibold transition active:scale-[.98]'
          : 'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition',
        active
          ? mobile
            ? 'bg-[#183a31] text-white shadow-[0_7px_22px_rgba(24,58,49,.18)]'
            : 'bg-white text-[#183a31] shadow-sm ring-1 ring-black/5'
          : 'text-[#66766f] hover:bg-white/80 hover:text-[#183a31]'
      )}
    >
      <Icon className={cn(mobile ? 'size-[18px]' : 'size-4', active && 'text-[#e7b65d]')} />
      <span>{label}</span>
    </Link>
  )
}

export function AdminNav({ mobile = false }: { mobile?: boolean }) {
  const [moreOpen, setMoreOpen] = useState(false)
  const pathname = usePathname()
  const moreActive = secondaryMobileItems.some(({ href }) => pathname === href || pathname.startsWith(`${href}/`))

  if (mobile) {
    return (
      <div className="relative">
        {moreOpen && (
          <>
            <button type="button" aria-label="Close more menu" className="fixed inset-0 z-[-1] bg-black/10" onClick={() => setMoreOpen(false)} />
            <div className="absolute bottom-[calc(100%+12px)] right-0 w-[min(19rem,calc(100vw-1.5rem))] rounded-[26px] border border-[#dbe3de] bg-[#fbfcfa] p-2 shadow-[0_24px_70px_rgba(24,58,49,.18)]">
              <div className="px-3 pb-2 pt-2"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8a9892]">More operations</p><p className="mt-1 text-xs text-[#6d7d76]">Secondary admin tools and account actions.</p></div>
              <div className="space-y-1">
                {secondaryMobileItems.map(({ href, label, icon: Icon }) => <NavLink key={href} href={href} label={label} Icon={Icon} />)}
                <div className="border-t border-[#e0e6e2] pt-1"><ExitAdminButton /></div>
              </div>
            </div>
          </>
        )}
        <nav className="grid grid-cols-6 gap-1" aria-label="Admin navigation">
          {primaryMobileItems.map(({ href, label, icon: Icon }) => <NavLink key={href} href={href} label={label} Icon={Icon} mobile />)}
          <button
            type="button"
            onClick={() => setMoreOpen((value) => !value)}
            className={cn(
              'flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[9px] font-semibold transition active:scale-[.98]',
              moreOpen || moreActive ? 'bg-[#183a31] text-white shadow-[0_7px_22px_rgba(24,58,49,.18)]' : 'text-[#66766f] hover:bg-[#f0f4f1] hover:text-[#183a31]'
            )}
            aria-expanded={moreOpen}
            aria-haspopup="menu"
          >
            <MoreHorizontal className={cn('size-[18px]', (moreOpen || moreActive) && 'text-[#e7b65d]')} />
            <span>More</span>
          </button>
        </nav>
      </div>
    )
  }

  return (
    <nav className="space-y-1" aria-label="Admin navigation">
      {items.map(({ href, label, icon: Icon, badge }) => {
        const active = href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={cn('group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition', active ? 'bg-white text-[#183a31] shadow-sm ring-1 ring-black/5' : 'text-[#66766f] hover:bg-white/80 hover:text-[#183a31]')}>
            <Icon className={cn('size-4', active && 'text-[#d4942f]')} />
            <span>{label}</span>
            {badge && !active && <span className="ml-auto rounded-full bg-[#e7b65d]/20 px-2 py-0.5 text-[9px] font-bold text-[#a8731f]">{badge}</span>}
          </Link>
        )
      })}
    </nav>
  )
}
