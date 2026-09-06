import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createBookingSchema } from '@/lib/validation/booking'
import { trackEvent } from '@/lib/analytics'

export async function POST(request: Request) {
  try {
    const db = await createClient()
    const { data: { user } } = await db.auth.getUser()
    if (!user) return NextResponse.json({ error:{code:'UNAUTHENTICATED',message:'Please sign in before booking.'} }, {status:401})

    const parsed = createBookingSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({error:{code:'VALIDATION_ERROR',issues:parsed.error.flatten()}},{status:400})

    const idempotencyKey=request.headers.get('Idempotency-Key')?.trim()||crypto.randomUUID()
    if(idempotencyKey.length>128) return NextResponse.json({error:{code:'INVALID_IDEMPOTENCY_KEY',message:'Idempotency key is too long.'}},{status:400})

    const guestName=`${parsed.data.guest.firstName} ${parsed.data.guest.lastName}`.trim()
    const {data,error}=await db.rpc('create_booking_transaction',{p_property_id:parsed.data.propertyId,p_room_id:parsed.data.roomId,p_check_in:parsed.data.checkIn.toISOString().slice(0,10),p_check_out:parsed.data.checkOut.toISOString().slice(0,10),p_guests:parsed.data.guests,p_quantity:1,p_guest_name:guestName,p_guest_phone:parsed.data.guest.phone,p_guest_email:parsed.data.guest.email??null,p_notes:null,p_idempotency_key:idempotencyKey,p_hold_minutes:15})
    if(error){const status=['P0003','P0004'].includes(error.code??'')?409:error.code==='42501'?401:400;return NextResponse.json({error:{code:error.code??'BOOKING_FAILED',message:error.message}},{status})}
    const booking=data?.[0]
    if(!booking) return NextResponse.json({error:{code:'BOOKING_FAILED',message:'Booking hold could not be created.'}},{status:500})

    void trackEvent({eventName:'booking_created',userId:user.id,properties:{property_id:parsed.data.propertyId,room_id:parsed.data.roomId,booking_id:booking.booking_id,total_amount:Number(booking.total_amount)},pagePath:'/booking/new'})
    return NextResponse.json({booking:{id:booking.booking_id,bookingNumber:booking.booking_reference,totalAmount:Number(booking.total_amount),holdExpiresAt:booking.hold_expires_at,status:'PENDING'}},{status:201,headers:{'Idempotency-Key':idempotencyKey}})
  } catch(error){console.error('[create-booking]',error);return NextResponse.json({error:{code:'INTERNAL_ERROR',message:'Could not create booking.'}},{status:500})}
}
