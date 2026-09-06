'use client'

import { LogOut, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/browser'
import { cn } from '@/lib/utils'

export function ExitPortalButton({ mobile = false }: { mobile?: boolean }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleSignOut() {
    if (pending) return
    setPending(true)

    const supabase = createClient()
    await supabase.auth.signOut()

    router.replace('/')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={pending}
      className={cn(
        mobile
          ? 'flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-[10px] font-semibold text-[#5e726b] transition hover:bg-white/80 hover:text-[#154637] disabled:cursor-wait disabled:opacity-60'
          : 'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-[#6b7b75] transition hover:bg-white/70 hover:text-[#154637] disabled:cursor-wait disabled:opacity-60',
      )}
      aria-label="Sign out of host portal"
    >
      {pending ? <Loader2 className={mobile ? 'size-5 animate-spin' : 'size-4 animate-spin'} /> : <LogOut className={mobile ? 'size-5' : 'size-4'} />}
      <span>{pending ? 'Exiting…' : mobile ? 'Exit' : 'Exit portal'}</span>
    </button>
  )
}
