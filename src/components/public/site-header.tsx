import Link from 'next/link'
import { Map, Menu, UserRound, BadgeCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SiteHeader() {
  return <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
      <Link href="/" className="flex items-center gap-2 font-black tracking-tight text-primary"><span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Map className="size-5" /></span><span className="text-lg">MizoramStay</span></Link>
      <nav className="hidden items-center gap-6 text-sm font-medium lg:flex"><Link href="/stays" className="hover:text-primary">Stays</Link><Link href="/destinations" className="hover:text-primary">Destinations</Link><Link href="/host/dashboard" className="hover:text-primary">List your stay</Link></nav>
      <div className="flex items-center gap-2"><Link href="/account" className="hidden sm:block"><Button variant="ghost" size="sm"><UserRound className="size-4" />Account</Button></Link><Link href="/host/dashboard" className="hidden sm:block"><Button variant="outline" size="sm"><BadgeCheck className="size-4" />Host portal</Button></Link><Button variant="ghost" size="sm" className="lg:hidden" aria-label="Open navigation"><Menu className="size-5" /></Button></div>
    </div>
  </header>
}
