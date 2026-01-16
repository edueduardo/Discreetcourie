'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, MapPin, Calendar } from 'lucide-react'

interface DeliveryHistoryItem {
  id: string
  tracking_code: string
  status: string
  created_at: string
  delivered_at?: string
  pickup_location?: string
  delivery_location?: string
  service_type?: string
  amount?: number
}

export default function HistoryPage() {
  const [deliveries, setDeliveries] = useState<DeliveryHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all')
  const [page, setPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    fetchHistory()
  }, [filter])

  async function fetchHistory() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ 
        history: 'true',
        status: filter 
      })
      const res = await fetch(`/api/orders?${params}`)
      if (res.ok) {
        const data = await res.json()
        setDeliveries(data.deliveries || [])
      }
    } catch (error) {
      console.error('Failed to fetch history:', error)
    } finally {
      setLoading(false)
    }
  }

  const paginatedDeliveries = deliveries.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )

  const totalPages = Math.ceil(deliveries.length / itemsPerPage)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/portal/dashboard" className="text-gray-400 hover:text-white">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Delivery History</h1>
            <p className="text-gray-400">Complete record of all your deliveries</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {['all', 'completed', 'cancelled'].map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f as any); setPage(1) }}
              className={`px-4 py-2 rounded-lg capitalize ${
                filter === f 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold">{deliveries.length}</div>
            <div className="text-gray-400 text-sm">Total Deliveries</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-500">
              {deliveries.filter(d => d.status === 'delivered').length}
            </div>
            <div className="text-gray-400 text-sm">Completed</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-500">
              ${deliveries.reduce((sum, d) => sum + (d.amount || 0), 0).toLocaleString()}
            </div>
            <div className="text-gray-400 text-sm">Total Spent</div>
          </div>
        </div>

        {/* History List */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading history...</div>
        ) : deliveries.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">No delivery history found</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedDeliveries.map((delivery) => (
                <div 
                  key={delivery.id}
                  className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {getStatusIcon(delivery.status)}
                      <div>
                        <div className="font-medium">{delivery.tracking_code}</div>
                        <div className="text-sm text-gray-400 mt-1">
                          {delivery.service_type || 'Standard Delivery'}
                        </div>
                        {delivery.delivery_location && (
                          <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                            <MapPin className="h-3 w-3" />
                            {delivery.delivery_location}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm text-gray-400">
                        <Calendar className="h-3 w-3" />
                        {formatDate(delivery.created_at)}
                      </div>
                      {delivery.amount && (
                        <div className="text-lg font-semibold mt-1">
                          ${delivery.amount.toFixed(2)}
                        </div>
                      )}
                      <Link 
                        href={`/track?code=${delivery.tracking_code}`}
                        className="text-blue-400 text-sm hover:underline mt-2 inline-block"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-800 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-gray-800 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
