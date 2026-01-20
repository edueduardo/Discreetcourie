'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  MapPin, 
  Package, 
  Camera, 
  Navigation,
  Menu,
  X,
  Home
} from 'lucide-react'

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Register service worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/driver-sw.js')
        .then((reg) => console.log('Driver SW registered:', reg.scope))
        .catch((err) => console.error('Driver SW failed:', err))
    }
  }, [])

  const navItems = [
    { href: '/driver', icon: Home, label: 'Dashboard' },
    { href: '/driver/deliveries', icon: Package, label: 'Deliveries' },
    { href: '/driver/tracking', icon: MapPin, label: 'GPS Track' },
    { href: '/driver/proof', icon: Camera, label: 'Photo Proof' },
    { href: '/driver/navigate', icon: Navigation, label: 'Navigate' },
  ]

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-800 border-b border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/driver" className="text-xl font-bold text-blue-400">
            DC Driver
          </Link>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-lg bg-slate-700"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Slide-out Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setIsMenuOpen(false)}>
          <nav className="absolute right-0 top-0 bottom-0 w-64 bg-slate-800 pt-16 p-4" onClick={e => e.stopPropagation()}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 p-3 rounded-lg mb-2 ${
                  pathname === item.href ? 'bg-blue-600' : 'hover:bg-slate-700'
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="pt-16 pb-20 px-4">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-800 border-t border-slate-700">
        <div className="flex justify-around py-2">
          {navItems.slice(0, 4).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center p-2 rounded-lg ${
                pathname === item.href ? 'text-blue-400' : 'text-slate-400'
              }`}
            >
              <item.icon size={24} />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
