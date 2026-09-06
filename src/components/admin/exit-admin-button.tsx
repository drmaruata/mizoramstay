'use client'

import { LogOut, Loader2 } from 'lucide-react'
import { useTransition } from 'react'
import { signOut } from '@/app/(auth)/signout/actions'
import { cn } from '@/lib/utils'

export function ExitAdminButton({ compact = false }: { compact?: boolean }) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => void signOut())}
      className={cn(
        compact
          ? 'flex w-full items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-semibold text-[#66766f] transition hover:bg-[#f0f4f1] hover:text-[#183a31] disabled:cursor-wait disabled:opacity-60'
          : 'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-[#66766f] transition hover:bg-white/80 hover:text-[#183a31] disabled:cursor-wait disabled:opacity-60'
      )}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
      <span>{pending ? 'Signing out…' : 'Sign out'}</span>
    </button>
  )
}
