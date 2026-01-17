'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConciergeTask } from '@/types'
import { UserCheck, Package, ShoppingBag, AlertCircle, CheckCircle, Clock, Loader2, RefreshCw } from 'lucide-react'

export default function ConciergePage() {
  const [tasks, setTasks] = useState<ConciergeTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  const fetchTasks = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/concierge')
      if (!res.ok) throw new Error('Failed to fetch concierge tasks')
      const data = await res.json()
      setTasks(data.tasks || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'requested':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'in_progress':
        return <AlertCircle className="h-4 w-4 text-blue-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      requested: 'outline',
      quoted: 'outline',
      accepted: 'default',
      pending: 'default',
      in_progress: 'default',
      completed: 'secondary',
      cancelled: 'destructive',
    }
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'purchase':
      case 'discreet_delivery':
        return <ShoppingBag className="h-4 w-4" />
      case 'representation':
      case 'special':
        return <UserCheck className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const filteredTasks = tasks.filter((task) => {
    if (activeTab === 'all') return true
    if (activeTab === 'purchases') return task.category === 'purchase'
    if (activeTab === 'representation') return task.category === 'representation'
    if (activeTab === 'special') return task.service_tier === 'fixer'
    return true
  })

  const stats = {
    pending: tasks.filter((t) => t.status === 'requested' || t.status === 'quoted').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    revenue: tasks
      .filter((t) => t.paid)
      .reduce((sum, t) => sum + (t.final_price || t.quoted_price || 0), 0),
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Concierge Tasks</h1>
          <p className="text-muted-foreground">VIP premium service requests</p>
        </div>
        <Button variant="outline" onClick={fetchTasks} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Card className="p-4 bg-red-900/20 border-red-700">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-400">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchTasks} className="ml-auto">
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card className="p-12 text-center">
          <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-blue-500" />
          <p className="text-muted-foreground">Loading concierge tasks...</p>
        </Card>
      )}

      {/* Stats */}
      {!loading && (
      <>
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-3xl font-bold">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-3xl font-bold">{stats.in_progress}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-3xl font-bold">{stats.completed}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Revenue</p>
              <p className="text-3xl font-bold">${stats.revenue}</p>
            </div>
            <UserCheck className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
          <TabsTrigger value="representation">Representation</TabsTrigger>
          <TabsTrigger value="special">The Fixer</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {filteredTasks.map((task) => (
            <Card key={task.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getCategoryIcon(task.category)}
                    <span className="font-semibold text-lg">
                      #{task.id} · {task.title}
                    </span>
                    {getStatusIcon(task.status)}
                    {getStatusBadge(task.status)}
                    {task.no_trace_mode && (
                      <Badge variant="outline" className="bg-orange-50">
                        🔥 No-Trace
                      </Badge>
                    )}
                    {task.nda_signed && (
                      <Badge variant="outline" className="bg-purple-50">
                        📜 NDA
                      </Badge>
                    )}
                  </div>

                  <p className="text-muted-foreground mb-3">{task.description}</p>

                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-muted-foreground">Tier:</span>{' '}
                      <Badge variant="secondary">{task.service_tier}</Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Price:</span>{' '}
                      <span className="font-semibold">
                        ${task.final_price || task.quoted_price || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>{' '}
                      <span className={task.paid ? 'text-green-600' : 'text-orange-600'}>
                        {task.paid ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created:</span>{' '}
                      {new Date(task.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {task.auto_delete_at && (
                    <div className="mt-2 text-sm text-orange-600">
                      ⏱️ Auto-delete:{' '}
                      {Math.ceil(
                        (new Date(task.auto_delete_at).getTime() - Date.now()) /
                          (1000 * 60 * 60 * 24)
                      )}{' '}
                      days
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                  {(task.status === 'requested' || task.status === 'quoted') && (
                    <Button size="sm">Start</Button>
                  )}
                  {task.status === 'in_progress' && (
                    <Button size="sm" variant="default">
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}

          {filteredTasks.length === 0 && !error && (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No tasks in this category</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      </>
      )}
    </div>
  )
}
