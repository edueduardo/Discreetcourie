'use client'

import { useEffect, useState } from 'react'
import { 
  FileText, 
  Download, 
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Plus
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Invoice {
  id: string
  invoice_number: string
  client_id: string
  client_name: string
  amount: number
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  due_date: string
  paid_at?: string
  created_at: string
  items: { description: string; quantity: number; price: number }[]
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

  useEffect(() => {
    fetchInvoices()
  }, [])

  async function fetchInvoices() {
    try {
      const res = await fetch('/api/invoices')
      if (res.ok) {
        const data = await res.json()
        setInvoices(data.invoices || [])
      } else {
        // Use mock data
        setInvoices(getMockInvoices())
      }
    } catch (error) {
      setInvoices(getMockInvoices())
    } finally {
      setLoading(false)
    }
  }

  async function downloadPDF(invoiceId: string, invoiceNumber: string) {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`)
      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${invoiceNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('PDF download error:', error)
      alert('Failed to download PDF. Please try again.')
    }
  }

  function getMockInvoices(): Invoice[] {
    return [
      {
        id: '1',
        invoice_number: 'INV-2024-001',
        client_id: 'c1',
        client_name: 'Columbus Medical Center',
        amount: 350,
        status: 'paid',
        due_date: '2024-03-15',
        paid_at: '2024-03-14',
        created_at: '2024-03-01',
        items: [
          { description: 'Express Delivery - Medical Supplies', quantity: 5, price: 50 },
          { description: 'Same-Day Pickup', quantity: 5, price: 20 }
        ]
      },
      {
        id: '2',
        invoice_number: 'INV-2024-002',
        client_id: 'c2',
        client_name: 'Smith & Associates Law',
        amount: 175,
        status: 'pending',
        due_date: '2024-03-20',
        created_at: '2024-03-10',
        items: [
          { description: 'Confidential Document Delivery', quantity: 3, price: 45 },
          { description: 'Rush Fee', quantity: 1, price: 40 }
        ]
      },
      {
        id: '3',
        invoice_number: 'INV-2024-003',
        client_id: 'c3',
        client_name: 'HealthFirst Pharmacy',
        amount: 225,
        status: 'overdue',
        due_date: '2024-03-01',
        created_at: '2024-02-15',
        items: [
          { description: 'Prescription Delivery', quantity: 9, price: 25 }
        ]
      }
    ]
  }

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      inv.client_name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: invoices.reduce((sum, inv) => sum + inv.amount, 0),
    paid: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0),
    pending: invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.amount, 0),
    overdue: invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0)
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'paid':
        return <span className="flex items-center gap-1 text-green-400"><CheckCircle size={14} /> Paid</span>
      case 'pending':
        return <span className="flex items-center gap-1 text-yellow-400"><Clock size={14} /> Pending</span>
      case 'overdue':
        return <span className="flex items-center gap-1 text-red-400"><AlertCircle size={14} /> Overdue</span>
      default:
        return <span className="text-slate-400">{status}</span>
    }
  }

  if (loading) {
    return <div className="p-6 text-center">Loading invoices...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText /> Invoices
        </h1>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus size={16} className="mr-2" /> New Invoice
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <p className="text-slate-400 text-sm">Total</p>
            <p className="text-2xl font-bold">${stats.total.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <p className="text-green-400 text-sm">Paid</p>
            <p className="text-2xl font-bold text-green-400">${stats.paid.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <p className="text-yellow-400 text-sm">Pending</p>
            <p className="text-2xl font-bold text-yellow-400">${stats.pending.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <p className="text-red-400 text-sm">Overdue</p>
            <p className="text-2xl font-bold text-red-400">${stats.overdue.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-4 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input
                placeholder="Search invoices..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left p-4 text-slate-400">Invoice #</th>
                  <th className="text-left p-4 text-slate-400">Client</th>
                  <th className="text-left p-4 text-slate-400">Amount</th>
                  <th className="text-left p-4 text-slate-400">Status</th>
                  <th className="text-left p-4 text-slate-400">Due Date</th>
                  <th className="text-left p-4 text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-slate-700/50 hover:bg-slate-750">
                    <td className="p-4 font-mono text-blue-400">{invoice.invoice_number}</td>
                    <td className="p-4">{invoice.client_name}</td>
                    <td className="p-4 font-semibold">${invoice.amount.toLocaleString()}</td>
                    <td className="p-4">{getStatusBadge(invoice.status)}</td>
                    <td className="p-4 text-slate-400">{new Date(invoice.due_date).toLocaleDateString()}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedInvoice(invoice)}
                        >
                          <Eye size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadPDF(invoice.id, invoice.invoice_number)}
                          title="Download PDF"
                        >
                          <Download size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredInvoices.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              No invoices found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="bg-slate-800 border-slate-700 w-full max-w-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{selectedInvoice.invoice_number}</CardTitle>
              <Button variant="ghost" onClick={() => setSelectedInvoice(null)}>×</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Client</span>
                <span>{selectedInvoice.client_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status</span>
                {getStatusBadge(selectedInvoice.status)}
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Due Date</span>
                <span>{new Date(selectedInvoice.due_date).toLocaleDateString()}</span>
              </div>
              
              <hr className="border-slate-700" />
              
              <div>
                <h4 className="font-semibold mb-2">Items</h4>
                {selectedInvoice.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm py-1">
                    <span>{item.description} × {item.quantity}</span>
                    <span>${(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              
              <hr className="border-slate-700" />
              
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${selectedInvoice.amount.toLocaleString()}</span>
              </div>

              <div className="flex gap-2 pt-4">
                {selectedInvoice.status === 'pending' && (
                  <Button className="flex-1 bg-green-600 hover:bg-green-700">
                    Mark as Paid
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => downloadPDF(selectedInvoice.id, selectedInvoice.invoice_number)}
                >
                  <Download size={16} className="mr-2" /> Download PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
