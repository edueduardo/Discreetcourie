'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Heart, Clock, AlertTriangle, CheckCircle, Send, Plus, 
  Calendar, User, Phone, Mail, FileText, Loader2, RefreshCw,
  Bell, Skull, Timer
} from 'lucide-react'

interface LastWillItem {
  id: string
  item_code: string
  description: string
  client_id: string
  clients?: { id: string; code_name: string; name: string; phone: string; email: string }
  last_will_recipient_name: string
  last_will_recipient_phone?: string
  last_will_recipient_email?: string
  last_will_recipient_relation?: string
  last_will_message?: string
  last_will_trigger: string
  last_will_checkin_days: number
  last_will_last_checkin: string
  deliver_at?: string
  delivered_at?: string
  status: string
  days_since_checkin?: number
  days_until_trigger?: number
  needs_checkin?: boolean
  overdue?: boolean
  created_at: string
}

interface Client {
  id: string
  code_name: string
  name: string
  phone: string
  email: string
}

export default function LastWillPage() {
  const [items, setItems] = useState<LastWillItem[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' })

  // Form state
  const [form, setForm] = useState({
    client_id: '',
    description: '',
    recipient_name: '',
    recipient_phone: '',
    recipient_email: '',
    recipient_relation: '',
    message: '',
    trigger: 'no_checkin',
    checkin_days: '30',
    deliver_at: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [willsRes, clientsRes] = await Promise.all([
        fetch('/api/last-will'),
        fetch('/api/customers')
      ])
      
      const willsData = await willsRes.json()
      const clientsData = await clientsRes.json()
      
      setItems(Array.isArray(willsData) ? willsData : [])
      setClients(clientsData.clients || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    if (!form.client_id || !form.recipient_name) {
      showToast('Client and recipient name are required', 'error')
      return
    }

    try {
      const res = await fetch('/api/last-will', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: form.client_id,
          description: form.description || 'Last Will Package',
          recipient_name: form.recipient_name,
          recipient_phone: form.recipient_phone,
          recipient_email: form.recipient_email,
          recipient_relation: form.recipient_relation,
          message: form.message,
          trigger: form.trigger,
          checkin_days: parseInt(form.checkin_days),
          deliver_at: form.trigger === 'specific_date' ? form.deliver_at : null
        })
      })

      if (res.ok) {
        showToast('Last Will created successfully!', 'success')
        setShowCreate(false)
        setForm({
          client_id: '', description: '', recipient_name: '', recipient_phone: '',
          recipient_email: '', recipient_relation: '', message: '', trigger: 'no_checkin',
          checkin_days: '30', deliver_at: ''
        })
        fetchData()
      } else {
        const data = await res.json()
        showToast(data.error || 'Failed to create', 'error')
      }
    } catch (error) {
      showToast('Error creating Last Will', 'error')
    }
  }

  async function handleCheckin(itemId: string) {
    try {
      const res = await fetch('/api/last-will/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: itemId })
      })

      if (res.ok) {
        showToast('Check-in recorded!', 'success')
        fetchData()
      }
    } catch (error) {
      showToast('Check-in failed', 'error')
    }
  }

  async function handleManualTrigger(itemId: string) {
    if (!confirm('Are you sure you want to trigger this Last Will delivery? This action cannot be undone.')) {
      return
    }

    try {
      const res = await fetch('/api/cron/last-will', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: itemId, trigger_reason: 'manual_admin' })
      })

      if (res.ok) {
        showToast('Last Will triggered successfully!', 'success')
        fetchData()
      }
    } catch (error) {
      showToast('Trigger failed', 'error')
    }
  }

  async function runCronManually() {
    try {
      const res = await fetch('/api/cron/last-will')
      const data = await res.json()
      showToast(`CRON: Checked ${data.checked}, Triggered ${data.triggered}`, 'success')
      fetchData()
    } catch (error) {
      showToast('CRON execution failed', 'error')
    }
  }

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000)
  }

  function getStatusBadge(item: LastWillItem) {
    if (item.status === 'delivered') {
      return <Badge variant="secondary" className="bg-gray-500">Delivered</Badge>
    }
    if (item.overdue) {
      return <Badge variant="destructive">OVERDUE - Will Trigger!</Badge>
    }
    if (item.needs_checkin) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Needs Check-in</Badge>
    }
    return <Badge className="bg-green-600">Active</Badge>
  }

  const activeItems = items.filter(i => i.status === 'active')
  const deliveredItems = items.filter(i => i.status === 'delivered')
  const overdueItems = activeItems.filter(i => i.overdue)
  const warningItems = activeItems.filter(i => i.needs_checkin && !i.overdue)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        } text-white`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Heart className="h-8 w-8 text-red-500" />
            Última Vontade (Last Will)
          </h1>
          <p className="text-gray-500">Manage client final wishes and automated delivery triggers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={runCronManually}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Run CRON Check
          </Button>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Last Will
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Last Will</DialogTitle>
              </DialogHeader>
              <CreateForm 
                form={form} 
                setForm={setForm} 
                clients={clients} 
                onSubmit={handleCreate}
                onClose={() => setShowCreate(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{activeItems.length}</p>
                <p className="text-sm text-gray-500">Active Last Wills</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={overdueItems.length > 0 ? 'border-red-500' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Skull className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">{overdueItems.length}</p>
                <p className="text-sm text-gray-500">Overdue (Will Trigger)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={warningItems.length > 0 ? 'border-yellow-500' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">{warningItems.length}</p>
                <p className="text-sm text-gray-500">Need Check-in Soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-2xl font-bold">{deliveredItems.length}</p>
                <p className="text-sm text-gray-500">Delivered</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Alert */}
      {overdueItems.length > 0 && (
        <Card className="border-red-500 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              CRITICAL: {overdueItems.length} Last Will(s) Overdue!
            </CardTitle>
            <CardDescription className="text-red-600">
              These items will be triggered on the next CRON run (daily at 9 AM)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {overdueItems.map(item => (
              <div key={item.id} className="flex justify-between items-center p-3 bg-white rounded mb-2">
                <div>
                  <span className="font-bold">{item.item_code}</span> - 
                  <span className="text-gray-600"> {item.clients?.code_name}</span>
                  <p className="text-sm text-red-600">
                    {item.days_since_checkin} days since last check-in (limit: {item.last_will_checkin_days})
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleCheckin(item.id)}>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Record Check-in
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleManualTrigger(item.id)}>
                    <Send className="h-4 w-4 mr-1" />
                    Trigger Now
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active ({activeItems.length})</TabsTrigger>
          <TabsTrigger value="delivered">Delivered ({deliveredItems.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeItems.map(item => (
            <Card key={item.id} className={item.overdue ? 'border-red-400' : item.needs_checkin ? 'border-yellow-400' : ''}>
              <CardContent className="pt-6">
                <div className="flex justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{item.item_code}</span>
                      {getStatusBadge(item)}
                    </div>
                    <p className="text-gray-600">{item.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-500">Client</p>
                        <p className="font-medium">{item.clients?.code_name || item.clients?.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Recipient</p>
                        <p className="font-medium">{item.last_will_recipient_name}</p>
                        <p className="text-sm text-gray-500">{item.last_will_recipient_relation}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Trigger Type</p>
                        <p className="font-medium capitalize">{item.last_will_trigger.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Check-in Status</p>
                        <p className={`font-medium ${item.overdue ? 'text-red-600' : item.needs_checkin ? 'text-yellow-600' : 'text-green-600'}`}>
                          {item.days_until_trigger} days remaining
                        </p>
                        <p className="text-xs text-gray-400">
                          Last: {new Date(item.last_will_last_checkin).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button size="sm" onClick={() => handleCheckin(item.id)}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Record Check-in
                    </Button>
                    <Button size="sm" variant="outline">
                      <Bell className="h-4 w-4 mr-1" />
                      Send Reminder
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleManualTrigger(item.id)}>
                      <Send className="h-4 w-4 mr-1" />
                      Manual Trigger
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {activeItems.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                No active Last Wills. Create one to get started.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="delivered" className="space-y-4">
          {deliveredItems.map(item => (
            <Card key={item.id} className="bg-gray-50">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold">{item.item_code}</span>
                    <Badge variant="secondary" className="ml-2">Delivered</Badge>
                    <p className="text-sm text-gray-500">To: {item.last_will_recipient_name}</p>
                  </div>
                  <p className="text-sm text-gray-500">
                    Triggered: {item.delivered_at ? new Date(item.delivered_at).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {deliveredItems.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                No delivered Last Wills yet.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function CreateForm({ form, setForm, clients, onSubmit, onClose }: {
  form: any
  setForm: (f: any) => void
  clients: Client[]
  onSubmit: () => void
  onClose: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>VIP Client *</Label>
          <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.code_name || c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Trigger Type</Label>
          <Select value={form.trigger} onValueChange={(v) => setForm({ ...form, trigger: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no_checkin">No Check-in (Default)</SelectItem>
              <SelectItem value="manual">Manual Only</SelectItem>
              <SelectItem value="specific_date">Specific Date</SelectItem>
              <SelectItem value="death_certificate">Death Certificate</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {form.trigger === 'no_checkin' && (
        <div>
          <Label>Check-in Period (days)</Label>
          <Select value={form.checkin_days} onValueChange={(v) => setForm({ ...form, checkin_days: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="14">14 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="60">60 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-1">
            If client doesn't check-in within this period, delivery is triggered
          </p>
        </div>
      )}

      {form.trigger === 'specific_date' && (
        <div>
          <Label>Delivery Date</Label>
          <Input 
            type="date" 
            value={form.deliver_at}
            onChange={(e) => setForm({ ...form, deliver_at: e.target.value })}
          />
        </div>
      )}

      <div>
        <Label>Description</Label>
        <Input 
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Sealed envelope with personal letter"
        />
      </div>

      <div className="border-t pt-4">
        <h4 className="font-medium mb-2">Recipient Information</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Recipient Name *</Label>
            <Input 
              value={form.recipient_name}
              onChange={(e) => setForm({ ...form, recipient_name: e.target.value })}
              placeholder="John Doe"
            />
          </div>
          <div>
            <Label>Relationship</Label>
            <Input 
              value={form.recipient_relation}
              onChange={(e) => setForm({ ...form, recipient_relation: e.target.value })}
              placeholder="Son, Wife, Friend..."
            />
          </div>
          <div>
            <Label>Phone</Label>
            <Input 
              value={form.recipient_phone}
              onChange={(e) => setForm({ ...form, recipient_phone: e.target.value })}
              placeholder="+1 555-123-4567"
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input 
              value={form.recipient_email}
              onChange={(e) => setForm({ ...form, recipient_email: e.target.value })}
              placeholder="recipient@email.com"
            />
          </div>
        </div>
      </div>

      <div>
        <Label>Message to Recipient</Label>
        <Textarea 
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder="Optional message to accompany the delivery..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={onSubmit}>
          <Heart className="h-4 w-4 mr-2" />
          Create Last Will
        </Button>
      </div>
    </div>
  )
}
