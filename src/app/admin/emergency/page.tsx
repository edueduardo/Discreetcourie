'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  Shield,
  Phone,
  Clock,
  Plus,
  Play,
  Pause,
  Trash2,
  User,
  Bell,
  CheckCircle2
} from 'lucide-react'

interface Protocol {
  id: string
  client_code: string
  client_name: string
  protocol_name: string
  trigger_condition: string
  actions: string[]
  emergency_contacts: { name: string; phone: string; relation: string }[]
  is_active: boolean
  last_triggered_at: string | null
  created_at: string
}

export default function EmergencyProtocolsPage() {
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)
  const [triggerConfirm, setTriggerConfirm] = useState<string | null>(null)

  useEffect(() => {
    fetchProtocols()
  }, [])

  async function fetchProtocols() {
    try {
      const res = await fetch('/api/emergency')
      const data = await res.json()
      if (data.protocols) setProtocols(data.protocols)
    } catch (error) {
      console.error('Error fetching protocols:', error)
    } finally {
      setLoading(false)
    }
  }

  const stats = {
    total_protocols: protocols.length,
    active_protocols: protocols.filter(p => p.is_active).length,
    triggered_this_month: protocols.filter(p => p.last_triggered_at && new Date(p.last_triggered_at) > new Date(Date.now() - 30*24*60*60*1000)).length,
    clients_protected: new Set(protocols.map(p => p.client_code)).size
  }

  const handleTrigger = (id: string) => {
    if (triggerConfirm === id) {
      // Execute trigger
      setProtocols(prev => prev.map(p => 
        p.id === id 
          ? { ...p, last_triggered_at: new Date().toISOString() }
          : p
      ))
      setTriggerConfirm(null)
      alert('🚨 EMERGENCY PROTOCOL TRIGGERED! Actions executed.')
    } else {
      setTriggerConfirm(id)
    }
  }

  const toggleActive = (id: string) => {
    setProtocols(prev => prev.map(p =>
      p.id === id ? { ...p, is_active: !p.is_active } : p
    ))
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            Emergency Protocols
          </h1>
          <p className="text-slate-400">Manage client emergency procedures and panic buttons</p>
        </div>
        <Button 
          onClick={() => setShowNewForm(true)}
          className="bg-red-600 hover:bg-red-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Protocol
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Protocols</p>
                <p className="text-2xl font-bold text-white">{stats.total_protocols}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Active</p>
                <p className="text-2xl font-bold text-green-500">{stats.active_protocols}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Triggered (Month)</p>
                <p className="text-2xl font-bold text-yellow-500">{stats.triggered_this_month}</p>
              </div>
              <Bell className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Clients Protected</p>
                <p className="text-2xl font-bold text-white">{stats.clients_protected}</p>
              </div>
              <User className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Protocols List */}
      <div className="space-y-4">
        {protocols.map((protocol) => (
          <Card 
            key={protocol.id} 
            className={`bg-slate-800 border-slate-700 ${
              !protocol.is_active ? 'opacity-60' : ''
            }`}
          >
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                {/* Protocol Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      protocol.is_active ? 'bg-red-500/20' : 'bg-slate-700'
                    }`}>
                      <AlertTriangle className={`h-5 w-5 ${
                        protocol.is_active ? 'text-red-500' : 'text-slate-500'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-lg">
                        {protocol.protocol_name}
                      </h3>
                      <p className="text-sm text-slate-400">
                        {protocol.client_code} • {protocol.client_name}
                      </p>
                    </div>
                    <Badge variant={protocol.is_active ? 'default' : 'secondary'}>
                      {protocol.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </Badge>
                  </div>

                  {/* Trigger Condition */}
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                    <p className="text-xs text-slate-500 uppercase mb-1">Trigger Condition</p>
                    <p className="text-white font-mono">{protocol.trigger_condition}</p>
                  </div>

                  {/* Actions */}
                  <div>
                    <p className="text-xs text-slate-500 uppercase mb-2">Actions When Triggered</p>
                    <div className="flex flex-wrap gap-2">
                      {protocol.actions.map((action, i) => (
                        <Badge key={i} variant="outline" className="text-slate-300 border-slate-600">
                          {action}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Emergency Contacts */}
                  {protocol.emergency_contacts.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase mb-2">Emergency Contacts</p>
                      <div className="flex flex-wrap gap-3">
                        {protocol.emergency_contacts.map((contact, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-slate-500" />
                            <span className="text-slate-300">{contact.name}</span>
                            <span className="text-slate-500">({contact.relation})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Last Triggered */}
                  {protocol.last_triggered_at && (
                    <div className="flex items-center gap-2 text-sm text-yellow-500">
                      <Clock className="h-4 w-4" />
                      Last triggered: {new Date(protocol.last_triggered_at).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 lg:min-w-[200px]">
                  {protocol.is_active && (
                    <Button
                      onClick={() => handleTrigger(protocol.id)}
                      className={`${
                        triggerConfirm === protocol.id
                          ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                          : 'bg-red-500/20 hover:bg-red-500/30 text-red-500'
                      }`}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {triggerConfirm === protocol.id ? 'CONFIRM TRIGGER' : 'Trigger Protocol'}
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={() => toggleActive(protocol.id)}
                    className="border-slate-600 hover:bg-slate-700"
                  >
                    {protocol.is_active ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Activate
                      </>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* New Protocol Form Modal */}
      {showNewForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="bg-slate-800 border-slate-700 w-full max-w-lg">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                New Emergency Protocol
              </CardTitle>
              <CardDescription>
                Create a new emergency protocol for a client
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-slate-400">Client</label>
                <select className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-lg text-white">
                  <option>Select client...</option>
                  <option>SHADOW-4521 - VIP Client Alpha</option>
                  <option>GHOST-7892 - Corporate Executive</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm text-slate-400">Protocol Name</label>
                <input 
                  type="text"
                  placeholder="e.g., Silent Alarm, Extraction Protocol"
                  className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400">Trigger Condition</label>
                <input 
                  type="text"
                  placeholder="e.g., Code word: 'umbrella'"
                  className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400">Actions (comma separated)</label>
                <textarea 
                  placeholder="Call 911, Notify emergency contact, Delete records"
                  className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-lg text-white h-20"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowNewForm(false)}
                  className="flex-1 border-slate-600"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => setShowNewForm(false)}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Create Protocol
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
