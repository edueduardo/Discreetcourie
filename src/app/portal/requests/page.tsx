'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Send, Clock, CheckCircle, MessageSquare } from 'lucide-react'

interface ServiceRequest {
  id: string
  type: string
  title: string
  description: string
  status: string
  priority: string
  created_at: string
  updated_at?: string
  response?: string
}

const REQUEST_TYPES = [
  { value: 'delivery', label: 'New Delivery Request' },
  { value: 'vault', label: 'Vault Access' },
  { value: 'concierge', label: 'Concierge Service' },
  { value: 'support', label: 'Support Request' },
  { value: 'billing', label: 'Billing Question' },
  { value: 'other', label: 'Other' }
]

export default function RequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    type: 'delivery',
    title: '',
    description: '',
    priority: 'normal'
  })

  useEffect(() => {
    fetchRequests()
  }, [])

  async function fetchRequests() {
    setLoading(true)
    try {
      const res = await fetch('/api/concierge?my_requests=true')
      if (res.ok) {
        const data = await res.json()
        setRequests(data.tasks || [])
      }
    } catch (error) {

    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const res = await fetch('/api/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: formData.type,
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          source: 'portal'
        })
      })
      
      if (res.ok) {
        setShowForm(false)
        setFormData({ type: 'delivery', title: '', description: '', priority: 'normal' })
        fetchRequests()
      }
    } catch (error) {

    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500'
      case 'in_progress': return 'text-blue-500'
      case 'pending': return 'text-yellow-500'
      default: return 'text-gray-500'
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/portal/dashboard" className="text-gray-400 hover:text-white">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Service Requests</h1>
              <p className="text-gray-400">Submit and track your requests</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
          >
            <Plus className="h-4 w-4" />
            New Request
          </button>
        </div>

        {/* New Request Form */}
        {showForm && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">New Service Request</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Request Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-gray-700 rounded px-3 py-2"
                  >
                    {REQUEST_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full bg-gray-700 rounded px-3 py-2"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Brief description of your request"
                  className="w-full bg-gray-700 rounded px-3 py-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Details</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide all relevant details..."
                  rows={4}
                  className="w-full bg-gray-700 rounded px-3 py-2"
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Requests List */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">No service requests yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-blue-400 hover:underline"
            >
              Submit your first request
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 bg-gray-700 rounded capitalize">
                        {request.type}
                      </span>
                      <span className={`text-xs ${getStatusColor(request.status)} capitalize`}>
                        {request.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="font-medium mt-2">{request.title}</h3>
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                      {request.description}
                    </p>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(request.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                {request.response && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="text-xs text-gray-500 mb-1">Response:</div>
                    <p className="text-sm text-gray-300">{request.response}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
