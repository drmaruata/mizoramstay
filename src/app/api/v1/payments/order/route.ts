import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createRazorpayOrder } from '@/lib/payments/razorpay'

export async function POST(request: Request) {
  try {
    const db = await createClient()
    const { data: { user } } = await db.auth.getUser()
    if (!user) return NextResponse.json({ error: { code: 'UNAUTHENTICATED', message: 'Please sign in.' } }, { status: 401 })

    const body = await request.json().catch(() => null) as { bookingId?: string } | null
    const bookingId = body?.bookingId?.trim()
    if (!bookingId) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'bookingId is required.' } }, { status: 400 })

    const { data: booking, error: bookingError } = await db
      .from('bookings')
      .select('id, booking_reference, user_id, status, total_amount, currency, hold_expires_at')
      .eq('id', bookingId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (bookingError || !booking) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Booking not found.' } }, { status: 404 })
    if (booking.status !== 'PENDING') return NextResponse.json({ error: { code: 'INVALID_STATE', message: 'This booking is not awaiting payment.' } }, { status: 409 })
    if (booking.hold_expires_at && new Date(booking.hold_expires_at).getTime() <= Date.now()) {
      return NextResponse.json({ error: { code: 'HOLD_EXPIRED', message: 'The booking hold has expired. Please start a new booking.' } }, { status: 409 })
    }

    const amountInSubunits = Math.round(Number(booking.total_amount) * 100)
    if (!Number.isSafeInteger(amountInSubunits) || amountInSubunits <= 0) {
      return NextResponse.json({ error: { code: 'INVALID_AMOUNT', message: 'Booking total is invalid.' } }, { status: 500 })
    }

    const { data: existing } = await db
      .from('payments')
      .select('provider_order_id, amount, currency, status')
      .eq('booking_id', booking.id)
      .eq('provider', 'RAZORPAY')
      .not('provider_order_id', 'is', null)
      .in('status', ['INITIATED', 'AUTHORIZED'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existing?.provider_order_id) {
      return NextResponse.json({ order: { id: existing.provider_order_id, amount: amountInSubunits, currency: booking.currency, keyId: process.env.RAZORPAY_KEY_ID } })
    }

    const order = await createRazorpayOrder({ amountInSubunits, currency: booking.currency, receipt: booking.booking_reference })

    const { error: paymentError } = await db.from('payments').insert({
      booking_id: booking.id,
      provider: 'RAZORPAY',
      provider_order_id: order.id,
      amount: Number(booking.total_amount),
      currency: booking.currency,
      status: 'INITIATED',
      metadata: { receipt: order.receipt },
    })

    if (paymentError) {
      console.error('[payment-order:insert]', paymentError)
      return NextResponse.json({ error: { code: 'PAYMENT_RECORD_FAILED', message: 'Could not initialize payment.' } }, { status: 500 })
    }

    return NextResponse.json({ order: { id: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID } }, { status: 201 })
  } catch (error) {
    console.error('[payment-order]', error)
    return NextResponse.json({ error: { code: 'PAYMENT_PROVIDER_ERROR', message: error instanceof Error ? error.message : 'Could not initialize payment.' } }, { status: 502 })
  }
}
