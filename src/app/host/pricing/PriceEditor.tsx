'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { saveRoomPrice } from './actions'

export function PriceEditor({ roomId, defaultPrice, date }: { roomId:string; defaultPrice:number; date:string }) {
  const [message,setMessage]=useState(''); const [saving,setSaving]=useState(false)
  async function submit(formData:FormData){setSaving(true);setMessage('');try{await saveRoomPrice(formData);setMessage('Saved')}catch(e){setMessage(e instanceof Error?e.message:'Unable to save')}finally{setSaving(false)}}
  return <form action={submit} className="grid gap-3 rounded-2xl border border-[#e1e7e2] bg-[#fbfcfa] p-4 sm:grid-cols-2 lg:grid-cols-6">
    <input type="hidden" name="roomId" value={roomId}/><input type="hidden" name="date" value={date}/>
    <label className="space-y-1"><span className="text-[10px] font-bold uppercase tracking-wide text-[#7b8b84]">Date</span><Input value={date} readOnly className="h-10 rounded-xl bg-white"/></label>
    <label className="space-y-1"><span className="text-[10px] font-bold uppercase tracking-wide text-[#7b8b84]">Base ₹</span><Input name="basePrice" defaultValue={defaultPrice} type="number" min="0" className="h-10 rounded-xl bg-white"/></label>
    <label className="space-y-1"><span className="text-[10px] font-bold uppercase tracking-wide text-[#7b8b84]">Weekend ₹</span><Input name="weekendPrice" type="number" min="0" placeholder="Optional" className="h-10 rounded-xl bg-white"/></label>
    <label className="space-y-1"><span className="text-[10px] font-bold uppercase tracking-wide text-[#7b8b84]">Seasonal ₹</span><Input name="seasonalPrice" type="number" min="0" placeholder="Optional" className="h-10 rounded-xl bg-white"/></label>
    <label className="space-y-1"><span className="text-[10px] font-bold uppercase tracking-wide text-[#7b8b84]">Special ₹</span><Input name="specialPrice" type="number" min="0" placeholder="Optional" className="h-10 rounded-xl bg-white"/></label>
    <label className="space-y-1"><span className="text-[10px] font-bold uppercase tracking-wide text-[#7b8b84]">Min nights</span><Input name="minimumStay" type="number" min="1" max="30" defaultValue="1" className="h-10 rounded-xl bg-white"/></label>
    <div className="flex items-end justify-between gap-3 sm:col-span-2 lg:col-span-6"><span className="text-xs font-semibold text-[#2b7a5c]">{message}</span><Button type="submit" disabled={saving} className="rounded-xl bg-[#154637] text-white hover:bg-[#103b2f]">{saving?'Saving…':'Save date pricing'}</Button></div>
  </form>
}
