'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

export async function submitReview(formData:FormData){
  const user=await requireUser(); const db=await createClient(); const bookingId=String(formData.get('bookingId')??''); const rating=Number(formData.get('rating')??0); const comment=String(formData.get('comment')??'').trim()
  if(!bookingId || !Number.isInteger(rating) || rating<1 || rating>5) throw new Error('Choose a rating from 1 to 5.')
  const {data:booking}=await db.from('bookings').select('id,property_id,status').eq('id',bookingId).eq('user_id',user.id).maybeSingle()
  if(!booking || booking.status!=='COMPLETED') throw new Error('Only completed stays can be reviewed.')
  const payload={booking_id:bookingId,user_id:user.id,property_id:booking.property_id,rating,cleanliness_rating:rating,location_rating:rating,hospitality_rating:rating,facilities_rating:rating,value_rating:rating,comment,status:'PUBLISHED',updated_at:new Date().toISOString()}
  const {error}=await db.from('reviews').upsert(payload,{onConflict:'booking_id'})
  if(error) throw new Error(error.message)
  revalidatePath('/account'); revalidatePath('/account/reviews'); revalidatePath('/host/reviews'); revalidatePath('/stays')
}
