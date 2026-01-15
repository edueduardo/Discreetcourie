'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Flame, Plus, Loader2, RefreshCw, AlertTriangle, CheckCircle,
  Clock, MapPin, Package, User, Phone, Shield
} from 'lucide-react'

interface PhoenixOperation {
  id: string
  operation_code: string
  client_id: string
  operation_type: string
  situation_description: string
  urgency_level: string
  timeline: string
  status: string
  phase: string
  items_retrieved: boolean
  destination_confirmed: boolean
  created_at: string
  clients?: { id: string; code_name: string; name: string; phone: string }
  phoenix_logs?: { id: string; phase: string; action: string; created_at: string }[]
}

interface Client {
  id: string
  code_name: string
  name: string
  phone: string
}

const OPERATION_TYPES = [
  { value: 'escape_abuse', label: '🆘 Escape from Abuse', desc: 'Leave abusive situation safely' },
  { value: 'start_fresh', label: '🌅 Start Fresh', desc: 'Begin a new life chapter' },
  { value: 'temporary_disappear', label: '👻 Temporary Disappear', desc: 'Lay low for a while' },
  { value: 'crisis_exit', label: '🚨 Crisis Exit', desc: 'Emergency exit from crisis' }
]

const PHASES = ['planning', 'preparation', 'retrieval', 'transport', 'settlement', 'completed']

