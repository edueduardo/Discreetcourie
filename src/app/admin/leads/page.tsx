'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Users,
  Phone,
  Mail,
  Building,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Calendar,
  TrendingUp,
  X,
  Tag,
  MapPin
} from 'lucide-react'

interface Lead {
  id: string
  name: string
  company?: string
  phone: string
  email: string
  source: 'cold-call' | 'referral' | 'website' | 'networking' | 'other'
  status: 'new' | 'contacted' | 'meeting-scheduled' | 'proposal-sent' | 'won' | 'lost'
  potential_value: number  // Monthly estimate
  tags: string[]
  notes: string
  next_followup?: string
  created_at: string
}

// Status mapping for API compatibility
const statusMap: Record<string, string> = {
  'new': 'new',
  'contacted': 'contacted',
  'qualified': 'meeting-scheduled',
  'proposal': 'proposal-sent',
  'won': 'won',
  'lost': 'lost'
}

const statusColumns = [
  { id: 'new', label: 'New Leads', color: 'blue' },
  { id: 'contacted', label: 'Contacted', color: 'yellow' },
  { id: 'meeting-scheduled', label: 'Meeting Set', color: 'purple' },
  { id: 'proposal-sent', label: 'Proposal Sent', color: 'orange' },
  { id: 'won', label: 'Won', color: 'green' },
  { id: 'lost', label: 'Lost', color: 'red' }
]

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeads()
  }, [])

  async function fetchLeads() {
    try {
      const res = await fetch('/api/leads')
      const data = await res.json()
      if (data.leads) {
        setLeads(data.leads.map((l: any) => ({
          id: l.id,
          name: l.name,
          company: l.company || '',
          phone: l.phone || '',
          email: l.email || '',
          source: l.source || 'other',
          status: Object.keys(statusMap).find(k => statusMap[k] === l.status) || l.status || 'new',
          potential_value: parseFloat(l.potential_value) || 0,
          tags: l.tags || [],
          notes: l.notes || '',
          next_followup: l.next_followup,
          created_at: l.created_at?.split('T')[0] || new Date().toISOString().split('T')[0]
        })))
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setLoading(false)
    }
  }
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [filterSource, setFilterSource] = useState<string>('all')

  const getStatusColor = (status: string) => {
    const column = statusColumns.find(c => c.id === status)
    switch (column?.color) {
      case 'blue': return 'bg-blue-500/20 text-blue-500 border-blue-500/30'
      case 'yellow': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'
      case 'purple': return 'bg-purple-500/20 text-purple-500 border-purple-500/30'
      case 'orange': return 'bg-orange-500/20 text-orange-500 border-orange-500/30'
      case 'green': return 'bg-green-500/20 text-green-500 border-green-500/30'
      case 'red': return 'bg-red-500/20 text-red-500 border-red-500/30'
      default: return 'bg-slate-500/20 text-slate-500'
    }
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'referral': return '🤝'
      case 'website': return '🌐'
      case 'cold-call': return '📞'
      case 'networking': return '👥'
      default: return '📝'
    }
  }

  const getLeadsByStatus = (status: string) => {
    return leads.filter(lead => {
      const matchesStatus = lead.status === status
      const matchesSource = filterSource === 'all' || lead.source === filterSource
      return matchesStatus && matchesSource
    })
  }

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    active: leads.filter(l => ['contacted', 'meeting-scheduled', 'proposal-sent'].includes(l.status)).length,
    won: leads.filter(l => l.status === 'won').length,
    potential_revenue: leads.filter(l => l.status !== 'lost' && l.status !== 'won').reduce((sum, l) => sum + l.potential_value, 0)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-500" />
            Lead Pipeline
          </h1>
          <p className="text-slate-400">Track and manage potential clients</p>
        </div>
        <div className="flex gap-2">
          <Select value={filterSource} onValueChange={setFilterSource}>
            <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="cold-call">Cold Call</SelectItem>
              <SelectItem value="referral">Referral</SelectItem>
              <SelectItem value="website">Website</SelectItem>
              <SelectItem value="networking">Networking</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setShowNewForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Lead
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Leads</p>
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
                <p className="text-slate-400 text-sm">New</p>
                <p className="text-2xl font-bold text-blue-500">{stats.new}</p>
              </div>
              <Plus className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Active</p>
                <p className="text-2xl font-bold text-yellow-500">{stats.active}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Won</p>
                <p className="text-2xl font-bold text-green-500">{stats.won}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Potential $/mo</p>
                <p className="text-2xl font-bold text-white">${stats.potential_revenue}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statusColumns.map(column => {
          const columnLeads = getLeadsByStatus(column.id)
          return (
            <div key={column.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white text-sm">{column.label}</h3>
                <Badge variant="outline" className={getStatusColor(column.id)}>
                  {columnLeads.length}
                </Badge>
              </div>

              <div className="space-y-2 min-h-[400px]">
                {columnLeads.map(lead => (
                  <Card
                    key={lead.id}
                    className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-white text-sm">{lead.name}</p>
                          {lead.company && (
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {lead.company}
                            </p>
                          )}
                        </div>
                        <span className="text-lg">{getSourceIcon(lead.source)}</span>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-green-500">
                        <DollarSign className="h-3 w-3" />
                        ${lead.potential_value}/mo
                      </div>

                      {lead.next_followup && (
                        <div className="flex items-center gap-1 text-xs text-yellow-500">
                          <Calendar className="h-3 w-3" />
                          {new Date(lead.next_followup).toLocaleDateString()}
                        </div>
                      )}

                      {lead.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {lead.tags.slice(0, 2).map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-xs text-slate-400 border-slate-600">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {columnLeads.length === 0 && (
                  <div className="h-20 rounded-lg border-2 border-dashed border-slate-700 flex items-center justify-center">
                    <p className="text-xs text-slate-600">No leads</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="bg-slate-800 border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-white flex items-center gap-2">
                    {selectedLead.name}
                    <Badge className={getStatusColor(selectedLead.status)}>
                      {statusColumns.find(c => c.id === selectedLead.status)?.label}
                    </Badge>
                  </CardTitle>
                  {selectedLead.company && (
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Building className="h-4 w-4" />
                      {selectedLead.company}
                    </CardDescription>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedLead(null)}
                  className="text-slate-400"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Contact Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-300">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Phone className="h-4 w-4" />
                    <a href={`tel:${selectedLead.phone}`} className="hover:text-white">
                      {selectedLead.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${selectedLead.email}`} className="hover:text-white">
                      {selectedLead.email}
                    </a>
                  </div>
                </div>
              </div>

              {/* Potential Value & Source */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                  <p className="text-xs text-slate-500 mb-1">Potential Value</p>
                  <p className="text-lg font-bold text-green-500">${selectedLead.potential_value}/mo</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                  <p className="text-xs text-slate-500 mb-1">Source</p>
                  <p className="text-lg font-semibold text-white capitalize">
                    {getSourceIcon(selectedLead.source)} {selectedLead.source.replace('-', ' ')}
                  </p>
                </div>
              </div>

              {/* Next Follow-up */}
              {selectedLead.next_followup && (
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-yellow-500" />
                    <div>
                      <p className="text-xs text-yellow-500 font-medium">Next Follow-up</p>
                      <p className="text-sm text-white">{new Date(selectedLead.next_followup).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tags */}
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedLead.tags.map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-slate-300 border-slate-600">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-2">Notes</h3>
                <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                  <p className="text-sm text-slate-300">{selectedLead.notes}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-700">
                <Button variant="outline" className="flex-1 border-slate-600">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" className="flex-1 border-slate-600 text-red-500 hover:text-red-400">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Convert to Client
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* New Lead Form */}
      {showNewForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="bg-slate-800 border-slate-700 w-full max-w-lg">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-blue-500" />
                New Lead
              </CardTitle>
              <CardDescription>Add a potential client to your pipeline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400">Name *</label>
                  <Input
                    placeholder="John Doe"
                    className="mt-1 bg-slate-900 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400">Company</label>
                  <Input
                    placeholder="ABC Company"
                    className="mt-1 bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400">Phone *</label>
                  <Input
                    placeholder="(614) 555-0123"
                    className="mt-1 bg-slate-900 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400">Email *</label>
                  <Input
                    type="email"
                    placeholder="john@company.com"
                    className="mt-1 bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400">Source *</label>
                  <Select>
                    <SelectTrigger className="mt-1 bg-slate-900 border-slate-700 text-white">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cold-call">Cold Call</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="networking">Networking</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Potential Value ($/month)</label>
                  <Input
                    type="number"
                    placeholder="500"
                    className="mt-1 bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-400">Notes</label>
                <Textarea
                  placeholder="What did you discuss? What are their needs?"
                  rows={3}
                  className="mt-1 bg-slate-900 border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400">Next Follow-up Date</label>
                <Input
                  type="date"
                  className="mt-1 bg-slate-900 border-slate-700 text-white"
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
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Create Lead
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
