'use server'

import { revalidatePath } from 'next/cache'
import { requireHost } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { HostPayoutService } from '@/features/payments/host-payout.service'

export type PayoutSettingsState = { ok: boolean; message: string }

export async function saveHostPayoutSettings(_previous: PayoutSettingsState, formData: FormData): Promise<PayoutSettingsState> {
  try {
    await requireHost()
    const db = await createClient()
    const service = new HostPayoutService(db)
    const hostId = await service.getHostProfileId()
    if (!hostId) throw new Error('Host account could not be resolved.')

    await service.saveSettings(hostId, {
      beneficiaryName: String(formData.get('beneficiaryName') ?? ''),
      bankName: String(formData.get('bankName') ?? ''),
      accountNumber: String(formData.get('accountNumber') ?? ''),
      ifscCode: String(formData.get('ifscCode') ?? ''),
      autoPayout: formData.get('autoPayout') === 'on',
      payoutDelayDays: Number(formData.get('payoutDelayDays') ?? 1),
    })

    revalidatePath('/host/revenue')
    revalidatePath('/host/revenue/settings')
    return { ok: true, message: 'Payout account submitted for validation.' }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Unable to save payout settings.' }
  }
}
