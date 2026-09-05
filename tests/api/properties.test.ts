import { describe, expect, it } from 'vitest'
import { properties } from '@/features/properties/demo-data'
describe('property catalogue', () => { it('contains only non-empty slugs', () => { expect(properties.length).toBeGreaterThan(0); expect(properties.every((p)=>p.slug.length>0)).toBe(true) }) })
