'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Package, Clock, CheckCircle, MapPin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface Delivery {
  id: string
  tracking_code: string
  pickup_address: string
  delivery_address: string
  status: string
  scheduled_time: string
  scheduled_date: string
}

export default function DriverDeliveries() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDeliveries()
  }, [])

  async function fetchDeliveries() {
    try {
      const res = await fetch('/api/orders?limit=50')
      if (res.ok) {
        const data = await res.json()
        setDeliveries(data.deliveries || [])
      }
    } catch (error) {

    } finally {
      setLoading(false)
    }
  }

  const filteredDeliveries = filter === 'all' 
    ? deliveries 
    : deliveries.filter(d => d.status === filter)

  const statusColors: Record<string, string> = {
    pending: 'bg-slate-600',
    confirmed: 'bg-yellow-600',
    in_transit: 'bg-blue-600',
    delivered: 'bg-green-600',
    cancelled: 'bg-red-600'
  }

  return (
    <div className="py-4 space-y-4">
      <h1 className="text-xl font-bold">Deliveries</h1>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'pending', 'confirmed', 'in_transit', 'delivered'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
              filter === status ? 'bg-blue-600' : 'bg-slate-700'
            }`}
          >
            {status === 'all' ? 'All' : status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Deliveries List */}
      {loading ? (
        <p className="text-slate-400 text-center py-8">Loading...</p>
      ) : filteredDeliveries.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <Package className="mx-auto mb-2" size={48} />
          <p>No deliveries found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredDeliveries.map((delivery) => (
            <Link key={delivery.id} href={`/driver/deliveries/${delivery.id}`}>
              <Card className="bg-slate-800 border-slate-700 mb-2">
                <CardContent className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-blue-400">{delivery.tracking_code}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${statusColors[delivery.status] || 'bg-slate-600'}`}>
                      {delivery.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-sm space-y-1">
                    <p className="flex items-start gap-2">
                      <MapPin size={14} className="text-green-400 mt-0.5 shrink-0" />
                      <span className="text-slate-300 truncate">{delivery.pickup_address}</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <MapPin size={14} className="text-red-400 mt-0.5 shrink-0" />
                      <span className="text-slate-400 truncate">{delivery.delivery_address}</span>
                    </p>
                  </div>
                  {delivery.scheduled_time && (
                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                      <Clock size={12} />
                      {delivery.scheduled_date} at {delivery.scheduled_time}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
