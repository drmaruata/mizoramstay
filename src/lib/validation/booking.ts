import { z } from 'zod'
export const createBookingSchema = z.object({ propertyId: z.string().uuid(), roomId: z.string().uuid(), checkIn: z.coerce.date(), checkOut: z.coerce.date(), guests: z.number().int().min(1).max(20), guest: z.object({ firstName: z.string().min(1).max(100), lastName: z.string().max(100), phone: z.string().min(8).max(20), email: z.string().email().optional() }) }).refine((v) => v.checkOut > v.checkIn, { message: 'checkOut must be after checkIn', path: ['checkOut'] })
export type CreateBookingInput = z.infer<typeof createBookingSchema>
