import Link from 'next/link'
import { ArrowRight, Compass, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MobileSiteNav } from '@/components/public/mobile-site-nav'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-[#faf7f0]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-5 lg:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="MizoramStay home">
          <span className="grid size-10 place-items-center rounded-2xl bg-[#154637] text-white shadow-sm"><Compass className="size-5" /></span>
          <span><span className="block text-[17px] font-black tracking-tight text-[#17332e]">mizoram<span className="text-[#d4942f]">stay</span></span><span className="block text-[8px] font-bold uppercase tracking-[.24em] text-[#788881]">Hospitality · People · Places</span></span>
        </Link>
        <nav className="hidden items-center gap-8 text-[13px] font-semibold text-[#536760] lg:flex" aria-label="Primary navigation">
          <Link href="/stays" className="transition hover:text-[#154637]">Find a stay</Link>
          <Link href="/destinations" className="transition hover:text-[#154637]">Explore Mizoram</Link>
          <Link href="/host/dashboard" className="transition hover:text-[#154637]">List your property</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/account" className="hidden sm:block"><Button variant="ghost" size="sm" className="text-[#405950]"><UserRound className="size-4" /> Account</Button></Link>
          <Link href="/host/dashboard" className="hidden md:block"><Button size="sm" className="bg-[#154637] hover:bg-[#154637]/90">Host studio <ArrowRight className="size-4" /></Button></Link>
          <MobileSiteNav />
        </div>
      </div>
    </header>
  )
}
