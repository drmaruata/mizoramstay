import { json } from '../_shared/http.ts'
Deno.serve(async (req) => { if(req.method!=='POST') return json({error:'Method not allowed'},405); return json({ok:true,queued:false,message:'Notification provider not configured.'}) })
