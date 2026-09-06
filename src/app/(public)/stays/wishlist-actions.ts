'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

export async function toggleWishlist(propertyId:string){
  const user=await requireUser(); const db=await createClient();
  const {data:existing}=await db.from('wishlists').select('id').eq('user_id',user.id).eq('property_id',propertyId).maybeSingle()
  if(existing) await db.from('wishlists').delete().eq('id',existing.id)
  else {const {error}=await db.from('wishlists').insert({user_id:user.id,property_id:propertyId}); if(error) throw new Error(error.message)}
  revalidatePath('/stays'); revalidatePath('/account')
  return {saved:!existing}
}
