'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { submitReview } from './actions'

export function ReviewForm({bookingId}:{bookingId:string}){
  const [rating,setRating]=useState(0); const [saving,setSaving]=useState(false); const [message,setMessage]=useState('')
  async function action(formData:FormData){setSaving(true);setMessage('');try{await submitReview(formData);setMessage('Review published.')}catch(e){setMessage(e instanceof Error?e.message:'Unable to publish review.')}finally{setSaving(false)}}
  return <form action={action} className="space-y-4 rounded-2xl border border-[#ddd8cc] bg-white p-5"><input type="hidden" name="bookingId" value={bookingId}/><input type="hidden" name="rating" value={rating}/><div><p className="text-sm font-bold text-[#17332e]">Your rating</p><div className="mt-2 flex gap-1">{[1,2,3,4,5].map(s=><button key={s} type="button" aria-label={`${s} stars`} onClick={()=>setRating(s)} className="rounded-lg p-1"><Star className={`size-6 ${s<=rating?'fill-[#d4942f] text-[#d4942f]':'text-[#c5cec8]'}`}/></button>)}</div></div><Textarea name="comment" rows={4} placeholder="How was your stay?" className="rounded-xl"/><div className="flex items-center justify-between gap-3"><span className="text-xs text-[#2b7a5c]">{message}</span><Button type="submit" disabled={saving||rating===0} className="rounded-xl bg-[#154637] text-white">{saving?'Publishing…':'Publish review'}</Button></div></form>
}
