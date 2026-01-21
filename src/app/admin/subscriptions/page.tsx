'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Loader2, 
  RefreshCw, 
  CreditCard, 
  Users, 
  DollarSign,
  TrendingUp,
  Search,
  ExternalLink
} from 'lucide-react'

interface Subscription {
  id: string
  status: string
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  canceledAt: string | null
  created: string
  customer: string
  items: Array<{
    productName: string | null
    amount: number
    interval: string
  }>
  metadata: Record<string, string>
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadSubscriptions()
  }, [])

  const loadSubscriptions = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/subscriptions')
      const data = await res.json()
      setSubscriptions(data.subscriptions || [])
    } catch (error) {

    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string, cancelAtPeriodEnd: boolean) => {
    if (cancelAtPeriodEnd) {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Canceling</Badge>
    }
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>
      case 'trialing':
        return <Badge className="bg-blue-500">Trial</Badge>
      case 'past_due':
        return <Badge variant="destructive">Past Due</Badge>
      case 'canceled':
        return <Badge variant="secondary">Canceled</Badge>
      case 'incomplete':
        return <Badge variant="outline">Incomplete</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Calculate stats
  const activeSubscriptions = subscriptions.filter(s => s.status === 'active' && !s.cancelAtPeriodEnd)
  const mrr = activeSubscriptions.reduce((sum, sub) => sum + (sub.items[0]?.amount || 0), 0)
  const cancelingCount = subscriptions.filter(s => s.cancelAtPeriodEnd).length

  const filteredSubscriptions = subscriptions.filter(sub => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      sub.id.toLowerCase().includes(search) ||
      sub.customer.toLowerCase().includes(search) ||
      sub.items.some(item => item.productName?.toLowerCase().includes(search)) ||
      sub.metadata?.client_id?.toLowerCase().includes(search)
    )
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Subscription Management
          </h1>
          <p className="text-gray-500">Manage recurring payments and subscriptions</p>
        </div>
        <Button onClick={loadSubscriptions} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Subscriptions</p>
                <p className="text-2xl font-bold">{activeSubscriptions.length}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Monthly Revenue (MRR)</p>
                <p className="text-2xl font-bold">${mrr.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Subscriptions</p>
                <p className="text-2xl font-bold">{subscriptions.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Canceling Soon</p>
                <p className="text-2xl font-bold">{cancelingCount}</p>
              </div>
              <CreditCard className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by ID, customer, or plan..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'No subscriptions match your search' : 'No subscriptions yet'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium">Plan</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Period End</th>
                    <th className="pb-3 font-medium">Customer</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscriptions.map(sub => (
                    <tr key={sub.id} className="border-b hover:bg-gray-50">
                      <td className="py-3">
                        <div className="font-medium">
                          {sub.items[0]?.productName || 'Unknown Plan'}
                        </div>
                        <div className="text-xs text-gray-400">{sub.id.slice(0, 20)}...</div>
                      </td>
                      <td className="py-3">
                        {getStatusBadge(sub.status, sub.cancelAtPeriodEnd)}
                      </td>
                      <td className="py-3">
                        ${sub.items[0]?.amount || 0}/{sub.items[0]?.interval || 'mo'}
                      </td>
                      <td className="py-3 text-sm">
                        {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-sm text-gray-500">
                        {typeof sub.customer === 'string' ? sub.customer.slice(0, 15) : ''}...
                      </td>
                      <td className="py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`https://dashboard.stripe.com/subscriptions/${sub.id}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
