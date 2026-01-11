'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Package,
  Truck,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  Plus,
  ArrowUpRight
} from 'lucide-react'
import Link from 'next/link'

// Demo data
const stats = {
  today_deliveries: 8,
  pending_deliveries: 3,
  completed_today: 5,
  revenue_today: 340,
  revenue_week: 1850,
  revenue_month: 7200,
}

const recentDeliveries = [
  { id: '1', tracking: 'DC-ABC12345', client: 'Medical Office', status: 'in_transit', time: '11:30 AM' },
  { id: '2', tracking: 'DC-DEF67890', client: 'Law Firm LLC', status: 'delivered', time: '10:45 AM' },
  { id: '3', tracking: 'DC-GHI11223', client: 'Private Client', status: 'pending', time: '10:00 AM' },
  { id: '4', tracking: 'DC-JKL44556', client: 'Pharmacy Plus', status: 'delivered', time: '9:30 AM' },
]

const recentCalls = [
  { id: '1', phone: '(614) 555-0101', duration: '3:24', status: 'new_order', time: '11:15 AM' },
  { id: '2', phone: '(614) 555-0202', duration: '1:45', status: 'inquiry', time: '10:30 AM' },
]

const statusColors = {
  pending: 'warning',
  in_transit: 'default',
  delivered: 'success',
  new_order: 'default',
  inquiry: 'secondary',
} as const

const statusLabels = {
  pending: 'Pending',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  new_order: 'New Order',
  inquiry: 'Inquiry',
}

export default function AdminDashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400">Welcome back, Eduardo! Here's your overview.</p>
        </div>
        <Link href="/admin/deliveries/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            New Delivery
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Today's Deliveries</p>
                <p className="text-3xl font-bold text-white">{stats.today_deliveries}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-600/20 flex items-center justify-center">
                <Truck className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Pending</p>
                <p className="text-3xl font-bold text-white">{stats.pending_deliveries}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-600/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Completed Today</p>
                <p className="text-3xl font-bold text-white">{stats.completed_today}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-600/20 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Today's Revenue</p>
                <p className="text-3xl font-bold text-white">${stats.revenue_today}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-600/20 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Deliveries */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">Recent Deliveries</CardTitle>
              <CardDescription className="text-slate-400">Latest delivery activity</CardDescription>
            </div>
            <Link href="/admin/deliveries">
              <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-400">
                View All
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentDeliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center">
                      <Package className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{delivery.tracking}</p>
                      <p className="text-slate-500 text-sm">{delivery.client}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={statusColors[delivery.status as keyof typeof statusColors]}>
                      {statusLabels[delivery.status as keyof typeof statusLabels]}
                    </Badge>
                    <p className="text-slate-500 text-xs mt-1">{delivery.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bland.ai Calls */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">Bland.ai Calls</CardTitle>
              <CardDescription className="text-slate-400">Recent AI-handled calls</CardDescription>
            </div>
            <Link href="/admin/calls">
              <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-400">
                View All
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCalls.map((call) => (
                <div
                  key={call.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-600/20 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{call.phone}</p>
                      <p className="text-slate-500 text-sm">Duration: {call.duration}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={statusColors[call.status as keyof typeof statusColors]}>
                      {statusLabels[call.status as keyof typeof statusLabels]}
                    </Badge>
                    <p className="text-slate-500 text-xs mt-1">{call.time}</p>
                  </div>
                </div>
              ))}

              {recentCalls.length === 0 && (
                <div className="text-center py-8">
                  <Phone className="h-12 w-12 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-500">No recent calls</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Summary */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Revenue Summary</CardTitle>
          <CardDescription className="text-slate-400">Your earnings overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 rounded-lg bg-slate-900/50">
              <p className="text-slate-400 text-sm mb-1">Today</p>
              <p className="text-3xl font-bold text-white">${stats.revenue_today}</p>
            </div>
            <div className="text-center p-6 rounded-lg bg-slate-900/50">
              <p className="text-slate-400 text-sm mb-1">This Week</p>
              <p className="text-3xl font-bold text-white">${stats.revenue_week}</p>
            </div>
            <div className="text-center p-6 rounded-lg bg-slate-900/50">
              <p className="text-slate-400 text-sm mb-1">This Month</p>
              <p className="text-3xl font-bold text-white">${stats.revenue_month}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
