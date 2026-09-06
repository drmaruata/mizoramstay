import { SiteHeader } from '@/components/public/site-header'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#faf7f0] text-[#17332e]"><SiteHeader />{children}</div>
}
