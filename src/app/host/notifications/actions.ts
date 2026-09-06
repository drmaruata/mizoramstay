'use server'

import { revalidatePath } from 'next/cache'
import { requireHost } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

export async function markNotificationRead(formData: FormData){
  const host=await requireHost(); const db=await createClient(); const id=String(formData.get('id')??'')
  const {error}=await db.from('notifications').update({status:'READ'}).eq('id',id).eq('user_id',host.id)
  if(error) throw new Error(error.message)
  revalidatePath('/host/notifications'); return {ok:true}
}

export async function markAllNotificationsRead(){
  const host=await requireHost(); const db=await createClient(); const {error}=await db.from('notifications').update({status:'READ'}).eq('user_id',host.id).neq('status','READ')
  if(error) throw new Error(error.message); revalidatePath('/host/notifications'); return {ok:true}
}
