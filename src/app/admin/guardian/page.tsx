'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Shield, Phone, Clock, AlertCircle, UserPlus, CheckCircle } from 'lucide-react'

interface GuardianClient {
  id: string
  client_code: string
  client_name: string
  direct_line: string
  started_at: string
  expires_at: string
  monthly_rate: number
  priority_level: number
  total_alerts: number
  last_alert_at: string | null
  is_active: boolean
}

interface Alert {
  id: string
  client_code: string
  type: string
  message: string
  created_at: string
  resolved: boolean
  resolved_at: string | null
}

export default function GuardianPage() {
  const [clients, setClients] = useState<GuardianClient[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const res = await fetch('/api/guardian')
      const data = await res.json()
      if (data.subscriptions) setClients(data.subscriptions)
      if (data.alerts) setAlerts(data.alerts)
    } catch (error) {
      console.error('Error fetching guardian data:', error)
    } finally {
      setLoading(false)
    }
  }

  const activeClients = clients.filter((c) => c.is_active)
  const monthlyRevenue = activeClients.reduce((sum, c) => sum + c.monthly_rate, 0)
  const totalAlerts = clients.reduce((sum, c) => sum + c.total_alerts, 0)

  const getAlertTypeBadge = (type: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'secondary'> = {
      emergency: 'destructive',
      urgent: 'default',
      check_in: 'secondary',
    }
    return <Badge variant={variants[type] || 'default'}>{type}</Badge>
  }

  const getDaysUntilExpiry = (dateStr: string) => {
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-500" />
            Guardian Mode VIP
          </h1>
          <p className="text-muted-foreground">
            VIP clients with priority access (8AM-8PM + on-call)
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Activate Guardian Mode
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Activate Guardian Mode</DialogTitle>
              <DialogDescription>
                Enable priority access for a VIP client
              </DialogDescription>
            </DialogHeader>
            <ActivateForm onClose={() => setIsAddDialogOpen(false)} onSuccess={fetchData} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Guardians</p>
              <p className="text-3xl font-bold">{activeClients.length}</p>
            </div>
            <Shield className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Monthly Revenue</p>
              <p className="text-3xl font-bold">${monthlyRevenue}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Alerts</p>
              <p className="text-3xl font-bold">{totalAlerts}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
        <Card className="p-6 border-green-500 bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700">Status</p>
              <p className="text-xl font-bold text-green-800">ON DUTY</p>
            </div>
            <div className="h-4 w-4 bg-green-500 rounded-full animate-pulse" />
          </div>
        </Card>
      </div>

      {/* Active Guardian Clients */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Active Guardian Clients</h2>
        <div className="space-y-4">
          {clients.map((client) => {
            const daysUntilExpiry = getDaysUntilExpiry(client.expires_at)
            const isExpiringSoon = daysUntilExpiry <= 30

            return (
              <Card
                key={client.id}
                className={`p-4 ${isExpiringSoon ? 'border-orange-500' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Shield className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">{client.client_code}</span>
                        <Badge variant={client.is_active ? 'default' : 'secondary'}>
                          {client.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {isExpiringSoon && (
                          <Badge variant="destructive">
                            Expires in {daysUntilExpiry} days
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {client.direct_line}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Since {new Date(client.started_at).toLocaleDateString()}
                        </span>
                        <span>
                          Priority: {client.priority_level}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">${client.monthly_rate}/mo</div>
                    <div className="text-sm text-muted-foreground">
                      {client.total_alerts} alerts total
                    </div>
                    <Button variant="outline" size="sm" className="mt-2">
                      Call Now
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </Card>

      {/* Recent Alerts */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Alerts</h2>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                {getAlertTypeBadge(alert.type)}
                <div>
                  <div className="font-medium">{alert.client_code}</div>
                  <div className="text-sm text-muted-foreground">{alert.message}</div>
                </div>
              </div>
              <div className="text-right text-sm">
                <div>{new Date(alert.created_at).toLocaleString()}</div>
                {alert.resolved && (
                  <div className="text-green-600">
                    ✓ Resolved {new Date(alert.resolved_at!).toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

interface VIPClient {
  id: string
  name: string
  code_name?: string
}

function ActivateForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [clients, setClients] = useState<VIPClient[]>([])
  const [form, setForm] = useState({
    client_id: '',
    duration: '12',
    monthly_rate: '500',
    priority_level: '1'
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/customers')
      .then(res => res.json())
      .then(data => {
        if (data.customers) setClients(data.customers.filter((c: any) => c.is_vip))
      })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.client_id) return
    
    const client = clients.find(c => c.id === form.client_id)
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + parseInt(form.duration))
    
    setSaving(true)
    try {
      const res = await fetch('/api/guardian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: form.client_id,
          client_code: client?.code_name || client?.name || 'VIP',
          client_name: client?.name,
          monthly_rate: parseFloat(form.monthly_rate),
          priority_level: parseInt(form.priority_level),
          expires_at: expiresAt.toISOString(),
          direct_line: `+1614555${Math.floor(1000 + Math.random() * 9000)}`,
        })
      })
      
      if (res.ok) {
        onSuccess()
        onClose()
      }
    } catch (error) {
      console.error('Error activating guardian:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <Label>Select VIP Client</Label>
        <Select value={form.client_id} onValueChange={(v) => setForm({...form, client_id: v})}>
          <SelectTrigger>
            <SelectValue placeholder="Choose client" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.code_name || c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Duration (months)</Label>
        <Select value={form.duration} onValueChange={(v) => setForm({...form, duration: v})}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 month</SelectItem>
            <SelectItem value="3">3 months</SelectItem>
            <SelectItem value="6">6 months</SelectItem>
            <SelectItem value="12">12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Monthly Rate ($)</Label>
        <Input 
          type="number" 
          value={form.monthly_rate}
          onChange={(e) => setForm({...form, monthly_rate: e.target.value})}
        />
      </div>

      <div>
        <Label>Priority Level</Label>
        <Select value={form.priority_level} onValueChange={(v) => setForm({...form, priority_level: v})}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Level 1 (Highest)</SelectItem>
            <SelectItem value="2">Level 2</SelectItem>
            <SelectItem value="3">Level 3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving || !form.client_id}>
          <Shield className="mr-2 h-4 w-4" />
          {saving ? 'Activating...' : 'Activate Guardian Mode'}
        </Button>
      </div>
    </form>
  )
}
