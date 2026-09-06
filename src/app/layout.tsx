import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: { default: 'MizoramStay — Discover Mizoram. Stay local. Travel deeper.', template: '%s | MizoramStay' },
  description: 'A trusted marketplace for verified stays and local travel across Mizoram.',
  applicationName: 'MizoramStay',
  openGraph: { title: 'MizoramStay', description: 'Discover Mizoram. Stay local. Travel deeper.', type: 'website' },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
