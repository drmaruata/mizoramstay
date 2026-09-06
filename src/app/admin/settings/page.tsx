import { requireAdmin } from '@/lib/auth/session'
import { SettingsPanel } from './SettingsPanel'

export const metadata = {
  title: 'Settings | Admin',
}

export default async function AdminSettingsPage() {
  await requireAdmin()
  return (
    <div className="mx-auto max-w-[1240px] space-y-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#72827b]">Settings</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-[#183a31] md:text-4xl">Platform control</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Review the commercial, cancellation, trust and notification defaults that define the MVP operating model.</p>
      </div>
      <SettingsPanel />
    </div>
  )
}
