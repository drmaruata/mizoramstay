import { SiteHeader } from '@/components/public/site-header'
import { SiteFooter } from '@/components/public/site-footer'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#faf7f0] text-[#17332e]"><SiteHeader />{children}<SiteFooter /></div>
}
