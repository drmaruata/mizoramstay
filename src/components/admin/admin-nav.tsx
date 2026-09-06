'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Building2, CalendarCheck, CreditCard, MoreHorizontal, Settings, ShieldCheck, Star, Users } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ExitAdminButton } from '@/components/admin/exit-admin-button'

const items: {
  href: string
  label: string
  icon: typeof BarChart3
  badge?: string
}[] = [
  { href: '/admin', label: 'Overview', icon: BarChart3 },
  { href: '/admin/properties', label: 'Properties', icon: Building2 },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/bookings', label: 'Bookings', icon: CalendarCheck },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/verification', label: 'Verification', icon: ShieldCheck, badge: 'Queue' },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

const primaryMobileItems = items.slice(0, 5)
const secondaryMobileItems = items.slice(5)

function NavLink({
  href,
  label,
  Icon,
  mobile = false,
}: {
  href: string
  label: string
  Icon: typeof BarChart3
  mobile?: boolean
}) {
  const pathname = usePathname()
  const active = href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        mobile
          ? 'flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[9px] font-semibold transition'
          : 'group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition',
        active
          ? mobile
            ? 'bg-[#183a31] text-white shadow-[0_6px_18px_rgba(24,58,49,.16)]'
            : 'bg-white text-[#183a31] shadow-sm ring-1 ring-black/5'
          : 'text-[#66766f] hover:bg-white/80 hover:text-[#183a31]'
      )}
    >
      <Icon className={cn(mobile ? 'size-[19px]' : 'size-4', active && 'text-[#e7b65d]')} />
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
            <button
              type="button"
              aria-label="Close more menu"
              className="fixed inset-0 z-[-1] bg-black/5"
              onClick={() => setMoreOpen(false)}
            />
            <div className="absolute bottom-[calc(100%+10px)] right-1 w-60 rounded-3xl border border-[#dbe3de] bg-[#fbfcfa] p-2 shadow-[0_20px_60px_rgba(24,58,49,.16)]">
              <p className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#8a9892]">More operations</p>
              <div className="space-y-1">
                {secondaryMobileItems.map(({ href, label, icon: Icon }) => (
                  <NavLink key={href} href={href} label={label} Icon={Icon} />
                ))}
                <div className="border-t border-[#e0e6e2] pt-1">
                  <ExitAdminButton />
                </div>
              </div>
            </div>
          </>
        )}

        <nav className="grid grid-cols-5 gap-1" aria-label="Admin navigation">
          {primaryMobileItems.map(({ href, label, icon: Icon }) => (
            <NavLink key={href} href={href} label={label} Icon={Icon} mobile />
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen((value) => !value)}
            className={cn(
              'col-start-5 row-start-2 flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[9px] font-semibold transition sm:col-start-auto sm:row-start-auto',
              moreOpen || moreActive
                ? 'bg-[#183a31] text-white shadow-[0_6px_18px_rgba(24,58,49,.16)]'
                : 'text-[#66766f] hover:bg-[#f0f4f1] hover:text-[#183a31]'
            )}
            aria-expanded={moreOpen}
            aria-haspopup="menu"
          >
            <MoreHorizontal className={cn('size-[19px]', (moreOpen || moreActive) && 'text-[#e7b65d]')} />
            <span>More</span>
          </button>
        </nav>
      </div>
    )
  }

  return (
    <nav className="space-y-1" aria-label="Admin navigation">
      {items.map(({ href, label, icon: Icon, badge }) => {
        const pathname = usePathname()
        const active = href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition',
              active ? 'bg-white text-[#183a31] shadow-sm ring-1 ring-black/5' : 'text-[#66766f] hover:bg-white/80 hover:text-[#183a31]'
            )}
          >
            <Icon className={cn('size-4', active && 'text-[#d4942f]')} />
            <span>{label}</span>
            {badge && !active && <span className="ml-auto rounded-full bg-[#e7b65d]/20 px-2 py-0.5 text-[9px] font-bold text-[#a8731f]">{badge}</span>}
          </Link>
        )
      })}
    </nav>
  )
}
