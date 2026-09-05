import { json } from '../_shared/http.ts'
Deno.serve(async (req) => { if(req.method!=='POST') return json({error:'Method not allowed'},405); return json({error:'NOT_CONFIGURED',message:'Cancellation/refund workflow requires the production booking RPC and payment provider.'},503) })
