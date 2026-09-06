'use client'

import { Heart } from 'lucide-react'
import { useState } from 'react'
import { toggleWishlist } from '@/app/(public)/stays/wishlist-actions'

export function WishlistButton({propertyId,initialSaved=false}:{propertyId:string;initialSaved?:boolean}){
  const [saved,setSaved]=useState(initialSaved); const [busy,setBusy]=useState(false)
  async function toggle(){setBusy(true);try{const result=await toggleWishlist(propertyId);setSaved(result.saved)}catch{window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname)}`)}finally{setBusy(false)}}
  return <button type="button" aria-label={saved?'Remove from wishlist':'Save to wishlist'} aria-pressed={saved} disabled={busy} onClick={toggle} className="grid size-9 place-items-center rounded-full bg-white/90 transition hover:bg-white disabled:opacity-60"><Heart className={`size-4 ${saved?'fill-[#d4942f] text-[#d4942f]':'text-[#17332e]'}`}/></button>
}
