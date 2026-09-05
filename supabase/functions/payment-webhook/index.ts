import { json } from '../_shared/http.ts'
Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  // Production: verify provider signature; persist idempotent payment_events; update payment/booking via privileged server-side workflow.
  return json({ error: 'NOT_CONFIGURED', message: 'Payment webhook verification is not enabled in this build.' }, 503)
})
