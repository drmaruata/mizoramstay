'use client'

import Script from 'next/script'
import { useState } from 'react'
import { CreditCard, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const RAZORPAY_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

type RazorpayOptions = {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  prefill?: { name?: string; email?: string; contact?: string }
  theme?: { color?: string }
  handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void
  modal?: { ondismiss?: () => void }
}

type RazorpayConstructor = new (options: RazorpayOptions) => { open: () => void }

declare global {
  interface Window { Razorpay?: RazorpayConstructor }
}

export function PaymentCheckout({
  bookingId,
  amount,
  propertyName,
  guestName,
  guestEmail,
  guestPhone,
  onConfirmed,
}: {
  bookingId: string
  amount: number
  propertyName: string
  guestName: string
  guestEmail?: string
  guestPhone?: string
  onConfirmed: () => void
}) {
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleScriptError() {
    setError(
      'The payment provider could not be loaded. This usually means the Razorpay checkout script is blocked or the payment keys are not configured. Please try again later.'
    )
  }

  async function startPayment() {
    setError(null)
    setLoading(true)
    try {
      if (!window.Razorpay) throw new Error('Payment checkout is still loading. Please try again.')
      const orderResponse = await fetch('/api/v1/payments/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      })
      const orderPayload = await orderResponse.json()
      if (!orderResponse.ok) throw new Error(orderPayload.error?.message ?? 'Could not initialize payment.')

      const options: RazorpayOptions = {
        key: orderPayload.order.keyId,
        amount: orderPayload.order.amount,
        currency: orderPayload.order.currency,
        name: 'MizoramStay',
        description: propertyName,
        order_id: orderPayload.order.id,
        prefill: { name: guestName, email: guestEmail, contact: guestPhone },
        handler: async (response) => {
          try {
            const verifyResponse = await fetch('/api/v1/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                bookingId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              }),
            })
            const verifyPayload = await verifyResponse.json()
            if (!verifyResponse.ok) throw new Error(verifyPayload.error?.message ?? 'Payment verification failed.')
            if (verifyPayload.confirmed) onConfirmed()
            else throw new Error('Payment was received but this booking could not be confirmed.')
          } catch (verificationError) {
            setError(verificationError instanceof Error ? verificationError.message : 'Payment verification failed.')
          } finally {
            setLoading(false)
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      }
      const checkout = new window.Razorpay(options)
      checkout.open()
    } catch (paymentError) {
      setError(paymentError instanceof Error ? paymentError.message : 'Could not start payment.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <Script src={RAZORPAY_SRC} strategy="afterInteractive" onLoad={() => setReady(true)} onError={handleScriptError} />
      {error && <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
      <Button className="w-full" disabled={!ready || loading} onClick={startPayment}>
        {loading ? <><Loader2 className="size-4 animate-spin" /> Processing payment…</> : <><CreditCard className="size-4" /> Pay {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)}</>}
      </Button>
      <p className="text-center text-xs text-muted-foreground">Payments are processed securely by Razorpay.</p>
    </div>
  )
}
