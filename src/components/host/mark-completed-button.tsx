'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { markBookingCompleted } from '@/features/bookings/host-booking.actions'

/** Mark a CONFIRMED booking as completed (host of the property only). */
export function MarkCompletedButton({ bookingId }: { bookingId: string }) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    setError(null)
    setMessage(null)
    startTransition(async () => {
      const result = await markBookingCompleted(bookingId)
      if (result.ok) setMessage(result.message ?? 'Marked as completed.')
      else setError(result.error)
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" variant="outline" onClick={handleClick} disabled={pending}>
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <CheckCircle2 className="size-4" />
        )}
        Mark completed
      </Button>
      {message && <p className="text-xs text-emerald-600">{message}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}