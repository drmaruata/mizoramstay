import { describe, expect, it } from 'vitest'
function total(nightly: number, nights: number, feeRate = 0.1) { const subtotal = nightly * nights; const fee = Math.round(subtotal * feeRate); return { subtotal, fee, total: subtotal + fee } }
describe('pricing', () => { it('calculates subtotal and fee deterministically', () => { expect(total(1800,4)).toEqual({subtotal:7200,fee:720,total:7920}) }) })
