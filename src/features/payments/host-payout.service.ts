import type { SupabaseClient } from '@supabase/supabase-js'

export interface HostPayoutRow {
  id: string
  bookingId: string
  bookingReference: string
  propertyName: string
  checkIn: string
  checkOut: string
  grossAmount: number
  platformCommission: number
  paymentCost: number
  refundAdjustment: number
  netAmount: number
  status: string
  scheduledAt: string | null
  paidAt: string | null
  createdAt: string
}

export interface HostRevenueSummary {
  currentMonthGross: number
  previousMonthGross: number
  currentMonthCommission: number
  currentMonthNet: number
  pendingPayout: number
  scheduledPayout: number
  paidPayout: number
  payoutRows: HostPayoutRow[]
}

interface PayoutQueryRow {
  id: string
  booking_id: string
  gross_amount: number | null
  platform_commission: number | null
  payment_cost: number | null
  refund_adjustment: number | null
  net_amount: number | null
  status: string
  scheduled_at: string | null
  paid_at: string | null
  created_at: string
  bookings?: {
    booking_reference: string
    check_in: string
    check_out: string
    properties?: { name: string } | null
  } | null
}

export class HostPayoutService {
  constructor(private readonly db: SupabaseClient) {}

  async getHostProfileId(): Promise<string | null> {
    const {
      data: { user },
    } = await this.db.auth.getUser()
    if (!user) return null

    const { data, error } = await this.db
      .from('host_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error || !data) return null
    return data.id
  }

  async getRevenueSummary(hostId: string, now = new Date()): Promise<HostRevenueSummary> {
    const { data, error } = await this.db
      .from('host_payouts')
      .select(
        `id, booking_id, gross_amount, platform_commission, payment_cost,
         refund_adjustment, net_amount, status, scheduled_at, paid_at, created_at,
         bookings:booking_id(booking_reference, check_in, check_out, properties:property_id(name))`
      )
      .eq('host_id', hostId)
      .order('created_at', { ascending: false })
      .limit(250)

    if (error) {
      console.error('[HostPayoutService] getRevenueSummary error:', error.message)
      return {
        currentMonthGross: 0,
        previousMonthGross: 0,
        currentMonthCommission: 0,
        currentMonthNet: 0,
        pendingPayout: 0,
        scheduledPayout: 0,
        paidPayout: 0,
        payoutRows: [],
      }
    }

    const rows = (data ?? []) as unknown as PayoutQueryRow[]
    const currentStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const currentStartIso = currentStart.toISOString()
    const previousStartIso = previousStart.toISOString()

    let currentMonthGross = 0
    let previousMonthGross = 0
    let currentMonthCommission = 0
    let currentMonthNet = 0
    let pendingPayout = 0
    let scheduledPayout = 0
    let paidPayout = 0

    for (const row of rows) {
      const createdAt = row.created_at
      const gross = Number(row.gross_amount ?? 0)
      const commission = Number(row.platform_commission ?? 0)
      const net = Number(row.net_amount ?? 0)

      if (createdAt >= currentStartIso) {
        currentMonthGross += gross
        currentMonthCommission += commission
        currentMonthNet += net
      } else if (createdAt >= previousStartIso) {
        previousMonthGross += gross
      }

      if (row.status === 'PENDING') pendingPayout += net
      if (row.status === 'SCHEDULED') scheduledPayout += net
      if (row.status === 'PAID') paidPayout += net
    }

    return {
      currentMonthGross,
      previousMonthGross,
      currentMonthCommission,
      currentMonthNet,
      pendingPayout,
      scheduledPayout,
      paidPayout,
      payoutRows: rows.map((row) => ({
        id: row.id,
        bookingId: row.booking_id,
        bookingReference: row.bookings?.booking_reference ?? 'Booking',
        propertyName: row.bookings?.properties?.name ?? 'Property',
        checkIn: row.bookings?.check_in ?? '',
        checkOut: row.bookings?.check_out ?? '',
        grossAmount: Number(row.gross_amount ?? 0),
        platformCommission: Number(row.platform_commission ?? 0),
        paymentCost: Number(row.payment_cost ?? 0),
        refundAdjustment: Number(row.refund_adjustment ?? 0),
        netAmount: Number(row.net_amount ?? 0),
        status: row.status,
        scheduledAt: row.scheduled_at,
        paidAt: row.paid_at,
        createdAt: row.created_at,
      })),
    }
  }
}
