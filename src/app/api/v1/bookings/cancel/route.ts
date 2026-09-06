import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { refundRazorpayPayment } from '@/lib/payments/razorpay'

function calculateRefund(total: number, policy: string | null, checkIn: string): number {
  const daysUntilCheckIn = Math.ceil((new Date(`${checkIn}T00:00:00Z`).getTime() - Date.now()) / 86400000)
  const normalized = (policy ?? 'FLEXIBLE').toUpperCase()

  if (normalized.includes('STRICT')) return 0
  if (normalized.includes('MODERATE')) return daysUntilCheckIn >= 5 ? total : daysUntilCheckIn >= 2 ? total * 0.5 : 0
  return daysUntilCheckIn >= 2 ? total : 0
}

export async function POST(request: Request) {
  try {
    const db = await createClient()
    const { data: { user } } = await db.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: { code: 'UNAUTHENTICATED', message: 'Please sign in.' } }, { status: 401 })
    }

    const body = await request.json().catch(() => null) as { bookingId?: string; reason?: string } | null
    const bookingId = body?.bookingId?.trim()
    if (!bookingId) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'bookingId is required.' } }, { status: 400 })
    }

    const { data: booking, error: bookingError } = await db
      .from('bookings')
      .select('id, status, total_amount, currency, check_in, cancellation_policy, booking_reference, user_id')
      .eq('id', bookingId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (bookingError || !booking) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Booking not found.' } }, { status: 404 })
    }
    if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
      return NextResponse.json({ error: { code: 'INVALID_STATE', message: 'This booking cannot be cancelled.' } }, { status: 409 })
    }

    const admin = createAdminClient()
    let refundAmount = 0

    if (booking.status === 'CONFIRMED') {
      const { data: payment, error: paymentError } = await admin
        .from('payments')
        .select('id, provider, provider_transaction_id, amount, status')
        .eq('booking_id', booking.id)
        .eq('status', 'CAPTURED')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (paymentError) throw paymentError
      refundAmount = Math.min(
        calculateRefund(Number(booking.total_amount), booking.cancellation_policy, booking.check_in),
        Number(payment?.amount ?? 0),
      )

      if (payment && refundAmount > 0) {
        if (payment.provider !== 'RAZORPAY' || !payment.provider_transaction_id) {
          return NextResponse.json({ error: { code: 'REFUND_UNSUPPORTED', message: 'This payment cannot be refunded automatically.' } }, { status: 409 })
        }

        const providerRefund = await refundRazorpayPayment(
          payment.provider_transaction_id,
          Math.round(refundAmount * 100),
          `${booking.booking_reference}-refund`,
        )

        const { error: refundError } = await admin.from('refunds').insert({
          booking_id: booking.id,
          payment_id: payment.id,
          provider: 'RAZORPAY',
          provider_refund_id: providerRefund.id,
          amount: refundAmount,
          currency: booking.currency,
          reason: body?.reason ?? 'Customer cancellation',
          status: 'PROCESSED',
          processed_at: new Date().toISOString(),
        })
        if (refundError) throw refundError

        const paymentStatus = refundAmount >= Number(payment.amount) ? 'REFUNDED' : 'PARTIALLY_REFUNDED'
        const { error: paymentUpdateError } = await admin.from('payments').update({ status: paymentStatus }).eq('id', payment.id)
        if (paymentUpdateError) throw paymentUpdateError
      }
    }

    const { data: cancelled, error: cancelError } = await db.rpc('cancel_booking_transaction', {
      p_booking_id: booking.id,
      p_reason: body?.reason ?? `Cancelled by guest. Refund: ${refundAmount.toFixed(2)} ${booking.currency}.`,
    })
    if (cancelError || !cancelled) {
      throw cancelError ?? new Error('Cancellation failed.')
    }

    await admin.from('notifications').insert({
      user_id: user.id,
      type: 'CANCELLATION',
      channel: 'IN_APP',
      subject: 'Booking cancelled',
      body: `Booking ${booking.booking_reference} was cancelled. Refund amount: ₹${refundAmount.toFixed(2)}.`,
      status: 'SENT',
      sent_at: new Date().toISOString(),
    })

    return NextResponse.json({ ok: true, bookingId: booking.id, status: 'CANCELLED', refundAmount })
  } catch (error) {
    console.error('[booking-cancel]', error)
    return NextResponse.json({ error: { code: 'CANCELLATION_FAILED', message: error instanceof Error ? error.message : 'Unable to cancel booking.' } }, { status: 500 })
  }
}
