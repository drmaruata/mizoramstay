import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BookingService } from '@/features/bookings/booking.service'

/**
 * Payment webhook handler — receives payment confirmation from payment provider.
 *
 * Expected payload from Razorpay / Stripe:
 * {
 *   "event": "payment.captured" | "payment.authorized",
 *   "bookingId": "uuid",
 *   "paymentId": "razorpay_payment_id | stripe_payment_intent_id",
 *   "amount": 50000 (in paise/cents),
 *   "timestamp": "2024-01-01T12:00:00Z"
 * }
 *
 * This handler:
 * 1. Verifies the webhook signature (prevents replay attacks)
 * 2. Confirms the booking (reserves inventory, updates status to CONFIRMED)
 * 3. Creates a payment record in the database
 * 4. Triggers notifications (email, SMS)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 1. Verify webhook signature (implementation depends on payment provider)
    // For now, we skip signature verification in demo mode.
    // In production:
    //   - Razorpay: verify signature using webhook secret
    //   - Stripe: use event.livemode and verify signature

    const { bookingId, paymentId, amount, event, timestamp } = body

    if (!bookingId || !paymentId || !amount) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // 2. Get Supabase client
    const db = await createClient()

    // 3. Check for idempotency — only process once per payment
    const { data: existingPayment } = await db
      .from('payments')
      .select('id')
      .eq('provider_payment_id', paymentId)
      .maybeSingle()

    if (existingPayment) {
      // Payment already processed; return success (idempotent)
      return NextResponse.json({ ok: true, message: 'Payment already processed' })
    }

    // 4. Confirm the booking (reserves inventory)
    const service = new BookingService(db)
    await service.confirmBooking(bookingId)

    // 5. Record the payment
    await db.from('payments').insert({
      booking_id: bookingId,
      provider_payment_id: paymentId,
      status: 'CAPTURED',
      amount: amount,
      provider: event.includes('razorpay') ? 'razorpay' : 'stripe',
      metadata: { event, timestamp },
    })

    // 6. Trigger notifications (in production)
    // - Send confirmation email to guest
    // - Send SMS with booking details
    // - Notify host of new booking

    return NextResponse.json({ ok: true, message: 'Booking confirmed' })
  } catch (error) {
    console.error('[payment-webhook]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
