import type { Metadata } from 'next'
import { Providers } from '@/providers/Providers'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'ChantTracker',
  description: 'Hindu chant and japa tracking',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
