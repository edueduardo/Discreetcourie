'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertTriangle,
  Phone,
  Clock,
  Shield,
  Plus,
  Edit,
  Trash2,
  Power,
  PowerOff,
  User,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Emergency Protocol Type
interface EmergencyProtocol {
  id: string
  protocol_name: string
  trigger_condition: string
  actions: string[]
  notification_order: string[]
  escalation_time_minutes: number
  status: 'active' | 'inactive' | 'triggered'
  priority: 'critical' | 'high' | 'medium' | 'low'
  last_triggered?: string
  created_at: string
}

interface EmergencyContact {
  id: string
  name: string
  role: string
  phone: string
  email?: string
  priority: number
  available_24_7: boolean
}

// Demo data
const demoProtocols: EmergencyProtocol[] = [
  {
    id: '1',
    protocol_name: 'Guardian Mode Check-in Failure',
    trigger_condition: 'VIP client misses 2 consecutive check-ins',
    actions: [
      'Call client direct line',
      'Send SMS to backup number',
      'Contact emergency contact',
      'Dispatch to last known location if no response',
    ],
    notification_order: ['Eduardo', 'Backup Driver', 'Emergency Services'],
    escalation_time_minutes: 30,
    status: 'active',
    priority: 'critical',
    last_triggered: '2026-01-09T14:23:00Z',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: '2',
    protocol_name: 'Vault Item Expiration',
    trigger_condition: 'Vault item reaches expiration date',
    actions: [
      'Notify client 7 days before',
      'Notify client 24 hours before',
      'Execute delivery or destruction per agreement',
    ],
    notification_order: ['Client', 'Eduardo'],
    escalation_time_minutes: 1440, // 24 hours
    status: 'active',
    priority: 'high',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: '3',
    protocol_name: 'Última Vontade Trigger',
    trigger_condition: 'Last Will check-in missed for configured period',
    actions: [
      'Attempt contact via all channels',
      'Contact designated executor if no response',
      'Prepare sealed item for delivery',
      'Execute delivery to beneficiary',
    ],
    notification_order: ['Client', 'Executor', 'Eduardo', 'Legal Counsel'],
    escalation_time_minutes: 720, // 12 hours
    status: 'active',
    priority: 'critical',
    last_triggered: '2025-12-15T09:00:00Z',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: '4',
    protocol_name: 'Emergency Destruction Request',
    trigger_condition: 'Client sends code word via SMS or call',
    actions: [
      'Immediately stop all active tasks',
      'Execute complete data deletion',
      'Record destruction video',
      'Send confirmation to client backup email',
    ],
    notification_order: ['Eduardo', 'System Admin'],
    escalation_time_minutes: 0, // Immediate
    status: 'active',
    priority: 'critical',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: '5',
    protocol_name: 'No-Trace Mode Expiration',
    trigger_condition: 'No-trace task reaches 7-day auto-delete',
    actions: [
      'Verify all data marked for deletion',
      'Execute automated purge',
      'Remove all traces from logs',
      'Confirm deletion complete',
    ],
    notification_order: ['System', 'Eduardo'],
    escalation_time_minutes: 0,
    status: 'active',
    priority: 'medium',
    created_at: '2026-01-01T00:00:00Z',
  },
]

const demoContacts: EmergencyContact[] = [
  {
    id: '1',
    name: 'Eduardo (Owner)',
    role: 'Primary Operator',
    phone: '+1 (614) 500-3080',
    email: 'eduardo@discreetcourier.com',
    priority: 1,
    available_24_7: true,
  },
  {
    id: '2',
    name: 'Backup Driver',
    role: 'Secondary Operator',
    phone: '+1 (614) 555-0199',
    priority: 2,
    available_24_7: false,
  },
  {
    id: '3',
    name: 'Legal Counsel',
    role: 'Legal Advisor',
    phone: '+1 (614) 555-0177',
    email: 'legal@discreetcourier.com',
    priority: 3,
    available_24_7: false,
  },
]

