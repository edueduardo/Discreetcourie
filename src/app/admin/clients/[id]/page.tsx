'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Shield,
  Star,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  MessageSquare,
  Bell,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  Clock,
  Users,
  Heart,
  Tag
} from 'lucide-react'

interface ClientPreferences {
  communication_method: 'call' | 'text' | 'email'
  preferred_pickup_time?: string
  preferred_drop_off_time?: string
  special_instructions: string
  billing_preferences: string
  relationship_notes: string
  important_dates: Array<{
    type: string
    date: string
    description: string
  }>
}

const clientData = {
  id: '1',
  code: 'SHADOW-4521',
  name: 'VIP Client Alpha',
  email: 'alpha@encrypted.com',
  phone: '(614) 555-0101',
  address: '123 Discreet Ave, Columbus, OH 43215',
  tier: 'vip',
  status: 'active',
  createdAt: '2024-06-15',
  totalOrders: 45,
  totalRevenue: 8750,
  lastOrder: '2026-01-13',
  tags: ['high-value', 'guardian-mode', 'monthly-retainer', 'vip-preferred'],
  isVIP: true,
  preferences: {
    communication_method: 'text',
    preferred_pickup_time: '09:00',
    preferred_drop_off_time: '17:00',
    special_instructions: 'Always use back entrance. No contact before 9am. Prefers discrete packaging.',
    billing_preferences: 'Monthly invoice, NET 15. Prefers cryptocurrency payment option.',
    relationship_notes: 'Very detail-oriented. Values punctuality above all. Has a golden retriever named Max. Drinks coffee black. Anniversary is June 15th.',
    important_dates: [
      { type: 'Anniversary', date: '2026-06-15', description: 'Client anniversary - send thank you note' },
      { type: 'Guardian Check-in', date: '2026-01-15', description: 'Monthly Guardian Mode check-in call' }
    ]
  }
}

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [client] = useState(clientData)
  const [isEditing, setIsEditing] = useState(false)
  const [preferences, setPreferences] = useState<ClientPreferences>(client.preferences as ClientPreferences)
  const [newTag, setNewTag] = useState('')
  const [tags, setTags] = useState(client.tags)
  const [showAddDate, setShowAddDate] = useState(false)

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'vip': return 'bg-purple-500/20 text-purple-500 border-purple-500/30'
      case 'concierge': return 'bg-blue-500/20 text-blue-500 border-blue-500/30'
      case 'discreet': return 'bg-orange-500/20 text-orange-500 border-orange-500/30'
      case 'courier': return 'bg-green-500/20 text-green-500 border-green-500/30'
      default: return 'bg-slate-500/20 text-slate-500'
    }
  }

  const handleSavePreferences = () => {
    setIsEditing(false)
    // API call would go here
    console.log('Saving preferences:', preferences)
  }

  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag])
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push('/admin/clients')}
          className="border-slate-600"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{client.name}</h1>
            {client.isVIP && (
              <Star className="h-5 w-5 text-purple-500 fill-purple-500" />
            )}
            <Badge className={getTierColor(client.tier)}>
              {client.tier.toUpperCase()}
            </Badge>
            <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
              {client.status}
            </Badge>
          </div>
          <p className="text-slate-400 font-mono text-sm">{client.code}</p>
        </div>
        <Button variant="outline" className="border-slate-600">
          <MessageSquare className="h-4 w-4 mr-2" />
          Send Message
        </Button>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Order
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Orders</p>
                <p className="text-2xl font-bold text-white">{client.totalOrders}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-green-500">${client.totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Avg Order Value</p>
                <p className="text-2xl font-bold text-white">${(client.totalRevenue / client.totalOrders).toFixed(0)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Last Order</p>
                <p className="text-lg font-bold text-white">{new Date(client.lastOrder).toLocaleDateString()}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="info">Info & Contact</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="orders">Order History</TabsTrigger>
          <TabsTrigger value="notes">Relationship Notes</TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-slate-300">
                  <Phone className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-500">Phone</p>
                    <p>{client.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <Mail className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-500">Email</p>
                    <p>{client.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <MapPin className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-500">Address</p>
                    <p>{client.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-500">Client Since</p>
                    <p>{new Date(client.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg">Tags</CardTitle>
                  <Tag className="h-4 w-4 text-slate-500" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="text-slate-300 border-slate-600 group cursor-pointer hover:border-red-500"
                    >
                      {tag}
                      <X
                        className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 text-red-500"
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                  <Button onClick={handleAddTag} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Client Preferences</CardTitle>
                  <CardDescription>Customize service delivery and communication</CardDescription>
                </div>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} variant="outline" className="border-slate-600">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={() => setIsEditing(false)} variant="outline" className="border-slate-600">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={handleSavePreferences}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Communication Method */}
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Preferred Communication Method</label>
                <div className="flex gap-2">
                  {['call', 'text', 'email'].map((method) => (
                    <Button
                      key={method}
                      variant={preferences.communication_method === method ? 'default' : 'outline'}
                      onClick={() => isEditing && setPreferences({ ...preferences, communication_method: method as any })}
                      disabled={!isEditing}
                      className={preferences.communication_method !== method ? 'border-slate-600' : ''}
                    >
                      {method === 'call' && <Phone className="h-4 w-4 mr-2" />}
                      {method === 'text' && <MessageSquare className="h-4 w-4 mr-2" />}
                      {method === 'email' && <Mail className="h-4 w-4 mr-2" />}
                      {method.charAt(0).toUpperCase() + method.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Preferred Times */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Preferred Pickup Time</label>
                  <Input
                    type="time"
                    value={preferences.preferred_pickup_time}
                    onChange={(e) => setPreferences({ ...preferences, preferred_pickup_time: e.target.value })}
                    disabled={!isEditing}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Preferred Drop-off Time</label>
                  <Input
                    type="time"
                    value={preferences.preferred_drop_off_time}
                    onChange={(e) => setPreferences({ ...preferences, preferred_drop_off_time: e.target.value })}
                    disabled={!isEditing}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              </div>

              {/* Special Instructions */}
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Special Instructions</label>
                <Textarea
                  value={preferences.special_instructions}
                  onChange={(e) => setPreferences({ ...preferences, special_instructions: e.target.value })}
                  disabled={!isEditing}
                  rows={3}
                  placeholder="e.g., Always use back entrance, no contact before 9am..."
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>

              {/* Billing Preferences */}
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Billing Preferences</label>
                <Textarea
                  value={preferences.billing_preferences}
                  onChange={(e) => setPreferences({ ...preferences, billing_preferences: e.target.value })}
                  disabled={!isEditing}
                  rows={2}
                  placeholder="e.g., Monthly invoice, NET 30, prefers PayPal..."
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* Important Dates */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Important Dates</CardTitle>
                <Button onClick={() => setShowAddDate(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Date
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {preferences.important_dates.map((date, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="font-medium text-white">{date.type}</p>
                      <p className="text-sm text-slate-400">{date.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-300">{new Date(date.date).toLocaleDateString()}</span>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Order history will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    Relationship Notes
                  </CardTitle>
                  <CardDescription>Personal details that help build better relationships</CardDescription>
                </div>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} variant="outline" className="border-slate-600">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={() => setIsEditing(false)} variant="outline" className="border-slate-600">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={handleSavePreferences}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={preferences.relationship_notes}
                onChange={(e) => setPreferences({ ...preferences, relationship_notes: e.target.value })}
                disabled={!isEditing}
                rows={8}
                placeholder="e.g., Loves coffee, has a dog named Max, values punctuality, important dates..."
                className="bg-slate-900 border-slate-700 text-white"
              />
              <p className="text-xs text-slate-500 mt-2">
                💡 Tip: Note personal details like pets, hobbies, important dates, communication preferences, etc.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
