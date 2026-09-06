import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Leaf } from 'lucide-react'
import { PortalNav, HostUtilityNav } from '@/components/host/portal-nav'

export function PortalShell({ children, title = 'Host workspace' }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f5f1e8] text-[#18372f]">
      <div className="mx-auto grid max-w-[1480px] lg:grid-cols-[250px_1fr]">
        <aside className="hidden min-h-[calc(100vh-4rem)] border-r border-[#d9e1dc] bg-[#edf3ee] lg:flex lg:flex-col lg:p-5">
          <Link href="/" className="flex items-center gap-3 px-3 py-2">
            <span className="grid size-10 place-items-center rounded-2xl bg-[#154637] text-white shadow-sm"><Leaf className="size-5" /></span>
            <span><span className="block text-[17px] font-black tracking-tight">mizoram<span className="text-[#d4942f]">stay</span></span><span className="block text-[9px] font-bold uppercase tracking-[.18em] text-[#72827b]">Host studio</span></span>
          </Link>
          <div className="mx-3 mt-7 rounded-3xl bg-[#154637] p-4 text-white shadow-[0_12px_30px_rgba(21,70,55,.15)]">
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/60">{title}</p>
            <p className="mt-2 text-sm font-semibold">Run your stay, simply.</p>
            <div className="mt-3 flex items-center gap-2 text-[11px] text-white/75"><CheckCircle2 className="size-3.5 text-[#e4b35b]" /> Everything in one place</div>
          </div>
          <div className="mt-7 px-1"><PortalNav /></div>
          <HostUtilityNav />
          <Link href="/" className="mt-auto flex items-center gap-2 px-3 pt-5 text-xs font-semibold text-[#6b7b75] hover:text-[#154637]"><ArrowLeft className="size-3.5" /> Public marketplace</Link>
        </aside>
        <main className="min-w-0 pb-24 lg:pb-8">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#e0e5df] bg-[#f5f1e8]/95 px-4 py-3 backdrop-blur md:px-6 lg:hidden">
            <Link href="/" className="flex items-center gap-2"><span className="grid size-9 place-items-center rounded-xl bg-[#154637] text-white"><Leaf className="size-4" /></span><span className="text-sm font-black">MizoramStay</span></Link>
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#61736c] ring-1 ring-black/5">Host studio</span>
          </header>
          <section className="min-w-0 p-4 md:p-6 lg:p-8">{children}</section>
          <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#d9e1dc] bg-[#f8f5ee]/95 px-2 py-2 backdrop-blur lg:hidden"><PortalNav mobile /></nav>
        </main>
      </div>
    </div>
  )
}
