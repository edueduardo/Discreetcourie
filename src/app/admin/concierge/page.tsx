'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConciergeTask } from '@/types'
import { UserCheck, Package, ShoppingBag, AlertCircle, CheckCircle, Clock } from 'lucide-react'

// Demo data - replace with real Supabase queries
const demoTasks: ConciergeTask[] = [
  {
    id: '1',
    client_id: '1',
    service_tier: 'concierge',
    category: 'purchase',
    title: 'Discreet pharmacy purchase',
    description: 'Purchase [sensitive item] from CVS',
    status: 'requested',
    quoted_price: 125,
    paid: false,
    no_trace_mode: true,
    auto_delete_at: '2026-01-18T00:00:00Z',
    nda_signed: true,
    created_at: '2026-01-11T10:00:00Z',
    updated_at: '2026-01-11T10:00:00Z',
  },
  {
    id: '2',
    client_id: '2',
    service_tier: 'concierge',
    category: 'representation',
    title: 'Return item to ex',
    description: 'Return package to [person] at [address]',
    status: 'in_progress',
    quoted_price: 150,
    final_price: 150,
    paid: true,
    no_trace_mode: false,
    nda_signed: false,
    created_at: '2026-01-10T14:00:00Z',
    updated_at: '2026-01-11T09:00:00Z',
  },
  {
    id: '3',
    client_id: '1',
    service_tier: 'fixer',
    category: 'special',
    title: 'Operação Fênix - Phase 2',
    description: 'Help client transition to new situation',
    status: 'in_progress',
    quoted_price: 500,
    paid: true,
    no_trace_mode: true,
    nda_signed: true,
    created_at: '2026-01-08T00:00:00Z',
    updated_at: '2026-01-11T08:00:00Z',
  },
]

export default function ConciergePage() {
  const [tasks, setTasks] = useState(demoTasks)
  const [activeTab, setActiveTab] = useState('all')

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
      <div>
        <h1 className="text-3xl font-bold">Concierge Tasks</h1>
        <p className="text-muted-foreground">VIP premium service requests</p>
      </div>

      {/* Stats */}
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

          {filteredTasks.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No tasks in this category</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
