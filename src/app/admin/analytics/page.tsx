'use client'

import { useEffect, useState } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  DollarSign, 
  Users, 
  Clock,
  MapPin,
  Calendar
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AnalyticsData {
  totalDeliveries: number
  deliveriesChange: number
  totalRevenue: number
  revenueChange: number
  activeClients: number
  clientsChange: number
  avgDeliveryTime: number
  deliveriesByStatus: { status: string; count: number }[]
  revenueByMonth: { month: string; revenue: number }[]
  topRoutes: { route: string; count: number }[]
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30d')

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  async function fetchAnalytics() {
    setLoading(true)
    try {
      const res = await fetch(`/api/analytics?period=${period}`)
      if (res.ok) {
        const result = await res.json()
        setData(result)
      }
    } catch (error) {
      // Use mock data if API fails
      setData({
        totalDeliveries: 127,
        deliveriesChange: 12.5,
        totalRevenue: 8750,
        revenueChange: 8.3,
        activeClients: 24,
        clientsChange: 4.2,
        avgDeliveryTime: 42,
        deliveriesByStatus: [
          { status: 'delivered', count: 98 },
          { status: 'in_transit', count: 15 },
          { status: 'pending', count: 10 },
          { status: 'cancelled', count: 4 }
        ],
        revenueByMonth: [
          { month: 'Jan', revenue: 6200 },
          { month: 'Feb', revenue: 7100 },
          { month: 'Mar', revenue: 8750 }
        ],
        topRoutes: [
          { route: 'Downtown → Westerville', count: 32 },
          { route: 'OSU Area → Dublin', count: 28 },
          { route: 'Short North → Grandview', count: 21 }
        ]
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-center">Loading analytics...</div>
  }

  if (!data) {
    return <div className="p-6 text-center text-red-500">Failed to load analytics</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Deliveries</p>
                <p className="text-3xl font-bold">{data.totalDeliveries}</p>
                <p className={`text-sm flex items-center gap-1 ${data.deliveriesChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {data.deliveriesChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {Math.abs(data.deliveriesChange)}% vs last period
                </p>
              </div>
              <Package className="text-blue-400" size={40} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Revenue</p>
                <p className="text-3xl font-bold">${data.totalRevenue.toLocaleString()}</p>
                <p className={`text-sm flex items-center gap-1 ${data.revenueChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {data.revenueChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {Math.abs(data.revenueChange)}% vs last period
                </p>
              </div>
              <DollarSign className="text-green-400" size={40} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Active Clients</p>
                <p className="text-3xl font-bold">{data.activeClients}</p>
                <p className={`text-sm flex items-center gap-1 ${data.clientsChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {data.clientsChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {Math.abs(data.clientsChange)}% vs last period
                </p>
              </div>
              <Users className="text-purple-400" size={40} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Avg Delivery Time</p>
                <p className="text-3xl font-bold">{data.avgDeliveryTime} min</p>
                <p className="text-sm text-slate-400">Within Columbus</p>
              </div>
              <Clock className="text-yellow-400" size={40} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deliveries by Status */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg">Deliveries by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.deliveriesByStatus.map((item) => (
                <div key={item.status} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-slate-400 capitalize">{item.status.replace('_', ' ')}</div>
                  <div className="flex-1 bg-slate-700 rounded-full h-4 overflow-hidden">
                    <div
                      className={`h-full ${
                        item.status === 'delivered' ? 'bg-green-500' :
                        item.status === 'in_transit' ? 'bg-blue-500' :
                        item.status === 'pending' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${(item.count / data.totalDeliveries) * 100}%` }}
                    />
                  </div>
                  <div className="w-10 text-sm text-right">{item.count}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Routes */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin size={18} /> Top Routes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topRoutes.map((route, index) => (
                <div key={route.route} className="flex items-center justify-between p-2 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="text-sm">{route.route}</span>
                  </div>
                  <span className="font-mono text-blue-400">{route.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Month */}
        <Card className="bg-slate-800 border-slate-700 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar size={18} /> Monthly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4 h-48">
              {data.revenueByMonth.map((month) => (
                <div key={month.month} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full bg-green-500 rounded-t"
                    style={{ height: `${(month.revenue / Math.max(...data.revenueByMonth.map(m => m.revenue))) * 100}%` }}
                  />
                  <span className="text-xs text-slate-400">{month.month}</span>
                  <span className="text-sm font-mono">${month.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
