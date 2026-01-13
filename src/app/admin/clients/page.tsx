'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Users,
  Search,
  Plus,
  Star,
  Shield,
  Clock,
  DollarSign,
  Phone,
  Mail,
  MapPin
} from 'lucide-react'

interface Client {
  id: string
  code: string
  name: string
  company?: string
  email: string
  phone: string
  tier: 'courier' | 'discreet' | 'concierge' | 'vip'
  status: 'active' | 'inactive'
  totalOrders: number
  totalRevenue: number
  lastOrder: string
  tags: string[]
  isVIP: boolean
}

const clients: Client[] = [
  {
    id: '1',
    code: 'SHADOW-4521',
    name: 'VIP Client Alpha',
    email: 'alpha@encrypted.com',
    phone: '(614) 555-0101',
    tier: 'vip',
    status: 'active',
    totalOrders: 45,
    totalRevenue: 8750,
    lastOrder: '2026-01-13',
    tags: ['high-value', 'guardian-mode', 'monthly-retainer'],
    isVIP: true
  },
  {
    id: '2',
    code: 'GHOST-7892',
    name: 'Corporate Executive',
    company: 'Executive Corp',
    email: 'exec@company.com',
    phone: '(614) 555-0200',
    tier: 'concierge',
    status: 'active',
    totalOrders: 32,
    totalRevenue: 4200,
    lastOrder: '2026-01-12',
    tags: ['corporate', 'weekly-client'],
    isVIP: false
  },
  {
    id: '3',
    code: 'CIPHER-3345',
    name: 'Private Individual',
    email: 'private@proton.me',
    phone: '(614) 555-0303',
    tier: 'discreet',
    status: 'active',
    totalOrders: 18,
    totalRevenue: 1350,
    lastOrder: '2026-01-10',
    tags: ['no-trace', 'occasional'],
    isVIP: false
  },
  {
    id: '4',
    code: 'LEGAL-9012',
    name: 'Sarah Johnson',
    company: 'Law Firm LLC',
    email: 'sjohnson@lawfirm.com',
    phone: '(614) 555-0404',
    tier: 'courier',
    status: 'active',
    totalOrders: 67,
    totalRevenue: 3350,
    lastOrder: '2026-01-13',
    tags: ['law-firm', 'high-volume', 'documents'],
    isVIP: false
  },
  {
    id: '5',
    code: 'MEDICAL-5678',
    name: 'Dr. Michael Chen',
    company: 'Medical Center',
    email: 'mchen@medicalcenter.com',
    phone: '(614) 555-0505',
    tier: 'discreet',
    status: 'active',
    totalOrders: 28,
    totalRevenue: 2100,
    lastOrder: '2026-01-11',
    tags: ['medical', 'specimens', 'urgent'],
    isVIP: false
  }
]

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTier, setFilterTier] = useState<string>('all')

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (client.company?.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesTier = filterTier === 'all' || client.tier === filterTier
    return matchesSearch && matchesTier
  })

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'vip': return 'bg-purple-500/20 text-purple-500 border-purple-500/30'
      case 'concierge': return 'bg-blue-500/20 text-blue-500 border-blue-500/30'
      case 'discreet': return 'bg-orange-500/20 text-orange-500 border-orange-500/30'
      case 'courier': return 'bg-green-500/20 text-green-500 border-green-500/30'
      default: return 'bg-slate-500/20 text-slate-500'
    }
  }

  const getTierLabel = (tier: string) => {
    return tier.charAt(0).toUpperCase() + tier.slice(1)
  }

  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    vip: clients.filter(c => c.isVIP).length,
    totalRevenue: clients.reduce((sum, c) => sum + c.totalRevenue, 0)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-500" />
            Clients
          </h1>
          <p className="text-slate-400">Manage your client relationships and preferences</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Client
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Clients</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Active</p>
                <p className="text-2xl font-bold text-green-500">{stats.active}</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">VIP Clients</p>
                <p className="text-2xl font-bold text-purple-500">{stats.vip}</p>
              </div>
              <Star className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-white">${stats.totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name, code, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterTier === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterTier('all')}
            className={filterTier !== 'all' ? 'border-slate-600' : ''}
          >
            All
          </Button>
          <Button
            variant={filterTier === 'vip' ? 'default' : 'outline'}
            onClick={() => setFilterTier('vip')}
            className={filterTier !== 'vip' ? 'border-slate-600' : ''}
          >
            VIP
          </Button>
          <Button
            variant={filterTier === 'concierge' ? 'default' : 'outline'}
            onClick={() => setFilterTier('concierge')}
            className={filterTier !== 'concierge' ? 'border-slate-600' : ''}
          >
            Concierge
          </Button>
          <Button
            variant={filterTier === 'discreet' ? 'default' : 'outline'}
            onClick={() => setFilterTier('discreet')}
            className={filterTier !== 'discreet' ? 'border-slate-600' : ''}
          >
            Discreet
          </Button>
          <Button
            variant={filterTier === 'courier' ? 'default' : 'outline'}
            onClick={() => setFilterTier('courier')}
            className={filterTier !== 'courier' ? 'border-slate-600' : ''}
          >
            Courier
          </Button>
        </div>
      </div>

      {/* Clients List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredClients.map((client) => (
          <Link key={client.id} href={`/admin/clients/${client.id}`}>
            <Card className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  {/* Client Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 rounded-full ${client.isVIP ? 'bg-purple-500/20' : 'bg-blue-500/20'}`}>
                      {client.isVIP ? (
                        <Shield className="h-6 w-6 text-purple-500" />
                      ) : (
                        <Users className="h-6 w-6 text-blue-500" />
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-white text-lg">{client.name}</h3>
                        {client.isVIP && (
                          <Star className="h-4 w-4 text-purple-500 fill-purple-500" />
                        )}
                        <Badge className={getTierColor(client.tier)}>
                          {getTierLabel(client.tier)}
                        </Badge>
                        <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                          {client.status}
                        </Badge>
                      </div>

                      {client.company && (
                        <p className="text-sm text-slate-400">{client.company}</p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span className="font-mono text-slate-500">{client.code}</span>
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {client.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {client.phone}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {client.tags.map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs text-slate-400 border-slate-600">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-8 text-center">
                    <div>
                      <p className="text-2xl font-bold text-white">{client.totalOrders}</p>
                      <p className="text-xs text-slate-500">Orders</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-500">${client.totalRevenue.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">Revenue</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">{new Date(client.lastOrder).toLocaleDateString()}</p>
                      <p className="text-xs text-slate-500">Last Order</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No clients found matching your search.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