export default function PhoenixPage() {
  const [operations, setOperations] = useState<PhoenixOperation[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' })

  const [form, setForm] = useState({
    client_id: '',
    operation_type: '',
    situation_description: '',
    urgency_level: 'normal',
    timeline: '',
    safe_contact_method: '',
    safe_contact_info: '',
    special_requirements: '',
    notes: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [opsRes, clientsRes] = await Promise.all([
        fetch('/api/phoenix'),
        fetch('/api/customers')
      ])
      
      const opsData = await opsRes.json()
      const clientsData = await clientsRes.json()
      
      setOperations(Array.isArray(opsData) ? opsData : [])
      setClients(clientsData.clients || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function createOperation() {
    if (!form.client_id || !form.operation_type) {
      showToast('Client and operation type required', 'error')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/phoenix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      if (res.ok) {
        showToast('Phoenix operation initiated!', 'success')
        setShowNew(false)
        setForm({ client_id: '', operation_type: '', situation_description: '', urgency_level: 'normal', timeline: '', safe_contact_method: '', safe_contact_info: '', special_requirements: '', notes: '' })
        fetchData()
      } else {
        showToast('Failed to create operation', 'error')
      }
    } catch (error) {
      showToast('Error creating operation', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function updateOperation(id: string, updates: Record<string, any>) {
    try {
      const res = await fetch('/api/phoenix', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      })

      if (res.ok) {
        showToast('Operation updated!', 'success')
        fetchData()
      }
    } catch (error) {
      showToast('Error updating operation', 'error')
    }
  }

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000)
  }

  function getUrgencyBadge(level: string) {
    switch (level) {
      case 'critical': return <Badge className="bg-red-600 animate-pulse">🔴 CRITICAL</Badge>
      case 'high': return <Badge className="bg-orange-600">🟠 HIGH</Badge>
      case 'normal': return <Badge className="bg-blue-600">🔵 NORMAL</Badge>
      case 'low': return <Badge variant="secondary">⚪ LOW</Badge>
      default: return <Badge variant="outline">{level}</Badge>
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'completed': return <Badge className="bg-green-600">✅ Completed</Badge>
      case 'in_progress': return <Badge className="bg-blue-600">🔄 In Progress</Badge>
      case 'executing': return <Badge className="bg-purple-600">⚡ Executing</Badge>
      case 'cancelled': return <Badge variant="destructive">❌ Cancelled</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const activeOps = operations.filter(o => !['completed', 'cancelled'].includes(o.status))
  const criticalOps = operations.filter(o => o.urgency_level === 'critical' && o.status !== 'completed')

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
            <Flame className="h-8 w-8 text-orange-500" />
            Operação Fênix
          </h1>
          <p className="text-gray-500">Help clients rise from difficult situations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
          <Dialog open={showNew} onOpenChange={setShowNew}>
            <DialogTrigger asChild>
              <Button className="bg-orange-600 hover:bg-orange-700"><Plus className="h-4 w-4 mr-2" />New Operation</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>🔥 Initiate Phoenix Operation</DialogTitle></DialogHeader>
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
                  <Label>Operation Type *</Label>
                  <Select value={form.operation_type} onValueChange={(v) => setForm({ ...form, operation_type: v })}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {OPERATION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Urgency Level</Label>
                  <Select value={form.urgency_level} onValueChange={(v) => setForm({ ...form, urgency_level: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">⚪ Low</SelectItem>
                      <SelectItem value="normal">🔵 Normal</SelectItem>
                      <SelectItem value="high">🟠 High</SelectItem>
                      <SelectItem value="critical">🔴 Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Timeline</Label>
                  <Input value={form.timeline} onChange={(e) => setForm({ ...form, timeline: e.target.value })} placeholder="e.g., Within 48 hours" />
                </div>
                <div className="col-span-2">
                  <Label>Situation Description</Label>
                  <Textarea value={form.situation_description} onChange={(e) => setForm({ ...form, situation_description: e.target.value })} rows={3} placeholder="Describe the situation..." />
                </div>
                <div>
                  <Label>Safe Contact Method</Label>
                  <Input value={form.safe_contact_method} onChange={(e) => setForm({ ...form, safe_contact_method: e.target.value })} placeholder="e.g., Signal, burner phone" />
                </div>
                <div>
                  <Label>Safe Contact Info</Label>
                  <Input value={form.safe_contact_info} onChange={(e) => setForm({ ...form, safe_contact_info: e.target.value })} placeholder="Contact details" />
                </div>
                <div className="col-span-2">
                  <Label>Special Requirements</Label>
                  <Textarea value={form.special_requirements} onChange={(e) => setForm({ ...form, special_requirements: e.target.value })} rows={2} placeholder="Any special needs..." />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
                <Button onClick={createOperation} disabled={saving} className="bg-orange-600">
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Flame className="h-4 w-4 mr-2" />}
                  Initiate Operation
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Critical Alert */}
      {criticalOps.length > 0 && (
        <Card className="border-red-500 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5 animate-pulse" />
              <span className="font-bold">{criticalOps.length} CRITICAL OPERATION(S) REQUIRE IMMEDIATE ATTENTION</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-2"><Flame className="h-5 w-5 text-orange-500" /><div><p className="text-2xl font-bold">{operations.length}</p><p className="text-sm text-gray-500">Total Operations</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-2"><Clock className="h-5 w-5 text-blue-500" /><div><p className="text-2xl font-bold">{activeOps.length}</p><p className="text-sm text-gray-500">Active</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-500" /><div><p className="text-2xl font-bold">{criticalOps.length}</p><p className="text-sm text-gray-500">Critical</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /><div><p className="text-2xl font-bold">{operations.filter(o => o.status === 'completed').length}</p><p className="text-sm text-gray-500">Completed</p></div></div></CardContent></Card>
      </div>

      {/* Operations List */}
      <Card>
        <CardHeader><CardTitle>Operations</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {operations.map(op => (
              <Card key={op.id} className={`p-4 ${op.urgency_level === 'critical' ? 'border-red-500 bg-red-50' : ''}`}>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">{op.operation_code}</Badge>
                      {getUrgencyBadge(op.urgency_level)}
                      {getStatusBadge(op.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span><User className="h-3 w-3 inline mr-1" />{op.clients?.code_name || op.clients?.name || 'Unknown'}</span>
                      <span className="text-gray-500">{OPERATION_TYPES.find(t => t.value === op.operation_type)?.label}</span>
                    </div>
                    {op.situation_description && (
                      <p className="text-sm text-gray-600 max-w-xl">{op.situation_description}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>Phase: <Badge variant="outline" className="text-xs">{op.phase}</Badge></span>
                      {op.items_retrieved && <Badge className="bg-green-100 text-green-800 text-xs">Items Retrieved</Badge>}
                      {op.destination_confirmed && <Badge className="bg-blue-100 text-blue-800 text-xs">Destination Confirmed</Badge>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-xs text-gray-500">{new Date(op.created_at).toLocaleDateString()}</p>
                    {op.status !== 'completed' && (
                      <div className="flex gap-1">
                        <Select value={op.phase} onValueChange={(v) => updateOperation(op.id, { phase: v, action_notes: `Phase changed to ${v}` })}>
                          <SelectTrigger className="h-8 text-xs w-32"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {PHASES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button size="sm" variant="outline" onClick={() => updateOperation(op.id, { status: 'completed', phase: 'completed' })}>
                          <CheckCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
            {operations.length === 0 && (
              <div className="text-center text-gray-500 py-8">No Phoenix operations yet.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
