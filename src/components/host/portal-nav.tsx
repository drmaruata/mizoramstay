'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, CalendarDays, ClipboardList, Home, MessageSquare, Settings, Wallet, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { href: '/host/dashboard', label: 'Overview', icon: BarChart3 },
  { href: '/host/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/host/bookings', label: 'Bookings', icon: ClipboardList },
  { href: '/host/properties', label: 'Properties', icon: Home },
  { href: '/host/revenue', label: 'Revenue', icon: Wallet },
  { href: '/host/reviews', label: 'Reviews', icon: MessageSquare },
] as const

export function PortalNav({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname()
  return (
    <nav className={cn(mobile ? 'grid grid-cols-4 gap-1' : 'space-y-1')} aria-label="Host navigation">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link key={href} href={href} className={cn(
            mobile
              ? 'flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-[10px] font-semibold'
              : 'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition',
            active ? 'bg-white text-[#154637] shadow-sm ring-1 ring-black/5' : 'text-[#5e726b] hover:bg-white/70 hover:text-[#154637]'
          )} aria-current={active ? 'page' : undefined}>
            <Icon className={cn(mobile ? 'size-5' : 'size-4', active && 'text-[#d4942f]')} />
            <span>{label}</span>
          </Link>
        )
      })}
      {mobile && (
        <Link href="/" className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-[10px] font-semibold text-[#5e726b]">
          <LogOut className="size-5" />
          <span>Exit</span>
        </Link>
      )}
    </nav>
  )
}

export function HostUtilityNav() {
  return (
    <div className="mt-6 border-t border-[#d9e1dc] pt-5">
      <Link href="#" className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-[#6b7b75] hover:bg-white/70">
        <Settings className="size-4" /> Settings
      </Link>
      <Link href="/" className="mt-1 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-[#6b7b75] hover:bg-white/70">
        <LogOut className="size-4" /> Exit portal
      </Link>
    </div>
  )
}
