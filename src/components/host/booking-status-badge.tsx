import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-accent/15 text-accent-foreground',
  CONFIRMED: 'bg-primary/10 text-primary',
  COMPLETED: 'bg-muted text-muted-foreground',
  CANCELLED: 'bg-destructive/10 text-destructive',
  NO_SHOW: 'bg-destructive/10 text-destructive',
  REFUND_PENDING: 'bg-accent/15 text-accent-foreground',
  REFUNDED: 'bg-muted text-muted-foreground',
}

export function BookingStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
        STATUS_STYLES[status] ?? 'bg-muted text-muted-foreground'
      )}
    >
      {status.replace(/_/g, ' ')}
    </span>
  )
}