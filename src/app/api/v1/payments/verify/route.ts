import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchRazorpayPayment, refundRazorpayPayment, verifyRazorpayPaymentSignature } from '@/lib/payments/razorpay'

export async function POST(request: Request) {
  try {
    const db = await createClient()
    const { data: { user } } = await db.auth.getUser()
    if (!user) return NextResponse.json({ error: { code: 'UNAUTHENTICATED', message: 'Please sign in.' } }, { status: 401 })

    const body = await request.json().catch(() => null) as {
      bookingId?: string
      razorpayPaymentId?: string
      razorpayOrderId?: string
      razorpaySignature?: string
    } | null

    const bookingId = body?.bookingId?.trim()
    const paymentId = body?.razorpayPaymentId?.trim()
    const returnedOrderId = body?.razorpayOrderId?.trim()
    const signature = body?.razorpaySignature?.trim()
    if (!bookingId || !paymentId || !returnedOrderId || !signature) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Payment verification fields are required.' } }, { status: 400 })
    }

    const { data: booking, error: bookingError } = await db
      .from('bookings')
      .select('id, booking_reference, user_id, status, total_amount, currency, hold_expires_at')
      .eq('id', bookingId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (bookingError || !booking) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Booking not found.' } }, { status: 404 })

    const { data: storedPayment, error: paymentLookupError } = await db
      .from('payments')
      .select('id, provider_order_id, amount, currency, status')
      .eq('booking_id', booking.id)
      .eq('provider', 'RAZORPAY')
      .eq('provider_order_id', returnedOrderId)
      .maybeSingle()

    if (paymentLookupError || !storedPayment?.provider_order_id) {
      return NextResponse.json({ error: { code: 'PAYMENT_ORDER_NOT_FOUND', message: 'Payment order is not associated with this booking.' } }, { status: 409 })
    }

    const signatureValid = verifyRazorpayPaymentSignature({ orderId: storedPayment.provider_order_id, paymentId, signature })
    if (!signatureValid) return NextResponse.json({ error: { code: 'INVALID_SIGNATURE', message: 'Payment signature verification failed.' } }, { status: 400 })
    if (returnedOrderId !== storedPayment.provider_order_id) return NextResponse.json({ error: { code: 'ORDER_MISMATCH', message: 'Payment order mismatch.' } }, { status: 400 })

    const providerPayment = await fetchRazorpayPayment(paymentId)
    const expectedAmount = Math.round(Number(booking.total_amount) * 100)
    if (providerPayment.order_id !== storedPayment.provider_order_id || providerPayment.amount !== expectedAmount || providerPayment.currency !== booking.currency) {
      return NextResponse.json({ error: { code: 'PAYMENT_MISMATCH', message: 'Payment details do not match the booking.' } }, { status: 400 })
    }
    if (providerPayment.status !== 'captured') {
      return NextResponse.json({ error: { code: 'PAYMENT_NOT_CAPTURED', message: `Payment is ${providerPayment.status}.` } }, { status: 409 })
    }

    const admin = createAdminClient()
    const { data: confirmation, error: confirmationError } = await admin.rpc('confirm_booking_payment_transaction', {
      p_booking_id: booking.id,
      p_provider: 'RAZORPAY',
      p_provider_order_id: storedPayment.provider_order_id,
      p_provider_transaction_id: providerPayment.id,
      p_amount: Number(booking.total_amount),
      p_payment_method: providerPayment.method ?? null,
      p_metadata: { verified_via: 'checkout', razorpay_payment_status: providerPayment.status },
    })

    if (confirmationError) {
      console.error('[payment-verify:confirm]', confirmationError)
      return NextResponse.json({ error: { code: 'BOOKING_CONFIRMATION_FAILED', message: 'Payment was captured but booking confirmation failed. Support intervention may be required.' } }, { status: 500 })
    }

    const result = confirmation?.[0]
    if (!result) return NextResponse.json({ error: { code: 'BOOKING_CONFIRMATION_FAILED', message: 'No confirmation result was returned.' } }, { status: 500 })

    if (result.refund_required) {
      const refund = await refundRazorpayPayment(providerPayment.id, expectedAmount, `${booking.booking_reference}-expired`)
      await admin.from('refunds').insert({
        booking_id: booking.id,
        payment_id: result.payment_id,
        provider: 'RAZORPAY',
        provider_refund_id: refund.id,
        amount: Number(booking.total_amount),
        currency: booking.currency,
        reason: 'Payment arrived after booking hold expiry',
        status: 'PROCESSED',
        processed_at: new Date().toISOString(),
      })
      await admin.from('payments').update({ status: 'REFUNDED' }).eq('id', result.payment_id)
      return NextResponse.json({ confirmed: false, refunded: true, bookingStatus: 'CANCELLED' })
    }

    return NextResponse.json({ confirmed: true, bookingStatus: result.booking_status, paymentId: result.payment_id })
  } catch (error) {
    console.error('[payment-verify]', error)
    return NextResponse.json({ error: { code: 'PAYMENT_VERIFICATION_ERROR', message: error instanceof Error ? error.message : 'Payment verification failed.' } }, { status: 502 })
  }
}
