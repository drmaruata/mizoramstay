import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Leaf, Sparkles } from 'lucide-react'
import { PortalNav, HostUtilityNav } from '@/components/host/portal-nav'

export function PortalShell({ children, title = 'Host workspace' }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="min-h-screen w-full bg-[#f5f1e8] text-[#18372f] selection:bg-[#cfe3d8] selection:text-[#154637]">
      <div className="grid min-h-screen w-full lg:grid-cols-[276px_minmax(0,1fr)]">
        <aside className="hidden h-screen w-[276px] shrink-0 overflow-y-auto border-r border-[#d9e1dc] bg-[#eaf2ed] lg:sticky lg:top-0 lg:flex lg:flex-col lg:px-5 lg:py-6">
          <Link href="/" className="flex items-center gap-3 px-3 py-1.5" aria-label="MizoramStay homepage">
            <span className="grid size-11 place-items-center rounded-2xl bg-[#154637] text-white shadow-[0_10px_25px_rgba(21,70,55,.14)]">
              <Leaf className="size-5" />
            </span>
            <span>
              <span className="block text-[18px] font-black tracking-[-.04em]">mizoram<span className="text-[#d4942f]">stay</span></span>
              <span className="block text-[9px] font-bold uppercase tracking-[.22em] text-[#72827b]">Host studio</span>
            </span>
          </Link>

          <div className="mx-2 mt-7 overflow-hidden rounded-[28px] bg-[#154637] p-5 text-white shadow-[0_18px_40px_rgba(21,70,55,.18)]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/55">{title}</p>
              <span className="grid size-8 place-items-center rounded-xl bg-white/10"><Sparkles className="size-4 text-[#e8bd67]" /></span>
            </div>
            <p className="mt-4 text-[15px] font-bold tracking-[-.02em]">Run your stay, simply.</p>
            <div className="mt-4 flex items-center gap-2 text-[11px] text-white/72">
              <CheckCircle2 className="size-3.5 text-[#e4b35b]" /> Everything in one place
            </div>
          </div>

          <div className="mt-7 px-1"><PortalNav /></div>
          <HostUtilityNav />

          <Link href="/" className="mt-auto flex items-center gap-2 px-3 pt-6 text-xs font-semibold text-[#6b7b75] transition hover:text-[#154637]">
            <ArrowLeft className="size-3.5" /> Public marketplace
          </Link>
        </aside>

        <main className="min-w-0 pb-[92px] lg:pb-8">
          <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-[#e0e5df] bg-[#f5f1e8]/92 px-4 backdrop-blur-xl md:px-6 lg:hidden">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-[#154637] text-white shadow-sm"><Leaf className="size-4" /></span>
              <span><span className="block text-sm font-black tracking-tight">MizoramStay</span><span className="block text-[8px] font-bold uppercase tracking-[.18em] text-[#7e8b85]">Host studio</span></span>
            </Link>
            <div className="flex items-center gap-2 rounded-full border border-[#d7e1db] bg-white/75 px-3 py-1.5 text-[11px] font-semibold text-[#526761] shadow-sm">
              <span className="size-1.5 rounded-full bg-[#3b9b68]" /> Live workspace
            </div>
          </header>

          <section className="min-w-0 p-4 md:p-6 lg:px-9 lg:py-8 xl:px-10">{children}</section>
          <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#d9e1dc] bg-[#f8f5ee]/96 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_30px_rgba(21,70,55,.06)] backdrop-blur-xl lg:hidden">
            <PortalNav mobile />
          </nav>
        </main>
      </div>
    </div>
  )
}
