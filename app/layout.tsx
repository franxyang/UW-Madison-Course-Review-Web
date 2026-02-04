import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/Toaster'

export const metadata: Metadata = {
  title: 'WiscFlow - UW Madison Course Reviews',
  description: 'Community-driven course reviews and academic planning for UW Madison students',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50/50 text-slate-900 font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}