export default function EmergencyPage() {
  const [protocols, setProtocols] = useState(demoProtocols)
  const [contacts] = useState(demoContacts)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedProtocol, setSelectedProtocol] = useState<EmergencyProtocol | null>(null)

  // Stats
  const activeProtocols = protocols.filter((p) => p.status === 'active')
  const criticalProtocols = protocols.filter((p) => p.priority === 'critical')
  const triggeredToday = protocols.filter((p) => {
    if (!p.last_triggered) return false
    const today = new Date().toDateString()
    return new Date(p.last_triggered).toDateString() === today
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600 bg-red-50'
      case 'high':
        return 'text-orange-600 bg-orange-50'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50'
      case 'low':
        return 'text-blue-600 bg-blue-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getPriorityBadge = (priority: string) => {
    const colors = getPriorityColor(priority)
    return (
      <Badge variant="outline" className={colors}>
        {priority.toUpperCase()}
      </Badge>
    )
  }

  const toggleProtocolStatus = (id: string) => {
    setProtocols((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status: p.status === 'active' ? 'inactive' : 'active',
            }
          : p
      )
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            Emergency Protocols
          </h1>
          <p className="text-muted-foreground">
            Automated responses for critical situations
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Protocol
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Protocols</p>
              <p className="text-3xl font-bold">{protocols.length}</p>
            </div>
            <Shield className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-3xl font-bold text-green-600">{activeProtocols.length}</p>
            </div>
            <Power className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Critical Priority</p>
              <p className="text-3xl font-bold text-red-600">{criticalProtocols.length}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Triggered Today</p>
              <p className="text-3xl font-bold">{triggeredToday.length}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </Card>
      </div>

      {/* Protocols List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Active Protocols</h2>
        {protocols.map((protocol) => (
          <Card
            key={protocol.id}
            className={`p-6 ${protocol.status === 'inactive' ? 'opacity-60' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle
                    className={`h-5 w-5 ${
                      protocol.priority === 'critical' ? 'text-red-600' : 'text-orange-600'
                    }`}
                  />
                  <h3 className="font-semibold text-lg">{protocol.protocol_name}</h3>
                  {getPriorityBadge(protocol.priority)}
                  {protocol.status === 'active' ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-50">
                      Inactive
                    </Badge>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground font-medium">Trigger: </span>
                    <span>{protocol.trigger_condition}</span>
                  </div>

                  <div>
                    <span className="text-muted-foreground font-medium">Actions: </span>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      {protocol.actions.map((action, idx) => (
                        <li key={idx} className="text-muted-foreground">
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="text-muted-foreground font-medium">Escalation: </span>
                    <span>
                      {protocol.escalation_time_minutes === 0
                        ? 'Immediate'
                        : `${protocol.escalation_time_minutes} minutes`}
                    </span>
                  </div>

                  {protocol.last_triggered && (
                    <div>
                      <span className="text-muted-foreground font-medium">Last Triggered: </span>
                      <span className="text-orange-600">
                        {new Date(protocol.last_triggered).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleProtocolStatus(protocol.id)}
                >
                  {protocol.status === 'active' ? (
                    <>
                      <PowerOff className="h-4 w-4 mr-1" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <Power className="h-4 w-4 mr-1" />
                      Activate
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedProtocol(protocol)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Emergency Contacts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Emergency Contacts</h2>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {contacts.map((contact) => (
            <Card key={contact.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <div className="font-semibold">{contact.name}</div>
                    <div className="text-sm text-muted-foreground">{contact.role}</div>
                    <div className="flex items-center gap-2 mt-2 text-sm">
                      <Phone className="h-3 w-3" />
                      <span>{contact.phone}</span>
                    </div>
                    {contact.email && (
                      <div className="text-xs text-muted-foreground mt-1">{contact.email}</div>
                    )}
                    {contact.available_24_7 && (
                      <Badge variant="outline" className="mt-2 bg-green-50 text-green-700">
                        24/7
                      </Badge>
                    )}
                  </div>
                </div>
                <Badge variant="secondary">{contact.priority}</Badge>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Create Protocol Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Emergency Protocol</DialogTitle>
            <DialogDescription>
              Define automated response for critical situations
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="protocol_name">Protocol Name</Label>
              <Input id="protocol_name" placeholder="e.g., Guardian Mode Failure" />
            </div>

            <div>
              <Label htmlFor="trigger">Trigger Condition</Label>
              <Textarea
                id="trigger"
                placeholder="Describe what triggers this protocol..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="priority">Priority Level</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="escalation">Escalation Time (minutes)</Label>
              <Input
                id="escalation"
                type="number"
                placeholder="0 for immediate"
                defaultValue="30"
              />
            </div>

            <div>
              <Label>Actions (one per line)</Label>
              <Textarea placeholder="Call client&#10;Send SMS&#10;Contact emergency contact" rows={4} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(false)}>Create Protocol</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
