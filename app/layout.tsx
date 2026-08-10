import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Fraunces, Public_Sans } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import { OfflineProvider } from '@/lib/offline/offlineContext'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700'],
  style: ['normal', 'italic'],
})

const publicSans = Public_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'ArogyaX — Autonomous Community Healthcare Platform',
  description:
    'A connected healthcare platform for patients, doctors, and health workers in rural and community settings.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={cn(fraunces.variable, publicSans.variable)}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <OfflineProvider>{children}</OfflineProvider>
      </body>
    </html>
  )
}