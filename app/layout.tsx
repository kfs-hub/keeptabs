import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { NavProgress } from '@/components/ui/nav-progress'
import { Suspense } from 'react'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    default: 'Keep Tabs — Friend Group Fine Tracker',
    template: '%s | Keep Tabs',
  },
  description:
    'Track fines, settle debts, and keep your friend group accountable — with style.',
  keywords: ['fine tracker', 'friend group', 'debt tracker', 'keep tabs'],
  openGraph: {
    title: 'Keep Tabs',
    description: 'Track fines, settle debts, and keep your friend group accountable.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0a0f',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} dark`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-app-gradient font-[var(--font-inter)] antialiased">
        <Providers>
          <Suspense fallback={null}>
            <NavProgress />
          </Suspense>
          {children}
        </Providers>
      </body>
    </html>
  )
}
