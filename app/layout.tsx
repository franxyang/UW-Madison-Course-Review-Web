import type { Metadata } from 'next'
import './globals.css'

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
      </body>
    </html>
  )
}