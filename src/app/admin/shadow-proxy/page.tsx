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
  UserCheck, Plus, Loader2, RefreshCw, CheckCircle, XCircle,
  Clock, User, MessageSquare, Package, AlertTriangle
} from 'lucide-react'

interface ShadowMission {
  id: string
  mission_code: string
  client_id: string
  proxy_type: string
  target_name: string
  target_relation: string
  mission_description: string
  desired_outcome: string
  status: string
  outcome_achieved: boolean
  items_returned: boolean
  price_quoted: number
  created_at: string
  clients?: { id: string; code_name: string; name: string }
}

interface Client {
  id: string
  code_name: string
  name: string
  phone: string
}

const PROXY_TYPES = [
  { value: 'return_items', label: '📦 Return Items', desc: 'Return gifts or belongings' },
  { value: 'pick_up_items', label: '🎒 Pick Up Items', desc: 'Retrieve belongings from someone' },
  { value: 'deliver_message', label: '💬 Deliver Message', desc: 'Deliver a message in person' },
  { value: 'make_complaint', label: '📢 Make Complaint', desc: 'File complaint on behalf of client' },
  { value: 'confrontation', label: '⚡ Confrontation', desc: 'Handle difficult conversation' },
  { value: 'negotiation', label: '🤝 Negotiation', desc: 'Negotiate on client behalf' }
]

