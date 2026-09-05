import { z } from 'zod'
export const propertyUpdateSchema = z.object({ name: z.string().min(2).max(160).optional(), description: z.string().max(10000).optional(), address: z.string().max(300).optional(), district: z.string().max(120).optional(), status: z.enum(['DRAFT','ACTIVE','SUSPENDED','ARCHIVED']).optional() })
