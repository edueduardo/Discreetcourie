'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  CreditCard,
  DollarSign,
  Download,
  Eye,
  FileText,
  Plus,
  RefreshCw,
  Search,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Send,
  ExternalLink
} from 'lucide-react'

interface Payment {
  id: string
  clientName: string
  amount: number
  status: 'succeeded' | 'pending' | 'failed' | 'refunded'
  method: 'card' | 'ach' | 'wire'
  date: string
  invoiceId?: string
  last4?: string
}

interface Invoice {
  id: string
  clientName: string
  amount: number
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  dueDate: string
  items: number
}

const statusColors = {
  succeeded: 'bg-green-500',
  pending: 'bg-yellow-500',
  failed: 'bg-red-500',
  refunded: 'bg-slate-500',
  draft: 'bg-slate-500',
  sent: 'bg-blue-500',
  paid: 'bg-green-500',
  overdue: 'bg-red-500'
}

const statusIcons = {
  succeeded: CheckCircle,
  pending: Clock,
  failed: XCircle,
  refunded: RefreshCw
}

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [payments] = useState<Payment[]>([
    { id: 'pay_1', clientName: 'VIP Client A', amount: 450.00, status: 'succeeded', method: 'card', date: '2026-01-13', last4: '4242' },
    { id: 'pay_2', clientName: 'Client B', amount: 125.00, status: 'succeeded', method: 'card', date: '2026-01-13', last4: '1234' },
    { id: 'pay_3', clientName: 'Client C', amount: 275.00, status: 'pending', method: 'ach', date: '2026-01-12' },
    { id: 'pay_4', clientName: 'VIP Client D', amount: 850.00, status: 'succeeded', method: 'wire', date: '2026-01-12' },
    { id: 'pay_5', clientName: 'Client E', amount: 95.00, status: 'failed', method: 'card', date: '2026-01-11', last4: '5678' },
    { id: 'pay_6', clientName: 'Client F', amount: 200.00, status: 'refunded', method: 'card', date: '2026-01-10', last4: '9012' },
  ])

  const [invoices] = useState<Invoice[]>([
    { id: 'inv_001', clientName: 'VIP Client A', amount: 1250.00, status: 'paid', dueDate: '2026-01-15', items: 3 },
    { id: 'inv_002', clientName: 'Client B', amount: 450.00, status: 'sent', dueDate: '2026-01-20', items: 2 },
    { id: 'inv_003', clientName: 'Client C', amount: 780.00, status: 'overdue', dueDate: '2026-01-10', items: 4 },
    { id: 'inv_004', clientName: 'VIP Client D', amount: 2100.00, status: 'draft', dueDate: '2026-01-25', items: 5 },
  ])

  const totalRevenue = payments.filter(p => p.status === 'succeeded').reduce((sum, p) => sum + p.amount, 0)
  const pendingAmount = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)
  const failedAmount = payments.filter(p => p.status === 'failed').reduce((sum, p) => sum + p.amount, 0)

  const filteredPayments = payments.filter(p =>
    p.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Payments & Invoicing</h1>
          <p className="text-slate-400">Stripe integration for payment processing</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-600">
            <ExternalLink className="h-4 w-4 mr-2" />
            Stripe Dashboard
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-white">${totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Pending</p>
                <p className="text-2xl font-bold text-white">${pendingAmount.toFixed(2)}</p>
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
                <p className="text-2xl font-bold text-white">${failedAmount.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">This Month</p>
                <p className="text-2xl font-bold text-white">+23%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="payments" className="data-[state=active]:bg-blue-600">
            <CreditCard className="h-4 w-4 mr-2" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="invoices" className="data-[state=active]:bg-blue-600">
            <FileText className="h-4 w-4 mr-2" />
            Invoices
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Recent Payments</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="Search payments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 bg-slate-700 border-slate-600 text-white w-64"
                    />
                  </div>
                  <Button variant="outline" size="icon" className="border-slate-600">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredPayments.map((payment) => {
                  const StatusIcon = statusIcons[payment.status]
                  return (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${statusColors[payment.status]}/20`}>
                          <StatusIcon className={`h-5 w-5 ${
                            payment.status === 'succeeded' ? 'text-green-500' :
                            payment.status === 'pending' ? 'text-yellow-500' :
                            payment.status === 'failed' ? 'text-red-500' : 'text-slate-400'
                          }`} />
                        </div>
                        <div>
                          <p className="text-white font-medium">{payment.clientName}</p>
                          <p className="text-slate-400 text-sm">
                            {payment.method === 'card' && payment.last4 ? `•••• ${payment.last4}` : payment.method.toUpperCase()}
                            {' • '}{payment.date}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className={`${statusColors[payment.status]} text-white`}>
                          {payment.status}
                        </Badge>
                        <p className="text-white font-bold text-lg">${payment.amount.toFixed(2)}</p>
                        <Button variant="ghost" size="icon" className="text-slate-400">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Invoices</CardTitle>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Invoice
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-slate-600 rounded-lg">
                        <FileText className="h-5 w-5 text-slate-300" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{invoice.id}</p>
                        <p className="text-slate-400 text-sm">
                          {invoice.clientName} • {invoice.items} items
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-slate-400 text-sm">Due {invoice.dueDate}</p>
                      </div>
                      <Badge className={`${statusColors[invoice.status]} text-white`}>
                        {invoice.status}
                      </Badge>
                      <p className="text-white font-bold text-lg">${invoice.amount.toFixed(2)}</p>
                      <div className="flex gap-1">
                        {invoice.status === 'draft' && (
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            <Send className="h-3 w-3 mr-1" />
                            Send
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="text-slate-400">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
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
            Stripe Configuration
          </CardTitle>
          <CardDescription className="text-slate-400">
            Configure your Stripe API keys to enable payment processing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Publishable Key</label>
              <Input
                placeholder="pk_live_..."
                className="bg-slate-700 border-slate-600 text-white font-mono"
                type="password"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Secret Key</label>
              <Input
                placeholder="sk_live_..."
                className="bg-slate-700 border-slate-600 text-white font-mono"
                type="password"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <AlertCircle className="h-4 w-4" />
            <span>Add STRIPE_PUBLISHABLE_KEY and STRIPE_SECRET_KEY to your .env file</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
