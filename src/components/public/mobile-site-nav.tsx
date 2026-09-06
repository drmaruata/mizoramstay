'use client'

import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function MobileSiteNav() {
  const [open, setOpen] = useState(false)
  return (
    <div className="lg:hidden">
      <Button variant="ghost" size="icon-sm" className="rounded-full" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </Button>
      {open && <div className="absolute inset-x-0 top-full border-b border-black/5 bg-[#faf7f0] px-4 py-4 shadow-lg"><nav className="mx-auto grid max-w-7xl gap-1" aria-label="Mobile navigation">
        <Link href="/stays" onClick={() => setOpen(false)} className="rounded-2xl px-4 py-3 text-sm font-semibold text-[#17332e] hover:bg-white">Find a stay</Link>
        <Link href="/destinations" onClick={() => setOpen(false)} className="rounded-2xl px-4 py-3 text-sm font-semibold text-[#17332e] hover:bg-white">Explore Mizoram</Link>
        <Link href="/account" onClick={() => setOpen(false)} className="rounded-2xl px-4 py-3 text-sm font-semibold text-[#17332e] hover:bg-white">My account</Link>
        <Link href="/host/dashboard" onClick={() => setOpen(false)} className="mt-1 rounded-2xl bg-[#154637] px-4 py-3 text-sm font-bold text-white">List your property</Link>
      </nav></div>}
    </div>
  )
}
