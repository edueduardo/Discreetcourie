'use client'

import { useState } from 'react'
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { DestructionLog, Client } from '@/types'
import { Flame, AlertTriangle, Video, Clock, CheckCircle } from 'lucide-react'

// Demo data
const demoLogs: DestructionLog[] = [
  {
    id: '1',
    customer_code: 'SHADOW-7842',
    items_destroyed: {
      orders: 12,
      tasks: 5,
      messages: 34,
      vault_items: 2,
      proofs: 8,
    },
    requested_by: 'customer',
    reason: 'Customer requested complete data deletion',
    video_sent: true,
    executed_at: '2025-12-15T10:30:00Z',
  },
  {
    id: '2',
    customer_code: 'CIPHER-9921',
    items_destroyed: {
      orders: 3,
      tasks: 1,
      messages: 15,
    },
    requested_by: 'system',
    reason: 'Auto-delete after 180 days of inactivity',
    video_sent: false,
    executed_at: '2025-11-20T03:00:00Z',
  },
]

const demoClients: Client[] = [
  {
    id: '1',
    code_name: 'SHADOW-7842',
    name: 'Confidential Client',
    email: 'client@example.com',
    phone: '(614) 555-0001',
    type: 'b2c',
    service_level: 4,
    privacy_level: 'none',
    is_vip: true,
    guardian_mode_active: true,
    pact_signed: true,
    nda_signed: true,
    vetting_status: 'approved',
    preferred_payment: 'anonymous',
    communication_preference: 'chat',
    retainer_active: true,
    last_activity: new Date().toISOString(),
    created_at: '2025-11-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: '2',
    code_name: 'GHOST-3391',
    name: 'VIP Client 2',
    email: 'client2@example.com',
    phone: '(614) 555-0002',
    type: 'b2c',
    service_level: 4,
    privacy_level: 'none',
    is_vip: true,
    guardian_mode_active: false,
    pact_signed: true,
    nda_signed: true,
    vetting_status: 'approved',
    preferred_payment: 'normal',
    communication_preference: 'sms',
    retainer_active: false,
    last_activity: new Date().toISOString(),
    created_at: '2025-10-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
]

export default function DestructionPage() {
  const [logs, setLogs] = useState(demoLogs)
  const [isDestroyDialogOpen, setIsDestroyDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [confirmationText, setConfirmationText] = useState('')

  const totalDestructions = logs.length
  const customerRequested = logs.filter((l) => l.requested_by === 'customer').length
  const systemAutoDelete = logs.filter((l) => l.requested_by === 'system').length

  const handleDestroyClick = (client: Client) => {
    setSelectedClient(client)
    setIsDestroyDialogOpen(true)
  }

  const handleConfirmDestroy = () => {
    if (confirmationText !== `DESTROY ${selectedClient?.code_name}`) {
      alert('Confirmation text does not match')
      return
    }

    // Execute destruction (API call would go here)
    console.log('Destroying all data for:', selectedClient?.code_name)

    // Add to logs
    const newLog: DestructionLog = {
      id: Date.now().toString(),
      customer_code: selectedClient?.code_name || '',
      items_destroyed: {
        orders: 12,
        tasks: 5,
        messages: 34,
        vault_items: 2,
        proofs: 8,
      },
      requested_by: 'admin',
      reason: 'Manual destruction via admin panel',
      video_sent: false,
      executed_at: new Date().toISOString(),
    }

    setLogs([newLog, ...logs])
    setIsConfirmDialogOpen(false)
    setIsDestroyDialogOpen(false)
    setConfirmationText('')
    setSelectedClient(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Flame className="h-8 w-8 text-orange-500" />
            Ritual de Destruição
          </h1>
          <p className="text-muted-foreground">
            Complete data deletion with audit trail
          </p>
        </div>
        <Dialog open={isDestroyDialogOpen} onOpenChange={setIsDestroyDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">
              <Flame className="mr-2 h-4 w-4" />
              Destroy Customer Data
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Select Customer for Data Destruction</DialogTitle>
              <DialogDescription>
                Choose a VIP client to permanently delete all their data
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              {demoClients.map((client) => (
                <Card
                  key={client.id}
                  className="p-4 cursor-pointer hover:bg-accent"
                  onClick={() => {
                    setSelectedClient(client)
                    setIsConfirmDialogOpen(true)
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{client.code_name}</div>
                      <div className="text-sm text-muted-foreground">
                        VIP Level {client.service_level} · Last active:{' '}
                        {new Date(client.last_activity).toLocaleDateString()}
                      </div>
                    </div>
                    <Button variant="destructive" size="sm">
                      Destroy
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Warning */}
      <Card className="p-6 border-orange-500 bg-orange-50">
        <div className="flex items-start gap-4">
          <AlertTriangle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-orange-900 mb-2">
              Warning: Irreversible Action
            </h3>
            <p className="text-sm text-orange-800">
              Data destruction is permanent and cannot be undone. All orders,
              tasks, messages, vault items, and proofs will be deleted. Only
              financial records required by law will be retained (without
              personal data).
            </p>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Destructions</p>
              <p className="text-3xl font-bold">{totalDestructions}</p>
            </div>
            <Flame className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Customer Requested</p>
              <p className="text-3xl font-bold">{customerRequested}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">System Auto-Delete</p>
              <p className="text-3xl font-bold">{systemAutoDelete}</p>
            </div>
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
      </div>

      {/* Destruction Log */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Destruction Log</h2>
        <div className="space-y-4">
          {logs.map((log) => (
            <Card key={log.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-lg">
                      {log.customer_code}
                    </span>
                    <Badge variant={log.requested_by === 'customer' ? 'default' : 'secondary'}>
                      {log.requested_by}
                    </Badge>
                    {log.video_sent && (
                      <Badge variant="outline">
                        <Video className="h-3 w-3 mr-1" />
                        Video Sent
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-5 gap-4 text-sm mb-2">
                    {log.items_destroyed.orders && (
                      <div>
                        <div className="text-muted-foreground">Orders</div>
                        <div className="font-semibold">{log.items_destroyed.orders}</div>
                      </div>
                    )}
                    {log.items_destroyed.tasks && (
                      <div>
                        <div className="text-muted-foreground">Tasks</div>
                        <div className="font-semibold">{log.items_destroyed.tasks}</div>
                      </div>
                    )}
                    {log.items_destroyed.messages && (
                      <div>
                        <div className="text-muted-foreground">Messages</div>
                        <div className="font-semibold">{log.items_destroyed.messages}</div>
                      </div>
                    )}
                    {log.items_destroyed.vault_items && (
                      <div>
                        <div className="text-muted-foreground">Vault Items</div>
                        <div className="font-semibold">{log.items_destroyed.vault_items}</div>
                      </div>
                    )}
                    {log.items_destroyed.proofs && (
                      <div>
                        <div className="text-muted-foreground">Proofs</div>
                        <div className="font-semibold">{log.items_destroyed.proofs}</div>
                      </div>
                    )}
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {log.reason}
                  </div>
                </div>

                <div className="text-sm text-muted-foreground text-right">
                  {new Date(log.executed_at).toLocaleString()}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Confirm Data Destruction
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <div className="space-y-2">
                <p className="font-semibold">CLIENT: {selectedClient?.code_name}</p>
                <p>Name: {selectedClient?.name}</p>
              </div>

              <div className="bg-orange-50 p-4 rounded border border-orange-200">
                <p className="font-semibold text-orange-900 mb-2">
                  DADOS A SEREM DELETADOS:
                </p>
                <ul className="space-y-1 text-sm text-orange-800">
                  <li>☑ All orders/deliveries</li>
                  <li>☑ All concierge tasks</li>
                  <li>☑ All messages</li>
                  <li>☑ All vault items</li>
                  <li>☑ All delivery proofs</li>
                  <li>☑ Complete profile</li>
                  <li>☐ Financial records (retained by law)</li>
                </ul>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-red-600">
                  ⚠️ THIS ACTION IS IRREVERSIBLE
                </p>
                <Label htmlFor="confirm">
                  Type "DESTROY {selectedClient?.code_name}" to confirm:
                </Label>
                <Input
                  id="confirm"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder={`DESTROY ${selectedClient?.code_name}`}
                  className="font-mono"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmationText('')}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDestroy}
              disabled={confirmationText !== `DESTROY ${selectedClient?.code_name}`}
              className="bg-red-600 hover:bg-red-700"
            >
              <Flame className="mr-2 h-4 w-4" />
              Execute Destruction
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
