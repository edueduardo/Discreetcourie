import type { Metadata, Viewport } from 'next'
import './globals.css'
import ClientProviders from '@/components/ClientProviders'
import GlobalSwitchers from '@/components/GlobalSwitchers'
import CookieConsent from '@/components/CookieConsent'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Discreet Courier Columbus',
  description: 'Professional discrete courier services in Columbus, OH',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Discreet Courier',
  },
}

export const viewport: Viewport = {
  themeColor: '#e94560',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="font-sans">
        <ClientProviders>
          <GlobalSwitchers />
          {children}
          <CookieConsent />
          <PWAInstallPrompt />
        </ClientProviders>
        
        {/* Service Worker Registration */}
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                  .then(reg => console.log('SW registered:', reg))
                  .catch(err => console.log('SW registration failed:', err));
              });
            }
          `}
        </Script>
      </body>
    </html>
  )
}
