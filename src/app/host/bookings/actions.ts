'use server'

import { revalidatePath } from 'next/cache'
import { requireHost } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

async function ownedBooking(db: Awaited<ReturnType<typeof createClient>>, userId:string, bookingId:string){
  const {data}=await db.from('bookings').select('id,status,property_id,booking_reference,user_id,check_in,check_out,total_amount,properties!inner(host_profiles!inner(user_id))').eq('id',bookingId).maybeSingle()
  const row=data as any
  if(!row || row.properties?.host_profiles?.user_id!==userId) throw new Error('Booking not found or not owned by this host.')
  return row
}

export async function completeHostBooking(formData: FormData){
  const host=await requireHost(); const db=await createClient(); const booking=await ownedBooking(db,host.id,String(formData.get('bookingId')))
  if(booking.status!=='CONFIRMED') throw new Error('Only confirmed bookings can be completed.')
  const {error}=await db.from('bookings').update({status:'COMPLETED',updated_at:new Date().toISOString()}).eq('id',booking.id).eq('status','CONFIRMED')
  if(error) throw new Error(error.message)
  await db.from('notifications').insert({user_id:booking.user_id,type:'STAY_COMPLETED',channel:'IN_APP',subject:'Your stay is complete',body:`Your stay for ${booking.booking_reference} is complete. You can now leave a verified review.`,status:'SENT',sent_at:new Date().toISOString()})
  revalidatePath('/host/bookings'); revalidatePath('/account'); revalidatePath(`/booking/${booking.id}`)
  return {ok:true}
}
