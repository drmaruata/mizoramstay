'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, CalendarDays, ClipboardList, Home, MessageSquare, MoreHorizontal, Wallet } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ExitPortalButton } from '@/components/host/exit-portal-button'

const items = [
  { href: '/host/dashboard', label: 'Overview', icon: BarChart3 },
  { href: '/host/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/host/bookings', label: 'Bookings', icon: ClipboardList },
  { href: '/host/properties', label: 'Properties', icon: Home },
  { href: '/host/revenue', label: 'Revenue', icon: Wallet },
  { href: '/host/reviews', label: 'Reviews', icon: MessageSquare },
] as const

const primaryMobileItems = items.slice(0, 4)
const secondaryMobileItems = items.slice(4)

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
  const active = pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Link
      href={href}
      className={cn(
        mobile
          ? 'flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[10px] font-semibold transition'
          : 'group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition',
        active
          ? 'bg-white text-[#154637] shadow-sm ring-1 ring-black/5'
          : 'text-[#5e726b] hover:bg-white/75 hover:text-[#154637]'
      )}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className={cn(mobile ? 'size-[19px]' : 'size-4', active && 'text-[#d4942f]')} />
      <span>{label}</span>
    </Link>
  )
}

export function PortalNav({ mobile = false }: { mobile?: boolean }) {
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
              className="fixed inset-0 z-0 bg-black/10"
              onClick={() => setMoreOpen(false)}
            />
            <div className="absolute bottom-[calc(100%+10px)] right-1 z-20 w-56 rounded-3xl border border-[#d9e1dc] bg-[#fbf9f4] p-2 shadow-[0_18px_55px_rgba(21,70,55,.16)]">
              <p className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#93a099]">More in your studio</p>
              <div className="space-y-1">
                {secondaryMobileItems.map(({ href, label, icon: Icon }) => (
                  <NavLink key={href} href={href} label={label} Icon={Icon} />
                ))}
                <div className="border-t border-[#e0e5df] pt-1">
                  <ExitPortalButton />
                </div>
              </div>
            </div>
          </>
        )}

        <nav className="relative z-10 grid grid-cols-5 gap-1" aria-label="Host navigation">
          {primaryMobileItems.map(({ href, label, icon: Icon }) => (
            <NavLink key={href} href={href} label={label} Icon={Icon} mobile />
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen((value) => !value)}
            className={cn(
              'flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[10px] font-semibold transition',
              moreOpen || moreActive
                ? 'bg-white text-[#154637] shadow-sm ring-1 ring-black/5'
                : 'text-[#5e726b] hover:bg-white/75 hover:text-[#154637]'
            )}
            aria-expanded={moreOpen}
            aria-haspopup="menu"
          >
            <MoreHorizontal className={cn('size-[19px]', (moreOpen || moreActive) && 'text-[#d4942f]')} />
            <span>More</span>
          </button>
        </nav>
      </div>
    )
  }

  return (
    <nav className="space-y-1" aria-label="Host navigation">
      {items.map(({ href, label, icon: Icon }) => (
        <NavLink key={href} href={href} label={label} Icon={Icon} />
      ))}
    </nav>
  )
}

export function HostUtilityNav() {
  return (
    <div className="mt-6 border-t border-[#d9e1dc] pt-5">
      <div>
        <ExitPortalButton />
      </div>
    </div>
  )
}
