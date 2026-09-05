import { json } from '../_shared/http.ts'
Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  // Production: validate Supabase JWT, call transactional booking RPC, create payment order, return only a provider checkout payload.
  return json({ error: 'NOT_CONFIGURED', message: 'Configure the transactional booking RPC and payment gateway before enabling.' }, 503)
})
