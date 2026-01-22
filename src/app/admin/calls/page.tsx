'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { 
  Phone, PhoneCall, PhoneIncoming, PhoneOutgoing, Clock,
  Loader2, RefreshCw, User, CheckCircle, XCircle, Play
} from 'lucide-react'

interface BlandCall {
  id: string
  call_id: string
  phone_number: string
  direction: string
  status: string
  duration?: number
  transcript?: string
  summary?: string
  service_type?: string
  client_id?: string
  clients?: { id: string; code_name: string; name: string }
  created_at: string
}

interface Client {
  id: string
  code_name: string
  name: string
  phone: string
}

export default function CallsPage() {
  const [calls, setCalls] = useState<BlandCall[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewCall, setShowNewCall] = useState(false)
  const [calling, setCalling] = useState(false)
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' })

  const [form, setForm] = useState({
    client_id: '',
    phone_number: '',
    call_type: 'delivery_update',
    custom_message: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [callsRes, clientsRes] = await Promise.all([
        fetch('/api/bland'),
        fetch('/api/customers')
      ])
      
      const callsData = await callsRes.json()
      const clientsData = await clientsRes.json()
      
      setCalls(Array.isArray(callsData) ? callsData : [])
      setClients(clientsData.clients || [])
    } catch (error) {

    } finally {
      setLoading(false)
    }
  }

  async function initiateCall() {
    if (!form.phone_number && !form.client_id) {
      showToast('Phone number or client required', 'error')
      return
    }

    setCalling(true)
    try {
      const selectedClient = clients.find(c => c.id === form.client_id)
      const phoneNumber = form.phone_number || selectedClient?.phone

      const res = await fetch('/api/bland', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: phoneNumber,
          client_id: form.client_id || null,
          call_type: form.call_type,
          custom_message: form.custom_message
        })
      })

      const data = await res.json()
      
      if (res.ok) {
        showToast(data.simulated ? 'Call simulated (API key not configured)' : `Call initiated: ${data.call_id}`, 'success')
        setShowNewCall(false)
        setForm({ client_id: '', phone_number: '', call_type: 'delivery_update', custom_message: '' })
        fetchData()
      } else {
        showToast(data.error || 'Failed to initiate call', 'error')
      }
    } catch (error) {
      showToast('Error initiating call', 'error')
    } finally {
      setCalling(false)
    }
  }

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000)
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'completed': return <Badge className="bg-green-600">Completed</Badge>
      case 'initiated': return <Badge className="bg-blue-600">In Progress</Badge>
      case 'failed': return <Badge variant="destructive">Failed</Badge>
      case 'simulated': return <Badge variant="secondary">Simulated</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const inboundCalls = calls.filter(c => c.direction === 'inbound')
  const outboundCalls = calls.filter(c => c.direction === 'outbound')
  const completedCalls = calls.filter(c => c.status === 'completed')

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
            <Phone className="h-8 w-8 text-blue-500" />
            Bland.AI Phone Integration
          </h1>
          <p className="text-gray-500">AI-powered voice calls for deliveries and check-ins</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />Refresh
          </Button>
          <Dialog open={showNewCall} onOpenChange={setShowNewCall}>
            <DialogTrigger asChild>
              <Button><PhoneCall className="h-4 w-4 mr-2" />New Call</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Initiate AI Call</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Select Client (optional)</Label>
                  <Select value={form.client_id} onValueChange={(v) => {
                    setForm({ ...form, client_id: v })
                    const client = clients.find(c => c.id === v)
                    if (client?.phone) setForm(f => ({ ...f, client_id: v, phone_number: client.phone }))
                  }}>
                    <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                    <SelectContent>
                      {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.code_name || c.name} - {c.phone}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Phone Number *</Label>
                  <Input value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} placeholder="+1 555-123-4567" />
                </div>
                <div>
                  <Label>Call Type</Label>
                  <Select value={form.call_type} onValueChange={(v) => setForm({ ...form, call_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="delivery_update">Delivery Update</SelectItem>
                      <SelectItem value="checkin">Safety Check-in</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                      <SelectItem value="custom">Custom Message</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Custom Message (optional)</Label>
                  <Textarea value={form.custom_message} onChange={(e) => setForm({ ...form, custom_message: e.target.value })} placeholder="Additional instructions for the AI..." rows={3} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowNewCall(false)}>Cancel</Button>
                  <Button onClick={initiateCall} disabled={calling}>
                    {calling ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                    {calling ? 'Calling...' : 'Start Call'}
                  </Button>
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
              <Phone className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{calls.length}</p>
                <p className="text-sm text-gray-500">Total Calls</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <PhoneIncoming className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{inboundCalls.length}</p>
                <p className="text-sm text-gray-500">Inbound</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <PhoneOutgoing className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{outboundCalls.length}</p>
                <p className="text-sm text-gray-500">Outbound</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-2xl font-bold">{completedCalls.length}</p>
                <p className="text-sm text-gray-500">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Call History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {calls.map(call => (
              <Card key={call.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {call.direction === 'inbound' ? 
                        <PhoneIncoming className="h-4 w-4 text-green-500" /> : 
                        <PhoneOutgoing className="h-4 w-4 text-purple-500" />
                      }
                      <span className="font-bold">{call.phone_number}</span>
                      {getStatusBadge(call.status)}
                      {call.service_type && <Badge variant="outline">{call.service_type}</Badge>}
                    </div>
                    {call.clients && (
                      <p className="text-sm text-gray-600">
                        <User className="h-3 w-3 inline mr-1" />
                        {call.clients.code_name || call.clients.name}
                      </p>
                    )}
                    {call.summary && (
                      <p className="text-sm text-gray-500 max-w-xl">{call.summary}</p>
                    )}
                    {call.duration && (
                      <p className="text-xs text-gray-400">
                        <Clock className="h-3 w-3 inline mr-1" />
                        Duration: {Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}
                      </p>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(call.created_at).toLocaleString()}
                  </div>
                </div>
              </Card>
            ))}
            {calls.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No calls yet. Configure BLAND_API_KEY to enable AI calls.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
