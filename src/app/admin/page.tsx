'use client'

import { useEffect, useState } from 'react'
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
  ArrowUpRight,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface DashboardStats {
  today_deliveries: number
  pending_deliveries: number
  completed_today: number
  revenue_today: number
  revenue_week: number
  revenue_month: number
}

interface Delivery {
  id: string
  tracking_code: string
  status: string
  created_at: string
  price: number
  clients?: {
    name: string
    company?: string
  } | {
    name: string
    company?: string
  }[]
}

interface BlandCall {
  id: string
  phone_number: string
  duration: number
  status: string
  created_at: string
  extracted_data?: {
    intent?: string
  }
}

const statusColors = {
  pending: 'warning',
  confirmed: 'default',
  picked_up: 'default',
  in_transit: 'default',
  delivered: 'success',
  failed: 'destructive',
  cancelled: 'secondary',
  completed: 'success',
  new_order: 'default',
  inquiry: 'secondary',
} as const

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  failed: 'Failed',
  cancelled: 'Cancelled',
  completed: 'Completed',
  new_order: 'New Order',
  inquiry: 'Inquiry',
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    today_deliveries: 0,
    pending_deliveries: 0,
    completed_today: 0,
    revenue_today: 0,
    revenue_week: 0,
    revenue_month: 0,
  })
  const [recentDeliveries, setRecentDeliveries] = useState<Delivery[]>([])
  const [recentCalls, setRecentCalls] = useState<BlandCall[]>([])

  useEffect(() => {
    async function fetchDashboardData() {
      const supabase = createClient()
      
      // Get today's date boundaries
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayISO = today.toISOString()
      
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const weekAgoISO = weekAgo.toISOString()
      
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      const monthAgoISO = monthAgo.toISOString()

      try {
        // Fetch all deliveries for stats
        const { data: allDeliveries } = await supabase
          .from('deliveries')
          .select('id, status, price, created_at')
        
        // Calculate stats from real data
        const todayDeliveries = allDeliveries?.filter(d => 
          new Date(d.created_at) >= today
        ) || []
        
        const pendingDeliveries = allDeliveries?.filter(d => 
          d.status === 'pending' || d.status === 'confirmed' || d.status === 'in_transit'
        ) || []
        
        const completedToday = allDeliveries?.filter(d => 
          d.status === 'delivered' && new Date(d.created_at) >= today
        ) || []
        
        const revenueToday = todayDeliveries
          .filter(d => d.status === 'delivered')
          .reduce((sum, d) => sum + (d.price || 0), 0)
        
        const revenueWeek = allDeliveries
          ?.filter(d => d.status === 'delivered' && new Date(d.created_at) >= weekAgo)
          .reduce((sum, d) => sum + (d.price || 0), 0) || 0
        
        const revenueMonth = allDeliveries
          ?.filter(d => d.status === 'delivered' && new Date(d.created_at) >= monthAgo)
          .reduce((sum, d) => sum + (d.price || 0), 0) || 0

        setStats({
          today_deliveries: todayDeliveries.length,
          pending_deliveries: pendingDeliveries.length,
          completed_today: completedToday.length,
          revenue_today: revenueToday,
          revenue_week: revenueWeek,
          revenue_month: revenueMonth,
        })

        // Fetch recent deliveries with client info
        const { data: deliveries } = await supabase
          .from('deliveries')
          .select(`
            id,
            tracking_code,
            status,
            created_at,
            price,
            clients (name, company)
          `)
          .order('created_at', { ascending: false })
          .limit(5)

        setRecentDeliveries(deliveries || [])

        // Fetch recent Bland.ai calls
        const { data: calls } = await supabase
          .from('bland_calls')
          .select('id, phone_number, duration, status, created_at, extracted_data')
          .order('created_at', { ascending: false })
          .limit(5)

        setRecentCalls(calls || [])

      } catch (error) {

      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-slate-400">Loading dashboard...</span>
      </div>
    )
  }

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
              {recentDeliveries.length > 0 ? recentDeliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center">
                      <Package className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{delivery.tracking_code}</p>
                      <p className="text-slate-500 text-sm">{
                        Array.isArray(delivery.clients) 
                          ? (delivery.clients[0]?.name || delivery.clients[0]?.company || 'Private Client')
                          : (delivery.clients?.name || delivery.clients?.company || 'Private Client')
                      }</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={statusColors[delivery.status as keyof typeof statusColors] || 'default'}>
                      {statusLabels[delivery.status] || delivery.status}
                    </Badge>
                    <p className="text-slate-500 text-xs mt-1">{formatTime(delivery.created_at)}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-500">No deliveries yet</p>
                  <Link href="/admin/deliveries/new">
                    <Button size="sm" className="mt-2 bg-blue-600">Create First Delivery</Button>
                  </Link>
                </div>
              )}
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
              {recentCalls.length > 0 ? recentCalls.map((call) => (
                <div
                  key={call.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-600/20 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{call.phone_number}</p>
                      <p className="text-slate-500 text-sm">Duration: {formatDuration(call.duration || 0)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={statusColors[call.status as keyof typeof statusColors] || 'default'}>
                      {call.extracted_data?.intent || call.status || 'Call'}
                    </Badge>
                    <p className="text-slate-500 text-xs mt-1">{formatTime(call.created_at)}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <Phone className="h-12 w-12 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-500">No recent calls</p>
                  <p className="text-slate-600 text-xs mt-1">Calls from Bland.ai will appear here</p>
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
