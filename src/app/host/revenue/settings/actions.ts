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

    const settings = await service.saveSettings(hostId, {
      beneficiaryName: String(formData.get('beneficiaryName') ?? ''),
      bankName: String(formData.get('bankName') ?? ''),
      accountNumber: String(formData.get('accountNumber') ?? ''),
      ifscCode: String(formData.get('ifscCode') ?? ''),
      autoPayout: true,
      payoutDelayDays: 0,
    })

    revalidatePath('/host/revenue')
    revalidatePath('/host/revenue/settings')

    if (settings.status === 'ACTIVE') return { ok: true, message: 'Bank account verified successfully. Eligible earnings will be settled automatically on the 5th and 15th.' }
    if (settings.status === 'UNDER_REVIEW') return { ok: true, message: 'Bank account submitted. RazorpayX is still validating the account.' }
    if (settings.status === 'ACTION_REQUIRED') return { ok: false, message: settings.failureReason ? `Bank account validation failed: ${settings.failureReason}` : 'Bank account validation requires action. Check the account details and submit again.' }
    return { ok: true, message: 'Bank account details were saved and are awaiting validation.' }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Unable to save payout settings.' }
  }
}
