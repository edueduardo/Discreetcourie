'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Ghost, Clock, Trash2, Send, Plus, MessageSquare, 
  Loader2, RefreshCw, Timer, AlertTriangle, Shield
} from 'lucide-react'

interface GhostMessage {
  id: string
  client_id: string
  clients?: { id: string; code_name: string; name: string }
  content_encrypted: string
  direction: string
  self_destruct: boolean
  destruct_at?: string
  destruct_after_read?: boolean
  destruct_minutes_after_read?: number
  read_at?: string
  status: string
  created_at: string
  time_remaining?: string
  expired?: boolean
}

interface Client {
  id: string
  code_name: string
  name: string
}

export default function GhostMessagesPage() {
  const [messages, setMessages] = useState<GhostMessage[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' })

  const [form, setForm] = useState({
    client_id: '',
    content: '',
    direction: 'outbound',
    self_destruct: true,
    destruct_hours: '24',
    destruct_after_read: false,
    destruct_minutes: '5'
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [messagesRes, clientsRes] = await Promise.all([
        fetch('/api/messages/ghost'),
        fetch('/api/customers')
      ])
      
      let messagesData: GhostMessage[] = []
      if (messagesRes.ok) {
        messagesData = await messagesRes.json()
      }
      const clientsData = await clientsRes.json()
      
      // Calcular tempo restante para cada mensagem
      const now = Date.now()
      messagesData = messagesData.map(m => {
        if (m.destruct_at) {
          const destructTime = new Date(m.destruct_at).getTime()
          const remaining = destructTime - now
          const expired = remaining <= 0
          const hours = Math.floor(remaining / (1000 * 60 * 60))
          const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
          return {
            ...m,
            expired,
            time_remaining: expired ? 'EXPIRED' : `${hours}h ${minutes}m`
          }
        }
        return m
      })
      
      setMessages(messagesData)
      setClients(clientsData.clients || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    if (!form.client_id || !form.content) {
      showToast('Client and content are required', 'error')
      return
    }

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: form.client_id,
          content: form.content,
          direction: form.direction,
          self_destruct: form.self_destruct,
          destruct_after_hours: parseInt(form.destruct_hours)
        })
      })

      if (res.ok) {
        showToast('Ghost message sent!', 'success')
        setShowCreate(false)
        setForm({ client_id: '', content: '', direction: 'outbound', self_destruct: true, destruct_hours: '24', destruct_after_read: false, destruct_minutes: '5' })
        fetchData()
      } else {
        const data = await res.json()
        showToast(data.error || 'Failed', 'error')
      }
    } catch (error) {
      showToast('Error sending message', 'error')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this message immediately? This cannot be undone.')) return

    try {
      const res = await fetch('/api/cron/auto-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'message', id })
      })

      if (res.ok) {
        showToast('Message destroyed!', 'success')
        fetchData()
      }
    } catch (error) {
      showToast('Delete failed', 'error')
    }
  }

  async function runCron() {
    try {
      const res = await fetch('/api/cron/auto-delete')
      const data = await res.json()
      showToast(`CRON: Deleted ${data.messages_deleted} messages, ${data.vault_items_deleted} vault items`, 'success')
      fetchData()
    } catch (error) {
      showToast('CRON failed', 'error')
    }
  }

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000)
  }

  const activeMessages = messages.filter(m => !m.expired && m.status === 'sent')
  const expiredMessages = messages.filter(m => m.expired)

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
            <Ghost className="h-8 w-8 text-indigo-500" />
            Comunicação Fantasma
          </h1>
          <p className="text-gray-500">Self-destructing encrypted messages with automatic cleanup</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={runCron}>
            <RefreshCw className="h-4 w-4 mr-2" />Run Cleanup
          </Button>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />New Ghost Message</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Send Ghost Message</DialogTitle></DialogHeader>
              <div className="space-y-4">
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
                  <Label>Direction</Label>
                  <Select value={form.direction} onValueChange={(v) => setForm({ ...form, direction: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="outbound">To Client</SelectItem>
                      <SelectItem value="inbound">From Client</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Message *</Label>
                  <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Your encrypted message..." rows={4} />
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Timer className="h-4 w-4" /> Self-Destruct Settings
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Auto-destruct after</Label>
                      <Select value={form.destruct_hours} onValueChange={(v) => setForm({ ...form, destruct_hours: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 hour</SelectItem>
                          <SelectItem value="6">6 hours</SelectItem>
                          <SelectItem value="12">12 hours</SelectItem>
                          <SelectItem value="24">24 hours</SelectItem>
                          <SelectItem value="48">48 hours</SelectItem>
                          <SelectItem value="72">72 hours</SelectItem>
                          <SelectItem value="168">1 week</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                  <Button onClick={handleCreate}><Ghost className="h-4 w-4 mr-2" />Send</Button>
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
              <MessageSquare className="h-5 w-5 text-indigo-500" />
              <div>
                <p className="text-2xl font-bold">{activeMessages.length}</p>
                <p className="text-sm text-gray-500">Active Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={expiredMessages.length > 0 ? 'border-red-500' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">{expiredMessages.length}</p>
                <p className="text-sm text-gray-500">Expired (Pending Delete)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{messages.filter(m => m.self_destruct).length}</p>
                <p className="text-sm text-gray-500">Self-Destruct Enabled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-2xl font-bold">6h</p>
                <p className="text-sm text-gray-500">CRON Interval</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {expiredMessages.length > 0 && (
        <Card className="border-red-500 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {expiredMessages.length} Message(s) Ready for Destruction
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expiredMessages.slice(0, 5).map(m => (
              <div key={m.id} className="flex justify-between items-center p-3 bg-white rounded mb-2">
                <div>
                  <span className="font-bold">{m.clients?.code_name || 'Unknown'}</span>
                  <p className="text-sm text-gray-600 truncate max-w-md">{m.content_encrypted?.substring(0, 50)}...</p>
                </div>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(m.id)}>
                  <Trash2 className="h-4 w-4 mr-1" />Delete Now
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active ({activeMessages.length})</TabsTrigger>
          <TabsTrigger value="all">All Messages ({messages.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeMessages.map(m => (
            <Card key={m.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Ghost className="h-5 w-5 text-indigo-500" />
                      <span className="font-bold">{m.clients?.code_name || 'Unknown Client'}</span>
                      <Badge variant={m.direction === 'outbound' ? 'default' : 'secondary'}>
                        {m.direction === 'outbound' ? 'To Client' : 'From Client'}
                      </Badge>
                      {m.self_destruct && (
                        <Badge variant="outline" className="border-orange-500 text-orange-600">
                          <Timer className="h-3 w-3 mr-1" />{m.time_remaining}
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-600 max-w-2xl">{m.content_encrypted}</p>
                    <p className="text-xs text-gray-400">
                      Sent: {new Date(m.created_at).toLocaleString()}
                      {m.destruct_at && ` • Expires: ${new Date(m.destruct_at).toLocaleString()}`}
                    </p>
                  </div>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(m.id)}>
                    <Trash2 className="h-4 w-4 mr-1" />Destroy
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {activeMessages.length === 0 && (
            <Card><CardContent className="pt-6 text-center text-gray-500">No active ghost messages.</CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {messages.map(m => (
            <Card key={m.id} className={m.expired ? 'bg-gray-50 opacity-60' : ''}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold">{m.clients?.code_name}</span>
                    <Badge variant="secondary" className="ml-2">{m.direction}</Badge>
                    {m.expired && <Badge variant="destructive" className="ml-2">EXPIRED</Badge>}
                    <p className="text-sm text-gray-600 truncate max-w-lg">{m.content_encrypted}</p>
                  </div>
                  <p className="text-sm text-gray-500">{new Date(m.created_at).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
