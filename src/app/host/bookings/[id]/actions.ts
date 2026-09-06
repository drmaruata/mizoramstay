'use server'

import { revalidatePath } from 'next/cache'
import { requireHost } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

export async function completeBooking(formData: FormData){
  const host=await requireHost(); const db=await createClient(); const id=String(formData.get('bookingId')??'')
  const {data,error}=await db.from('bookings').select('id,status,property_id,user_id,booking_reference,properties!inner(host_profiles!inner(user_id))').eq('id',id).maybeSingle()
  const row=data as any
  if(error||!row||row.properties?.host_profiles?.user_id!==host.id) throw new Error('Booking not found.')
  if(row.status!=='CONFIRMED') throw new Error('Only confirmed bookings can be completed.')
  const {error:updateError}=await db.from('bookings').update({status:'COMPLETED',updated_at:new Date().toISOString()}).eq('id',id).eq('status','CONFIRMED')
  if(updateError) throw new Error(updateError.message)
  await db.from('notifications').insert({user_id:row.user_id,type:'STAY_COMPLETED',channel:'IN_APP',subject:'Stay completed',body:`Booking ${row.booking_reference} is complete. Your verified review is now available.`,status:'SENT',sent_at:new Date().toISOString()})
  revalidatePath(`/host/bookings/${id}`); revalidatePath('/host/bookings'); revalidatePath('/account')
}