export default function ShadowProxyPage() {
  const [missions, setMissions] = useState<ShadowMission[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' })

  const [form, setForm] = useState({
    client_id: '',
    proxy_type: '',
    target_name: '',
    target_phone: '',
    target_address: '',
    target_relation: '',
    mission_description: '',
    talking_points: '',
    desired_outcome: '',
    boundaries: '',
    client_script: '',
    price_quoted: '',
    notes: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [missionsRes, clientsRes] = await Promise.all([
        fetch('/api/shadow-proxy'),
        fetch('/api/customers')
      ])
      
      const missionsData = await missionsRes.json()
      const clientsData = await clientsRes.json()
      
      setMissions(Array.isArray(missionsData) ? missionsData : [])
      setClients(clientsData.clients || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function createMission() {
    if (!form.client_id || !form.proxy_type || !form.mission_description) {
      showToast('Client, type, and description required', 'error')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/shadow-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price_quoted: form.price_quoted ? parseFloat(form.price_quoted) : null,
          talking_points: form.talking_points ? form.talking_points.split('\n').filter(Boolean) : null
        })
      })

      if (res.ok) {
        showToast('Shadow proxy mission created!', 'success')
        setShowNew(false)
        setForm({ client_id: '', proxy_type: '', target_name: '', target_phone: '', target_address: '', target_relation: '', mission_description: '', talking_points: '', desired_outcome: '', boundaries: '', client_script: '', price_quoted: '', notes: '' })
        fetchData()
      } else {
        showToast('Failed to create mission', 'error')
      }
    } catch (error) {
      showToast('Error creating mission', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function updateMission(id: string, updates: Record<string, any>) {
    try {
      const res = await fetch('/api/shadow-proxy', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      })

      if (res.ok) {
        showToast('Mission updated!', 'success')
        fetchData()
      }
    } catch (error) {
      showToast('Error updating mission', 'error')
    }
  }

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000)
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'completed': return <Badge className="bg-green-600">✅ Completed</Badge>
      case 'in_progress': return <Badge className="bg-blue-600">🔄 In Progress</Badge>
      case 'accepted': return <Badge className="bg-purple-600">👍 Accepted</Badge>
      case 'failed': return <Badge variant="destructive">❌ Failed</Badge>
      case 'cancelled': return <Badge variant="secondary">🚫 Cancelled</Badge>
      default: return <Badge variant="outline">⏳ Pending</Badge>
    }
  }

  const activeMissions = missions.filter(m => !['completed', 'failed', 'cancelled'].includes(m.status))
  const completedMissions = missions.filter(m => m.status === 'completed')

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
            <UserCheck className="h-8 w-8 text-purple-500" />
            Procurador de Sombras
          </h1>
          <p className="text-gray-500">Act, speak, and represent on behalf of clients</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
          <Dialog open={showNew} onOpenChange={setShowNew}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700"><Plus className="h-4 w-4 mr-2" />New Mission</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>🕵️ Create Shadow Proxy Mission</DialogTitle></DialogHeader>
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
                  <Label>Mission Type *</Label>
                  <Select value={form.proxy_type} onValueChange={(v) => setForm({ ...form, proxy_type: v })}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {PROXY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Target Name</Label>
                  <Input value={form.target_name} onChange={(e) => setForm({ ...form, target_name: e.target.value })} placeholder="Who to interact with" />
                </div>
                <div>
                  <Label>Target Relation</Label>
                  <Select value={form.target_relation} onValueChange={(v) => setForm({ ...form, target_relation: v })}>
                    <SelectTrigger><SelectValue placeholder="Relationship" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ex">Ex-partner</SelectItem>
                      <SelectItem value="family">Family</SelectItem>
                      <SelectItem value="friend">Friend</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="neighbor">Neighbor</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Target Phone</Label>
                  <Input value={form.target_phone} onChange={(e) => setForm({ ...form, target_phone: e.target.value })} placeholder="Contact number" />
                </div>
                <div>
                  <Label>Price Quoted ($)</Label>
                  <Input type="number" value={form.price_quoted} onChange={(e) => setForm({ ...form, price_quoted: e.target.value })} placeholder="150" />
                </div>
                <div className="col-span-2">
                  <Label>Target Address</Label>
                  <Input value={form.target_address} onChange={(e) => setForm({ ...form, target_address: e.target.value })} placeholder="Where to go" />
                </div>
                <div className="col-span-2">
                  <Label>Mission Description *</Label>
                  <Textarea value={form.mission_description} onChange={(e) => setForm({ ...form, mission_description: e.target.value })} rows={3} placeholder="What needs to be done..." />
                </div>
                <div className="col-span-2">
                  <Label>Desired Outcome</Label>
                  <Input value={form.desired_outcome} onChange={(e) => setForm({ ...form, desired_outcome: e.target.value })} placeholder="What success looks like" />
                </div>
                <div>
                  <Label>Talking Points (one per line)</Label>
                  <Textarea value={form.talking_points} onChange={(e) => setForm({ ...form, talking_points: e.target.value })} rows={3} placeholder="Key things to say..." />
                </div>
                <div>
                  <Label>Boundaries (what NOT to do)</Label>
                  <Textarea value={form.boundaries} onChange={(e) => setForm({ ...form, boundaries: e.target.value })} rows={3} placeholder="Don't say X, Don't do Y..." />
                </div>
                <div className="col-span-2">
                  <Label>Client Script (exact words to use)</Label>
                  <Textarea value={form.client_script} onChange={(e) => setForm({ ...form, client_script: e.target.value })} rows={2} placeholder="Optional: specific phrases client wants you to say" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
                <Button onClick={createMission} disabled={saving} className="bg-purple-600">
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserCheck className="h-4 w-4 mr-2" />}
                  Create Mission
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-2"><UserCheck className="h-5 w-5 text-purple-500" /><div><p className="text-2xl font-bold">{missions.length}</p><p className="text-sm text-gray-500">Total Missions</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-2"><Clock className="h-5 w-5 text-blue-500" /><div><p className="text-2xl font-bold">{activeMissions.length}</p><p className="text-sm text-gray-500">Active</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /><div><p className="text-2xl font-bold">{completedMissions.length}</p><p className="text-sm text-gray-500">Completed</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-2"><Package className="h-5 w-5 text-orange-500" /><div><p className="text-2xl font-bold">{missions.filter(m => m.items_returned).length}</p><p className="text-sm text-gray-500">Items Returned</p></div></div></CardContent></Card>
      </div>

      {/* Missions List */}
      <Card>
        <CardHeader><CardTitle>Missions</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {missions.map(mission => (
              <Card key={mission.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">{mission.mission_code}</Badge>
                      {getStatusBadge(mission.status)}
                      <Badge variant="secondary">{PROXY_TYPES.find(t => t.value === mission.proxy_type)?.label}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span><User className="h-3 w-3 inline mr-1" />{mission.clients?.code_name || mission.clients?.name || 'Unknown'}</span>
                      {mission.target_name && <span className="text-gray-500">→ {mission.target_name} ({mission.target_relation})</span>}
                    </div>
                    <p className="text-sm text-gray-600 max-w-xl">{mission.mission_description}</p>
                    {mission.desired_outcome && (
                      <p className="text-xs text-gray-500">Goal: {mission.desired_outcome}</p>
                    )}
                    <div className="flex items-center gap-2">
                      {mission.outcome_achieved && <Badge className="bg-green-100 text-green-800 text-xs">✅ Outcome Achieved</Badge>}
                      {mission.items_returned && <Badge className="bg-blue-100 text-blue-800 text-xs">📦 Items Returned</Badge>}
                      {mission.price_quoted && <Badge variant="outline" className="text-xs">${mission.price_quoted}</Badge>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-xs text-gray-500">{new Date(mission.created_at).toLocaleDateString()}</p>
                    {mission.status !== 'completed' && mission.status !== 'cancelled' && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => updateMission(mission.id, { status: 'in_progress' })}>
                          Start
                        </Button>
                        <Button size="sm" className="bg-green-600" onClick={() => updateMission(mission.id, { status: 'completed', outcome_achieved: true })}>
                          <CheckCircle className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => updateMission(mission.id, { status: 'failed' })}>
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
            {missions.length === 0 && (
              <div className="text-center text-gray-500 py-8">No shadow proxy missions yet.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
