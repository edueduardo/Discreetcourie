'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  MessageSquare,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Trash2,
  Copy,
  Users,
  Bell,
  Settings,
  AlertCircle,
  Phone,
  Loader2
} from 'lucide-react'

interface SMSMessage {
  id: string
  to: string
  clientName: string
  message: string
  status: 'delivered' | 'sent' | 'failed' | 'queued'
  timestamp: string
  type: 'delivery_update' | 'reminder' | 'confirmation' | 'custom'
}

interface SMSTemplate {
  id: string
  name: string
  content: string
  variables: string[]
  category: string
}

const statusColors = {
  delivered: 'bg-green-500',
  sent: 'bg-blue-500',
  failed: 'bg-red-500',
  queued: 'bg-yellow-500'
}

const statusIcons = {
  delivered: CheckCircle,
  sent: Send,
  failed: XCircle,
  queued: Clock
}

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [twilioConfigured, setTwilioConfigured] = useState(true)
  const [messages, setMessages] = useState<SMSMessage[]>([])
  const [toast, setToast] = useState<{type: 'success' | 'error' | 'warning'; message: string} | null>(null)

  useEffect(() => {
    async function fetchMessages() {
      try {
        const res = await fetch('/api/sms')
        const data = await res.json()
        
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages.map((m: any, i: number) => ({
            id: m.id || `msg_${i}`,
            to: m.recipient || 'Unknown',
            clientName: m.sender_type === 'admin' ? 'Admin' : 'Client',
            message: m.content || '',
            status: 'delivered',
            timestamp: m.created_at || new Date().toISOString(),
            type: 'custom'
          })))
        }
      } catch (error) {

      } finally {
        setLoading(false)
      }
    }
    fetchMessages()
  }, [])

  const [templates, setTemplates] = useState<SMSTemplate[]>([
    { id: '1', name: 'Delivery En Route', content: 'Your delivery is on the way! ETA: {{eta}} minutes. Track: {{tracking_link}}', variables: ['eta', 'tracking_link'], category: 'Delivery' },
    { id: '2', name: 'Delivery Completed', content: 'Your package has been delivered to {{address}}. Thank you for choosing Discreet Courier!', variables: ['address'], category: 'Delivery' },
    { id: '3', name: 'Pickup Reminder', content: 'Reminder: Your scheduled pickup is {{date}} at {{time}}. Reply CONFIRM to confirm.', variables: ['date', 'time'], category: 'Reminder' },
    { id: '4', name: 'Payment Received', content: 'Payment of ${{amount}} received. Thank you! Invoice: {{invoice_id}}', variables: ['amount', 'invoice_id'], category: 'Billing' },
  ])

  const [newMessage, setNewMessage] = useState({ phone: '', message: '' })
  const [editingTemplate, setEditingTemplate] = useState<SMSTemplate | null>(null)
  const [showNewTemplate, setShowNewTemplate] = useState(false)
  const [newTemplate, setNewTemplate] = useState({ name: '', content: '', category: 'Delivery' })

  const sendMessage = async () => {
    if (!newMessage.phone || !newMessage.message) return
    setSending(true)
    
    try {
      const res = await fetch('/api/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: newMessage.phone,
          message: newMessage.message
        })
      })
      
      const data = await res.json()
      
      if (data.configured === false) {
        setTwilioConfigured(false)
        setToast({type: 'warning', message: 'Twilio not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to .env'})
      } else if (data.success) {
        setToast({type: 'success', message: `SMS sent successfully to ${newMessage.phone}!`})
        // Add to messages list
        setMessages(prev => [{
          id: data.messageId || `msg_${Date.now()}`,
          to: newMessage.phone,
          clientName: 'Admin',
          message: newMessage.message,
          status: 'sent',
          timestamp: new Date().toISOString(),
          type: 'custom'
        }, ...prev])
        setNewMessage({ phone: '', message: '' })
      } else {
        setToast({type: 'error', message: `Failed to send SMS: ${data.message || 'Unknown error'}`})
      }
      setTimeout(() => setToast(null), 5000)
    } catch (error) {

      setToast({type: 'error', message: 'Error sending SMS. Check console for details.'})
      setTimeout(() => setToast(null), 5000)
    } finally {
      setSending(false)
    }
  }

  const copyTemplate = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const deleteTemplate = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id))
  }

  const saveNewTemplate = () => {
    if (!newTemplate.name || !newTemplate.content) return
    const variables = newTemplate.content.match(/\{\{(\w+)\}\}/g)?.map(v => v.replace(/\{\{|\}\}/g, '')) || []
    setTemplates([...templates, {
      id: Date.now().toString(),
      ...newTemplate,
      variables
    }])
    setNewTemplate({ name: '', content: '', category: 'Delivery' })
    setShowNewTemplate(false)
  }

  const deliveredCount = messages.filter(m => m.status === 'delivered').length
  const failedCount = messages.filter(m => m.status === 'failed').length

  return (
    <div className="p-6 space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 ${
          toast.type === 'success' ? 'bg-green-600 text-white' :
          toast.type === 'error' ? 'bg-red-600 text-white' :
          'bg-yellow-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="h-5 w-5" /> :
           toast.type === 'error' ? <XCircle className="h-5 w-5" /> :
           <AlertCircle className="h-5 w-5" />}
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">SMS Notifications</h1>
          <p className="text-slate-400">Twilio integration for delivery updates</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-600">
            <Settings className="h-4 w-4 mr-2" />
            Twilio Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Send className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Sent Today</p>
                <p className="text-2xl font-bold text-white">{messages.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Delivered</p>
                <p className="text-2xl font-bold text-white">{deliveredCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <XCircle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Failed</p>
                <p className="text-2xl font-bold text-white">{failedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Users className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Templates</p>
                <p className="text-2xl font-bold text-white">{templates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="send" className="space-y-4">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="send" className="data-[state=active]:bg-blue-600">
            <Send className="h-4 w-4 mr-2" />
            Send SMS
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-blue-600">
            <Clock className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-blue-600">
            <MessageSquare className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Send New Message</CardTitle>
              <CardDescription className="text-slate-400">
                Send SMS notification to a client
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Phone Number</label>
                  <Input
                    placeholder="+1 614-555-0100"
                    value={newMessage.phone}
                    onChange={(e) => setNewMessage({ ...newMessage, phone: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Quick Template</label>
                  <select
                    className="w-full bg-slate-700 border-slate-600 text-white rounded-md px-3 py-2"
                    onChange={(e) => {
                      const template = templates.find(t => t.id === e.target.value)
                      if (template) setNewMessage({ ...newMessage, message: template.content })
                    }}
                  >
                    <option value="">Select template...</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Message</label>
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage.message}
                  onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
                />
                <p className="text-xs text-slate-500 mt-1">{newMessage.message.length}/160 characters</p>
              </div>
              <Button
                onClick={sendMessage}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!newMessage.phone || !newMessage.message}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Message History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {messages.map((msg) => {
                  const StatusIcon = statusIcons[msg.status]
                  return (
                    <div
                      key={msg.id}
                      className="flex items-start gap-4 p-4 bg-slate-700/50 rounded-lg border border-slate-600"
                    >
                      <div className={`p-2 rounded-lg ${statusColors[msg.status]}/20`}>
                        <StatusIcon className={`h-5 w-5 ${
                          msg.status === 'delivered' ? 'text-green-500' :
                          msg.status === 'sent' ? 'text-blue-500' :
                          msg.status === 'failed' ? 'text-red-500' : 'text-yellow-500'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium">{msg.clientName}</p>
                          <Badge className={`${statusColors[msg.status]} text-white text-xs`}>
                            {msg.status}
                          </Badge>
                        </div>
                        <p className="text-slate-300 text-sm">{msg.message}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {msg.to}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {msg.timestamp}
                          </span>
                        </div>
                      </div>
                      {msg.status === 'failed' && (
                        <Button size="sm" variant="outline" className="border-slate-600">
                          <Send className="h-3 w-3 mr-1" />
                          Retry
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">SMS Templates</CardTitle>
                <Button
                  onClick={() => setShowNewTemplate(!showNewTemplate)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showNewTemplate && (
                <div className="p-4 bg-slate-700/50 rounded-lg border border-blue-500 space-y-3">
                  <Input
                    placeholder="Template name"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <Textarea
                    placeholder="Template content... Use {{variable}} for dynamic values"
                    value={newTemplate.content}
                    onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <div className="flex gap-2">
                    <Button onClick={saveNewTemplate} size="sm" className="bg-green-600 hover:bg-green-700">
                      Save
                    </Button>
                    <Button onClick={() => setShowNewTemplate(false)} size="sm" variant="outline" className="border-slate-600">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="p-4 bg-slate-700/50 rounded-lg border border-slate-600"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-medium">{template.name}</h3>
                      <Badge variant="outline" className="border-slate-500 text-slate-300">
                        {template.category}
                      </Badge>
                    </div>
                    <p className="text-slate-300 text-sm mb-3">{template.content}</p>
                    {template.variables.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {template.variables.map((v) => (
                          <Badge key={v} className="bg-slate-600 text-slate-200 text-xs">
                            {`{{${v}}}`}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-slate-600"
                        onClick={() => copyTemplate(template.content)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-slate-600"
                        onClick={() => setEditingTemplate(template)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => deleteTemplate(template.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Twilio Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Account SID</label>
              <Input
                placeholder="AC..."
                className="bg-slate-700 border-slate-600 text-white font-mono"
                type="password"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Auth Token</label>
              <Input
                placeholder="..."
                className="bg-slate-700 border-slate-600 text-white font-mono"
                type="password"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Phone Number</label>
              <Input
                placeholder="+1 614-555-0000"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <AlertCircle className="h-4 w-4" />
            <span>Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to your .env file</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
