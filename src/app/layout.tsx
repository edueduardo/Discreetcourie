import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'
import ClientProviders from '@/components/ClientProviders'
import GlobalSwitchers from '@/components/GlobalSwitchers'
import CookieConsent from '@/components/CookieConsent'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'

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

const GA_MEASUREMENT_ID = 'G-D5K37VP18B'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        {/* Google Analytics 4 */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
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
