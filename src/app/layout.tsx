import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SwellCheck - Smart Surf Notifications',
  description: 'Get notified when surf conditions are perfect at your local beach',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
