import { createHmac } from 'node:crypto'
import { describe, expect, it, beforeEach } from 'vitest'
import { verifyRazorpayPaymentSignature, verifyRazorpayWebhookSignature } from '@/lib/payments/razorpay'

describe('Razorpay signature verification', () => {
  beforeEach(() => {
    process.env.RAZORPAY_KEY_SECRET = 'test-key-secret'
    process.env.RAZORPAY_WEBHOOK_SECRET = 'test-webhook-secret'
  })

  it('accepts a valid checkout signature', () => {
    const orderId = 'order_test_123'
    const paymentId = 'pay_test_123'
    const signature = createHmac('sha256', 'test-key-secret').update(`${orderId}|${paymentId}`).digest('hex')
    expect(verifyRazorpayPaymentSignature({ orderId, paymentId, signature })).toBe(true)
  })

  it('rejects a tampered checkout signature', () => {
    expect(verifyRazorpayPaymentSignature({ orderId: 'order_test_123', paymentId: 'pay_test_123', signature: '00' })).toBe(false)
  })

  it('accepts a valid webhook signature', () => {
    const body = JSON.stringify({ event: 'payment.captured', payload: {} })
    const signature = createHmac('sha256', 'test-webhook-secret').update(body).digest('hex')
    expect(verifyRazorpayWebhookSignature(body, signature)).toBe(true)
  })

  it('rejects a tampered webhook body', () => {
    const signature = createHmac('sha256', 'test-webhook-secret').update('original').digest('hex')
    expect(verifyRazorpayWebhookSignature('tampered', signature)).toBe(false)
  })
})
