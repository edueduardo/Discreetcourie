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
  Clock, Calendar, Gift, Send, Plus, User, Phone, Mail, 
  Loader2, RefreshCw, Bell, Package, Timer, CheckCircle
} from 'lucide-react'

interface TimeCapsule {
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
  deliver_at: string
  delivered_at?: string
  status: string
  days_until_delivery?: number
  ready_for_delivery?: boolean
  delivery_soon?: boolean
  created_at: string
}

interface Client {
  id: string
  code_name: string
  name: string
}

export default function TimeCapsulePage() {
  const [capsules, setCapsules] = useState<TimeCapsule[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' })

  const [form, setForm] = useState({
    client_id: '',
    description: '',
    deliver_at: '',
    recipient_name: '',
    recipient_phone: '',
    recipient_email: '',
    recipient_relation: '',
    message: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [capsulesRes, clientsRes] = await Promise.all([
        fetch('/api/time-capsule'),
        fetch('/api/customers')
      ])
      
      const capsulesData = await capsulesRes.json()
      const clientsData = await clientsRes.json()
      
      setCapsules(Array.isArray(capsulesData) ? capsulesData : [])
      setClients(clientsData.clients || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    if (!form.client_id || !form.deliver_at) {
      showToast('Client and delivery date are required', 'error')
      return
    }

    try {
      const res = await fetch('/api/time-capsule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: form.client_id,
          description: form.description || 'Time Capsule',
          deliver_at: form.deliver_at,
          recipient_name: form.recipient_name,
          recipient_phone: form.recipient_phone,
          recipient_email: form.recipient_email,
          recipient_relation: form.recipient_relation,
          message: form.message
        })
      })

      if (res.ok) {
        showToast('Time Capsule created!', 'success')
        setShowCreate(false)
        setForm({ client_id: '', description: '', deliver_at: '', recipient_name: '', recipient_phone: '', recipient_email: '', recipient_relation: '', message: '' })
        fetchData()
      } else {
        const data = await res.json()
        showToast(data.error || 'Failed', 'error')
      }
    } catch (error) {
      showToast('Error creating Time Capsule', 'error')
    }
  }

  async function handleDeliver(id: string) {
    if (!confirm('Deliver this Time Capsule now? This action cannot be undone.')) return

    try {
      const res = await fetch('/api/cron/time-capsule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: id })
      })

      if (res.ok) {
        showToast('Time Capsule delivered!', 'success')
        fetchData()
      }
    } catch (error) {
      showToast('Delivery failed', 'error')
    }
  }

  async function runCron() {
    try {
      const res = await fetch('/api/cron/time-capsule')
      const data = await res.json()
      showToast(`CRON: Checked ${data.checked}, Delivered ${data.delivered}`, 'success')
      fetchData()
    } catch (error) {
      showToast('CRON failed', 'error')
    }
  }

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000)
  }

  const activeCapsules = capsules.filter(c => c.status === 'active')
  const deliveredCapsules = capsules.filter(c => c.status === 'delivered')
  const readyCapsules = activeCapsules.filter(c => c.ready_for_delivery)
  const soonCapsules = activeCapsules.filter(c => c.delivery_soon)

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
          {toast.message}
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Gift className="h-8 w-8 text-purple-500" />
            Cápsula do Tempo
          </h1>
          <p className="text-gray-500">Scheduled future deliveries with automatic trigger</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={runCron}>
            <RefreshCw className="h-4 w-4 mr-2" />Run CRON
          </Button>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Create Capsule</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Create Time Capsule</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Client *</Label>
                    <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                      <SelectContent>
                        {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.code_name || c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Delivery Date *</Label>
                    <Input type="date" value={form.deliver_at} onChange={(e) => setForm({ ...form, deliver_at: e.target.value })} min={new Date().toISOString().split('T')[0]} />
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Birthday gift for son" />
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Recipient</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Name</Label>
                      <Input value={form.recipient_name} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} />
                    </div>
                    <div>
                      <Label>Relationship</Label>
                      <Input value={form.recipient_relation} onChange={(e) => setForm({ ...form, recipient_relation: e.target.value })} placeholder="Son, Friend..." />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input value={form.recipient_phone} onChange={(e) => setForm({ ...form, recipient_phone: e.target.value })} />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input value={form.recipient_email} onChange={(e) => setForm({ ...form, recipient_email: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Message</Label>
                  <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Personal message..." rows={3} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                  <Button onClick={handleCreate}><Gift className="h-4 w-4 mr-2" />Create</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{activeCapsules.length}</p>
                <p className="text-sm text-gray-500">Active Capsules</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={readyCapsules.length > 0 ? 'border-green-500' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">{readyCapsules.length}</p>
                <p className="text-sm text-gray-500">Ready to Deliver</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={soonCapsules.length > 0 ? 'border-yellow-500' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">{soonCapsules.length}</p>
                <p className="text-sm text-gray-500">Delivery Soon (7 days)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-2xl font-bold">{deliveredCapsules.length}</p>
                <p className="text-sm text-gray-500">Delivered</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {readyCapsules.length > 0 && (
        <Card className="border-green-500 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-700 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              {readyCapsules.length} Capsule(s) Ready for Delivery!
            </CardTitle>
            <CardDescription className="text-green-600">These will be delivered on the next CRON run (daily at 10 AM)</CardDescription>
          </CardHeader>
          <CardContent>
            {readyCapsules.map(c => (
              <div key={c.id} className="flex justify-between items-center p-3 bg-white rounded mb-2">
                <div>
                  <span className="font-bold">{c.item_code}</span> - {c.clients?.code_name}
                  <p className="text-sm text-gray-600">To: {c.last_will_recipient_name} | Scheduled: {new Date(c.deliver_at).toLocaleDateString()}</p>
                </div>
                <Button size="sm" onClick={() => handleDeliver(c.id)}>
                  <Send className="h-4 w-4 mr-1" />Deliver Now
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active ({activeCapsules.length})</TabsTrigger>
          <TabsTrigger value="delivered">Delivered ({deliveredCapsules.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeCapsules.map(c => (
            <Card key={c.id} className={c.ready_for_delivery ? 'border-green-400' : c.delivery_soon ? 'border-yellow-400' : ''}>
              <CardContent className="pt-6">
                <div className="flex justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{c.item_code}</span>
                      {c.ready_for_delivery && <Badge className="bg-green-600">Ready</Badge>}
                      {c.delivery_soon && !c.ready_for_delivery && <Badge variant="outline" className="border-yellow-500 text-yellow-600">Soon</Badge>}
                      {!c.ready_for_delivery && !c.delivery_soon && <Badge variant="secondary">Scheduled</Badge>}
                    </div>
                    <p className="text-gray-600">{c.description}</p>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <div>
                        <p className="text-sm text-gray-500">Client</p>
                        <p className="font-medium">{c.clients?.code_name || c.clients?.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Recipient</p>
                        <p className="font-medium">{c.last_will_recipient_name || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Delivery Date</p>
                        <p className={`font-medium ${c.ready_for_delivery ? 'text-green-600' : c.delivery_soon ? 'text-yellow-600' : ''}`}>
                          {new Date(c.deliver_at).toLocaleDateString()}
                          {c.days_until_delivery !== null && c.days_until_delivery !== undefined && (
                            <span className="text-sm text-gray-500 ml-1">
                              ({c.days_until_delivery > 0 ? `${c.days_until_delivery} days` : 'Today!'})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button size="sm" variant="outline"><Bell className="h-4 w-4 mr-1" />Remind</Button>
                    <Button size="sm" onClick={() => handleDeliver(c.id)}><Send className="h-4 w-4 mr-1" />Deliver</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {activeCapsules.length === 0 && (
            <Card><CardContent className="pt-6 text-center text-gray-500">No active Time Capsules.</CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="delivered" className="space-y-4">
          {deliveredCapsules.map(c => (
            <Card key={c.id} className="bg-gray-50">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold">{c.item_code}</span>
                    <Badge variant="secondary" className="ml-2">Delivered</Badge>
                    <p className="text-sm text-gray-500">To: {c.last_will_recipient_name}</p>
                  </div>
                  <p className="text-sm text-gray-500">
                    Delivered: {c.delivered_at ? new Date(c.delivered_at).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
          {deliveredCapsules.length === 0 && (
            <Card><CardContent className="pt-6 text-center text-gray-500">No delivered capsules yet.</CardContent></Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
