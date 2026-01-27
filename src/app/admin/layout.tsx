'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Package,
  LayoutDashboard,
  Truck,
  Users,
  Phone,
  LogOut,
  Menu,
  X,
  UserCheck,
  Eye,
  Route,
  CreditCard,
  MessageSquare,
  Settings,
  FileSignature,
  Repeat
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/deliveries', icon: Truck, label: 'Deliveries' },
  { href: '/admin/routes/optimize', icon: Route, label: 'Route Optimizer' },
  { href: '/admin/clients', icon: Users, label: 'Clients' },
  { href: '/admin/nda', icon: FileSignature, label: 'NDA Enforcement' },
  { href: '/admin/subscriptions', icon: Repeat, label: 'Subscriptions' },
  { href: '/admin/concierge', icon: UserCheck, label: 'Requests' },
  { href: '/admin/calls', icon: Phone, label: 'AI Phone Agent' },
  { href: '/admin/payments', icon: CreditCard, label: 'Payments' },
  { href: '/admin/notifications', icon: MessageSquare, label: 'SMS/WhatsApp' },
  { href: '/admin/tracking', icon: Eye, label: 'GPS Tracking' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6 text-blue-500" />
          <span className="font-bold text-white">Discreet Courier</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-slate-400"
        >
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 bg-slate-800 border-r border-slate-700 transform transition-transform lg:relative lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Logo */}
          <div className="hidden lg:flex items-center gap-2 p-6">
            <Package className="h-8 w-8 text-blue-500" />
            <div>
              <h1 className="font-bold text-white">Discreet Courier</h1>
              <p className="text-xs text-slate-500">Admin Panel</p>
            </div>
          </div>

          <Separator className="bg-slate-700" />

          {/* Nav Items */}
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/admin' && pathname.startsWith(item.href))
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:bg-slate-700 hover:text-white"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* User Section */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                E
              </div>
              <div>
                <p className="text-white font-medium">Eduardo</p>
                <p className="text-xs text-slate-500">Admin</p>
              </div>
            </div>
            <Link href="/login">
              <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-700">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </Link>
          </div>
        </aside>

        {/* Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen lg:min-h-[calc(100vh)]">
          {children}
        </main>
      </div>
    </div>
  )
}
