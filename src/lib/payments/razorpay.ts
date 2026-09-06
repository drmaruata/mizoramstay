import crypto from 'node:crypto'

const RAZORPAY_API = 'https://api.razorpay.com/v1'

function credentials() {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) throw new Error('Razorpay server configuration is missing.')
  return { keyId, keySecret }
}

async function razorpayFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { keyId, keySecret } = credentials()
  const response = await fetch(`${RAZORPAY_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  })

  const body = await response.text()
  let parsed: unknown = null
  try { parsed = body ? JSON.parse(body) : null } catch { parsed = { raw: body } }
  if (!response.ok) {
    const message = typeof parsed === 'object' && parsed && 'error' in parsed
      ? String((parsed as { error?: { description?: string } }).error?.description ?? 'Razorpay request failed.')
      : 'Razorpay request failed.'
    throw new Error(message)
  }
  return parsed as T
}

export type RazorpayOrder = {
  id: string
  amount: number
  currency: string
  receipt: string
  status: string
}

export type RazorpayPayment = {
  id: string
  order_id: string
  amount: number
  currency: string
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed' | string
  method?: string
}

export async function createRazorpayOrder(input: {
  amountInSubunits: number
  currency: string
  receipt: string
}) {
  return razorpayFetch<RazorpayOrder>('/orders', {
    method: 'POST',
    body: JSON.stringify({ amount: input.amountInSubunits, currency: input.currency, receipt: input.receipt }),
  })
}

export async function fetchRazorpayPayment(paymentId: string) {
  return razorpayFetch<RazorpayPayment>(`/payments/${encodeURIComponent(paymentId)}`)
}

export async function refundRazorpayPayment(paymentId: string, amountInSubunits: number, receipt: string) {
  return razorpayFetch<{ id: string; amount: number; status: string }>(`/payments/${encodeURIComponent(paymentId)}/refund`, {
    method: 'POST',
    body: JSON.stringify({ amount: amountInSubunits, receipt }),
  })
}

export function getRazorpayKeyId() {
  const keyId = process.env.RAZORPAY_KEY_ID
  if (!keyId) throw new Error('RAZORPAY_KEY_ID is not configured.')
  return keyId
}

function timingSafeHexCompare(a: string, b: string) {
  if (!/^[a-f0-9]+$/i.test(a) || !/^[a-f0-9]+$/i.test(b) || a.length !== b.length) return false
  return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'))
}

export function verifyRazorpayPaymentSignature(input: { orderId: string; paymentId: string; signature: string }) {
  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!secret) throw new Error('RAZORPAY_KEY_SECRET is not configured.')
  const expected = crypto.createHmac('sha256', secret).update(`${input.orderId}|${input.paymentId}`).digest('hex')
  return timingSafeHexCompare(expected, input.signature)
}

export function verifyRazorpayWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) throw new Error('RAZORPAY_WEBHOOK_SECRET is not configured.')
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  return timingSafeHexCompare(expected, signature)
}
