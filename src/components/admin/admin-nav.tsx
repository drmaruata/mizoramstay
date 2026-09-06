'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Building2, CalendarCheck, CreditCard, Settings, ShieldCheck, Star, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

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

export function AdminNav({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname()
  const visible = mobile ? items.slice(0, 5) : items
  return (
    <nav className={cn(mobile ? 'grid grid-cols-5 gap-1' : 'space-y-1')} aria-label="Admin navigation">
      {visible.map(({ href, label, icon: Icon, badge }) => {
        const active = href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={cn(
            mobile ? 'flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[9px] font-semibold' : 'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition',
            active ? 'bg-[#183a31] text-white shadow-sm' : 'text-[#66766f] hover:bg-[#eef4ef] hover:text-[#183a31]'
          )}>
            <Icon className={cn(mobile ? 'size-5' : 'size-4', active ? 'text-[#e7b65d]' : '')} />
            <span>{label}</span>
            {!mobile && badge && !active && <span className="ml-auto rounded-full bg-[#e7b65d]/20 px-2 py-0.5 text-[9px] font-bold text-[#a8731f]">{badge}</span>}
          </Link>
        )
      })}
    </nav>
  )
}
