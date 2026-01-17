'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Package,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Camera,
  MapPin,
  Clock,
  Loader2,
  RefreshCw,
  AlertCircle
} from 'lucide-react'

interface Delivery {
  id: string
  tracking_code: string
  client_name: string
  pickup_address: string
  delivery_address: string
  status: string
  priority: string
  price: number
  created_at: string
}

const statusColors = {
  pending: 'warning',
  confirmed: 'secondary',
  picked_up: 'default',
  in_transit: 'default',
  delivered: 'success',
  failed: 'destructive',
  cancelled: 'destructive',
} as const

const statusLabels = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  failed: 'Failed',
  cancelled: 'Cancelled',
}

const priorityColors = {
  standard: 'secondary',
  express: 'default',
  urgent: 'destructive',
} as const

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchDeliveries = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/orders')
      if (!res.ok) throw new Error('Failed to fetch deliveries')
      const data = await res.json()
      setDeliveries(data.orders || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deliveries')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeliveries()
  }, [])

  const filteredDeliveries = deliveries.filter((delivery) => {
    const matchesSearch =
      delivery.tracking_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || delivery.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Deliveries</h1>
          <p className="text-slate-400">Manage all your deliveries</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchDeliveries} disabled={loading} className="border-slate-700 text-slate-300">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/admin/deliveries/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              New Delivery
            </Button>
          </Link>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="bg-red-900/20 border-red-700">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-400">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchDeliveries} className="ml-auto border-red-700 text-red-400">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-12 text-center">
            <Loader2 className="h-8 w-8 text-blue-500 mx-auto mb-4 animate-spin" />
            <p className="text-slate-400">Loading deliveries...</p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search by tracking code or client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 bg-slate-900 border-slate-700 text-white">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all" className="text-white">All Status</SelectItem>
                <SelectItem value="pending" className="text-white">Pending</SelectItem>
                <SelectItem value="in_transit" className="text-white">In Transit</SelectItem>
                <SelectItem value="delivered" className="text-white">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Deliveries List */}
      {!loading && (
      <div className="space-y-4">
        {filteredDeliveries.map((delivery) => (
          <Card key={delivery.id} className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left Section */}
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
                    <Package className="h-6 w-6 text-slate-400" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-white">{delivery.tracking_code}</h3>
                      <Badge variant={statusColors[delivery.status as keyof typeof statusColors]}>
                        {statusLabels[delivery.status as keyof typeof statusLabels]}
                      </Badge>
                      <Badge variant={priorityColors[delivery.priority as keyof typeof priorityColors]}>
                        {delivery.priority?.charAt(0).toUpperCase() + delivery.priority?.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-slate-400">{delivery.client_name}</p>
                    <div className="flex flex-col md:flex-row md:items-center gap-2 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        From: {delivery.pickup_address}
                      </span>
                      <span className="hidden md:inline">→</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        To: {delivery.delivery_address}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xl font-bold text-white">${delivery.price}</p>
                    <p className="text-slate-500 text-sm flex items-center justify-end gap-1">
                      <Clock className="h-3 w-3" />
                      Today
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/deliveries/${delivery.id}`}>
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/admin/deliveries/${delivery.id}/edit`}>
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    {delivery.status === 'in_transit' && (
                      <Link href={`/admin/deliveries/${delivery.id}/proof`}>
                        <Button variant="ghost" size="icon" className="text-blue-500 hover:text-blue-400">
                          <Camera className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredDeliveries.length === 0 && !error && (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-white font-medium mb-2">No deliveries found</h3>
              <p className="text-slate-500 mb-4">Try adjusting your search or filter</p>
              <Link href="/admin/deliveries/new">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Delivery
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
      )}
    </div>
  )
}
