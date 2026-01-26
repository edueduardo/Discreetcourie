import type { Metadata } from 'next'
import './globals.css'
import ClientProviders from '@/components/ClientProviders'
import GlobalSwitchers from '@/components/GlobalSwitchers'

export const metadata: Metadata = {
  title: 'Discreet Courier Columbus',
  description: 'Professional discrete courier services in Columbus, OH',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <ClientProviders>
          <GlobalSwitchers />
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}
