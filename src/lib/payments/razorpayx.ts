import crypto from 'node:crypto'

const RAZORPAYX_API = 'https://api.razorpay.com/v1'

function credentials() {
  const keyId = process.env.RAZORPAYX_KEY_ID ?? process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAYX_KEY_SECRET ?? process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) throw new Error('RazorpayX server configuration is missing.')
  return { keyId, keySecret }
}

function sourceAccountNumber() {
  const value = process.env.RAZORPAYX_ACCOUNT_NUMBER
  if (!value) throw new Error('RAZORPAYX_ACCOUNT_NUMBER is not configured.')
  return value
}

async function razorpayXFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { keyId, keySecret } = credentials()
  const response = await fetch(`${RAZORPAYX_API}${path}`, {
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
      ? String((parsed as { error?: { description?: string } }).error?.description ?? 'RazorpayX request failed.')
      : 'RazorpayX request failed.'
    throw new Error(message)
  }
  return parsed as T
}

export type RazorpayXValidation = {
  id: string
  status: 'created' | 'completed' | 'failed' | string
  utr?: string | null
  validation_results?: { account_status?: string | null; registered_name?: string | null; name_match_score?: number | null }
  fund_account?: {
    id: string
    active?: boolean
    bank_account?: { bank_name?: string; ifsc?: string; name?: string; account_number?: string }
    contact?: { id: string }
  }
  status_details?: { description?: string; reason?: string }
}

export type RazorpayXPayout = {
  id: string
  fund_account_id: string
  amount: number
  currency: string
  status: string
  mode: string
  utr?: string | null
  reference_id?: string | null
  fees?: number
  tax?: number
  status_details?: { description?: string; reason?: string; source?: string }
  created_at?: number
}

export async function validateHostBankAccount(input: {
  beneficiaryName: string
  email: string
  phone: string
  accountNumber: string
  ifsc: string
  referenceId: string
}) {
  return razorpayXFetch<RazorpayXValidation>('/fund_accounts/validations', {
    method: 'POST',
    body: JSON.stringify({
      source_account_number: sourceAccountNumber(),
      validation_type: 'optimized',
      reference_id: input.referenceId.slice(0, 40),
      fund_account: {
        account_type: 'bank_account',
        bank_account: { name: input.beneficiaryName, ifsc: input.ifsc.toUpperCase(), account_number: input.accountNumber },
        contact: {
          name: input.beneficiaryName,
          email: input.email,
          contact: input.phone.replace(/\D/g, '').slice(-15),
          type: 'vendor',
          reference_id: input.referenceId.slice(0, 40),
        },
      },
    }),
  })
}

export async function fetchRazorpayXValidation(validationId: string) {
  return razorpayXFetch<RazorpayXValidation>(`/fund_accounts/validations/${encodeURIComponent(validationId)}`)
}

export async function fetchRazorpayXPayout(payoutId: string) {
  return razorpayXFetch<RazorpayXPayout>(`/payouts/${encodeURIComponent(payoutId)}`)
}

export async function createRazorpayXPayout(input: {
  fundAccountId: string
  amountInSubunits: number
  referenceId: string
  narration: string
  mode?: 'NEFT' | 'RTGS' | 'IMPS'
  idempotencyKey: string
}) {
  return razorpayXFetch<RazorpayXPayout>('/payouts', {
    method: 'POST',
    headers: { 'X-Payout-Idempotency': input.idempotencyKey },
    body: JSON.stringify({
      account_number: sourceAccountNumber(),
      fund_account_id: input.fundAccountId,
      amount: input.amountInSubunits,
      currency: 'INR',
      mode: input.mode ?? 'IMPS',
      purpose: 'payout',
      queue_if_low_balance: true,
      reference_id: input.referenceId.slice(0, 40),
      narration: input.narration.slice(0, 30),
    }),
  })
}

export function verifyRazorpayXWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAYX_WEBHOOK_SECRET ?? process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) throw new Error('RAZORPAYX_WEBHOOK_SECRET is not configured.')
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  if (!/^[a-f0-9]+$/i.test(signature) || expected.length !== signature.length) return false
  return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'))
}
