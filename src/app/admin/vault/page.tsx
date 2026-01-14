'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { VaultItem, Client } from '@/types'
import { Package, Calendar, AlertCircle, CheckCircle, Clock, Trash2, Plus } from 'lucide-react'


export default function VaultPage() {
  const [items, setItems] = useState<VaultItem[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [vaultRes, clientsRes] = await Promise.all([
        fetch('/api/vault'),
        fetch('/api/customers')
      ])
      
      const vaultData = await vaultRes.json()
      const clientsData = await clientsRes.json()
      
      if (vaultData.items) setItems(vaultData.items)
      if (clientsData.customers) setClients(clientsData.customers.filter((c: Client) => c.is_vip))
    } catch (error) {
      console.error('Error fetching vault data:', error)
    } finally {
      setLoading(false)
    }
  }

  const activeItems = items.filter((i) => i.status === 'active')
  const uniqueClients = new Set(items.map((i) => i.client_id)).size
  const monthlyRevenue = uniqueClients * 100

  const getItemTypeIcon = (type: string) => {
    switch (type) {
      case 'storage':
        return <Package className="h-4 w-4" />
      case 'last_will':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'time_capsule':
        return <Clock className="h-4 w-4 text-blue-500" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      delivered: 'secondary',
      expired: 'destructive',
      destroyed: 'outline',
    }
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>
  }

  const getClientCodeById = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId)
    return client?.code_name || 'Unknown'
  }

  const getDaysUntil = (dateStr?: string) => {
    if (!dateStr) return null
    const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cofre Humano</h1>
          <p className="text-muted-foreground">Items stored for VIP clients</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Vault Item</DialogTitle>
              <DialogDescription>
                Store a new item in the vault for a VIP client
              </DialogDescription>
            </DialogHeader>
            <AddItemForm onClose={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="text-3xl font-bold">{activeItems.length}</p>
            </div>
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">VIP Clients</p>
              <p className="text-3xl font-bold">{uniqueClients}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Monthly Revenue</p>
              <p className="text-3xl font-bold">${monthlyRevenue}</p>
            </div>
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
      </div>

      {/* Items List Grouped by Client */}
      <div className="space-y-6">
        {Array.from(new Set(items.map((i) => i.client_id))).map((clientId) => {
          const clientItems = items.filter((i) => i.client_id === clientId)
          const clientCode = getClientCodeById(clientId)

          return (
            <Card key={clientId} className="p-6">
              <h2 className="text-xl font-semibold mb-4">{clientCode}</h2>
              <div className="space-y-3">
                {clientItems.map((item) => {
                  const daysUntil = getDaysUntil(item.expires_at || item.deliver_at)
                  const isExpiringSoon = daysUntil !== null && daysUntil < 7 && daysUntil > 0

                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        isExpiringSoon ? 'border-orange-500 bg-orange-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {getItemTypeIcon(item.item_type)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.item_code}</span>
                            <span className="text-muted-foreground">·</span>
                            <span>{item.description}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Stored: {new Date(item.stored_at).toLocaleDateString()}
                            {item.expires_at && (
                              <>
                                {' '}
                                · Expires:{' '}
                                {new Date(item.expires_at).toLocaleDateString()}
                                {daysUntil !== null && (
                                  <span
                                    className={
                                      isExpiringSoon
                                        ? 'text-orange-600 font-medium'
                                        : ''
                                    }
                                  >
                                    {' '}
                                    ({daysUntil} days)
                                  </span>
                                )}
                              </>
                            )}
                            {item.deliver_at && (
                              <>
                                {' '}
                                · Deliver:{' '}
                                {new Date(item.deliver_at).toLocaleDateString()}
                              </>
                            )}
                          </div>
                          {item.is_last_will && (
                            <div className="text-sm text-red-600 font-medium mt-1">
                              🔴 LAST WILL - {item.last_will_trigger?.toUpperCase()}
                              {item.last_will_recipient_name && (
                                <> → {item.last_will_recipient_name}</>
                              )}
                            </div>
                          )}
                          {item.storage_location && (
                            <div className="text-sm text-muted-foreground">
                              📍 {item.storage_location}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(item.status)}
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function AddItemForm({ onClose }: { onClose: () => void }) {
  return (
    <form className="space-y-4">
      <div>
        <Label htmlFor="client">VIP Client</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select client" />
          </SelectTrigger>
          <SelectContent>
            {/* Clients are loaded dynamically from API */}
            <SelectItem value="new">Add new client</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="type">Item Type</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="storage">Storage</SelectItem>
            <SelectItem value="last_will">Last Will</SelectItem>
            <SelectItem value="time_capsule">Time Capsule</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Input id="description" placeholder="Envelope lacrado" />
      </div>

      <div>
        <Label htmlFor="location">Storage Location</Label>
        <Input id="location" placeholder="Safe A - Shelf 1" />
      </div>

      <div>
        <Label htmlFor="notes">Notes (Internal Only)</Label>
        <Textarea id="notes" placeholder="Additional notes..." />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Add to Vault</Button>
      </div>
    </form>
  )
}
