'use server'

import { revalidatePath } from 'next/cache'
import { requireHost } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

export async function respondToReview(formData: FormData) {
  const host = await requireHost(); const db=await createClient()
  const reviewId=String(formData.get('reviewId')??''); const response=String(formData.get('response')??'').trim()
  if(!reviewId || response.length<3) throw new Error('Write a response before saving.')
  const { data: profile }=await db.from('host_profiles').select('id').eq('user_id',host.id).maybeSingle()
  if(!profile) throw new Error('Host profile not found.')
  const { data: review }=await db.from('reviews').select('id,property_id').eq('id',reviewId).maybeSingle()
  if(!review) throw new Error('Review not found.')
  const { data: owned }=await db.from('properties').select('id').eq('id',review.property_id).eq('host_id',profile.id).maybeSingle()
  if(!owned) throw new Error('You cannot respond to this review.')
  const { error }=await db.from('review_responses').upsert({review_id:reviewId,host_id:profile.id,response,updated_at:new Date().toISOString()},{onConflict:'review_id'})
  if(error) throw new Error(error.message)
  revalidatePath('/host/reviews'); revalidatePath('/stays')
  return {ok:true}
}
