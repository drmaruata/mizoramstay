'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { respondToReview } from './actions'

export function ReviewResponseForm({ reviewId }: { reviewId:string }) {
  const [open,setOpen]=useState(false); const [message,setMessage]=useState(''); const [saving,setSaving]=useState(false)
  if(!open) return <Button variant="outline" className="rounded-xl border-[#d7dfda] bg-white text-[#17332e]" onClick={()=>setOpen(true)}><span className="flex items-center gap-2">Respond to guest</span></Button>
  async function submit(formData:FormData){setSaving(true);setMessage('');try{await respondToReview(formData);setMessage('Response saved')}catch(e){setMessage(e instanceof Error?e.message:'Unable to save response')}finally{setSaving(false)}}
  return <form action={submit} className="space-y-3 rounded-2xl border border-[#dfe7e1] bg-[#fbfcfa] p-4"><input type="hidden" name="reviewId" value={reviewId}/><Textarea name="response" minLength={3} rows={4} placeholder="Thank the guest and address their feedback…" className="rounded-xl bg-white" required/><div className="flex items-center justify-between gap-3"><span className="text-xs text-[#2b7a5c]">{message}</span><div className="flex gap-2"><Button type="button" variant="ghost" onClick={()=>setOpen(false)}>Cancel</Button><Button type="submit" disabled={saving} className="rounded-xl bg-[#154637] text-white">{saving?'Saving…':'Save response'}</Button></div></div></form>
}
