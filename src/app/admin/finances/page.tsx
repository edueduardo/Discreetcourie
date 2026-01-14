'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Receipt,
  PiggyBank,
  AlertCircle,
  Download,
  Plus,
  Edit,
  Trash2,
  CreditCard,
  Fuel,
  Wrench,
  FileText,
  Target
} from 'lucide-react'

// Types
interface Revenue {
  id: string
  date: string
  client: string
  service: string
  amount: number
  status: 'paid' | 'pending' | 'overdue'
}

interface Expense {
  id: string
  date: string
  category: 'gas' | 'maintenance' | 'insurance' | 'other'
  description: string
  amount: number
}

const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toLocaleString('default', { month: 'long', year: 'numeric' })

export default function FinancesPage() {
  const [revenues, setRevenues] = useState<Revenue[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [newExpense, setNewExpense] = useState({ date: new Date().toISOString().split('T')[0], category: 'fuel', description: '', amount: '' })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [expensesRes, ordersRes, paymentsRes] = await Promise.all([
        fetch('/api/expenses'),
        fetch('/api/orders'),
        fetch('/api/payments')
      ])
      
      const expensesData = await expensesRes.json()
      const ordersData = await ordersRes.json()
      const paymentsData = await paymentsRes.json()
      
      // Map expenses
      if (expensesData.expenses) {
        setExpenses(expensesData.expenses.map((e: any) => ({
          id: e.id,
          date: e.date,
          category: e.category === 'fuel' ? 'gas' : e.category,
          description: e.description,
          amount: parseFloat(e.amount)
        })))
      }
      
      // Map orders to revenue
      if (ordersData.orders) {
        const revenueList = ordersData.orders
          .filter((o: any) => o.price > 0)
          .map((o: any) => ({
            id: o.id,
            date: o.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            client: o.clients?.name || o.clients?.company || 'Client',
            service: o.is_confidential ? 'Discreet Delivery' : 'Courier Delivery',
            amount: parseFloat(o.price) || 0,
            status: o.paid ? 'paid' : 'pending'
          }))
        setRevenues(revenueList)
      }
    } catch (error) {
      console.error('Error fetching finance data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddExpense() {
    if (!newExpense.description || !newExpense.amount) return
    
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: newExpense.description,
          amount: parseFloat(newExpense.amount),
          category: newExpense.category,
          date: newExpense.date
        })
      })
      
      if (res.ok) {
        fetchData()
        setShowAddExpense(false)
        setNewExpense({ date: new Date().toISOString().split('T')[0], category: 'fuel', description: '', amount: '' })
      }
    } catch (error) {
      console.error('Error adding expense:', error)
    }
  }

  // Calculate stats from real data
  const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const profit = totalRevenue - totalExpenses
  const taxReserve = profit * 0.25
  const avgOrderValue = revenues.length > 0 ? totalRevenue / revenues.length : 0

  const stats = {
    thisMonth: {
      revenue: totalRevenue,
      expenses: totalExpenses,
      profit: profit,
      taxReserve: taxReserve,
      orders: revenues.length,
      avgOrderValue: avgOrderValue
    },
    lastMonth: {
      revenue: totalRevenue * 0.9, // Placeholder - ideally filter by date
      expenses: totalExpenses * 0.9,
      profit: profit * 0.9,
      orders: Math.max(revenues.length - 1, 0)
    }
  }

  const revenueChange = stats.lastMonth.revenue > 0 ? ((stats.thisMonth.revenue - stats.lastMonth.revenue) / stats.lastMonth.revenue * 100).toFixed(1) : '0'
  const profitChange = stats.lastMonth.profit > 0 ? ((stats.thisMonth.profit - stats.lastMonth.profit) / stats.lastMonth.profit * 100).toFixed(1) : '0'
  const isRevenueUp = Number(revenueChange) > 0
  const isProfitUp = Number(profitChange) > 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500/20 text-green-500'
      case 'pending': return 'bg-yellow-500/20 text-yellow-500'
      case 'overdue': return 'bg-red-500/20 text-red-500'
      default: return 'bg-slate-500/20 text-slate-500'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'gas': return <Fuel className="h-4 w-4" />
      case 'maintenance': return <Wrench className="h-4 w-4" />
      case 'insurance': return <FileText className="h-4 w-4" />
      default: return <Receipt className="h-4 w-4" />
    }
  }

  const projectedAnnualRevenue = stats.thisMonth.revenue * 12
  const projectedAnnualProfit = stats.thisMonth.profit * 12
  const projectedAnnualTax = stats.thisMonth.taxReserve * 12

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-green-500" />
            Financial Dashboard
          </h1>
          <p className="text-slate-400">Track revenue, expenses, and profitability</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-600">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowAddExpense(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue This Month */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-slate-400 text-sm">Revenue ({currentMonth})</p>
                <p className="text-3xl font-bold text-white">${stats.thisMonth.revenue.toFixed(2)}</p>
                <div className={`flex items-center gap-1 text-xs ${isRevenueUp ? 'text-green-500' : 'text-red-500'}`}>
                  {isRevenueUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  <span>{Math.abs(Number(revenueChange))}% vs last month</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-green-500/20">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expenses This Month */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-slate-400 text-sm">Expenses ({currentMonth})</p>
                <p className="text-3xl font-bold text-white">${stats.thisMonth.expenses.toFixed(2)}</p>
                <p className="text-xs text-slate-500">
                  {((stats.thisMonth.expenses / stats.thisMonth.revenue) * 100).toFixed(0)}% of revenue
                </p>
              </div>
              <div className="p-3 rounded-full bg-red-500/20">
                <Receipt className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Net Profit */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-slate-400 text-sm">Net Profit</p>
                <p className="text-3xl font-bold text-white">${stats.thisMonth.profit.toFixed(2)}</p>
                <div className={`flex items-center gap-1 text-xs ${isProfitUp ? 'text-green-500' : 'text-red-500'}`}>
                  {isProfitUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  <span>{Math.abs(Number(profitChange))}% vs last month</span>
                </div>
              </div>
              <div className="p-3 rounded-full bg-blue-500/20">
                <TrendingUp className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tax Reserve */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-slate-400 text-sm">Tax Reserve (25%)</p>
                <p className="text-3xl font-bold text-white">${stats.thisMonth.taxReserve.toFixed(2)}</p>
                <p className="text-xs text-yellow-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Set aside for taxes
                </p>
              </div>
              <div className="p-3 rounded-full bg-yellow-500/20">
                <PiggyBank className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Avg Order Value</p>
                <p className="text-xl font-bold text-white">${stats.thisMonth.avgOrderValue.toFixed(2)}</p>
              </div>
              <Target className="h-6 w-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Orders</p>
                <p className="text-xl font-bold text-white">{stats.thisMonth.orders}</p>
              </div>
              <Calendar className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Profit Margin</p>
                <p className="text-xl font-bold text-white">
                  {((stats.thisMonth.profit / stats.thisMonth.revenue) * 100).toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projections */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            Annual Projections (Based on Current Month)
          </CardTitle>
          <CardDescription>If you maintain this month's performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-slate-400 text-sm mb-1">Projected Annual Revenue</p>
              <p className="text-2xl font-bold text-white">${projectedAnnualRevenue.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Projected Annual Profit</p>
              <p className="text-2xl font-bold text-green-500">${projectedAnnualProfit.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Total Tax Reserve Needed</p>
              <p className="text-2xl font-bold text-yellow-500">${projectedAnnualTax.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Revenue and Expenses */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
        </TabsList>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Revenue This Month</CardTitle>
              <CardDescription>All income from deliveries and services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {revenues.map((revenue) => (
                  <div
                    key={revenue.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-700"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-2 rounded-lg bg-green-500/20">
                        <CreditCard className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">{revenue.client}</p>
                          <Badge className={getStatusColor(revenue.status)}>
                            {revenue.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-400">{revenue.service}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-500">+${revenue.amount.toFixed(2)}</p>
                        <p className="text-xs text-slate-500">{new Date(revenue.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Expenses This Month</CardTitle>
              <CardDescription>All business costs and operating expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-700 group hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-2 rounded-lg bg-red-500/20">
                        {getCategoryIcon(expense.category)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-white capitalize">{expense.category}</p>
                        <p className="text-sm text-slate-400">{expense.description}</p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <p className="text-lg font-bold text-red-500">-${expense.amount.toFixed(2)}</p>
                          <p className="text-xs text-slate-500">{new Date(expense.date).toLocaleDateString()}</p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Breakdown Tab */}
        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Revenue by Service */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Revenue by Service Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Guardian Mode</span>
                  <span className="font-bold text-white">$500.00</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Concierge Tasks</span>
                  <span className="font-bold text-white">$120.00</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Vault Storage</span>
                  <span className="font-bold text-white">$100.00</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Premium Delivery</span>
                  <span className="font-bold text-white">$75.00</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Discreet Delivery</span>
                  <span className="font-bold text-white">$65.00</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Document Delivery</span>
                  <span className="font-bold text-white">$50.00</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Courier Delivery</span>
                  <span className="font-bold text-white">$45.00</span>
                </div>
              </CardContent>
            </Card>

            {/* Expenses by Category */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Expenses by Category</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-400">Insurance</span>
                  </div>
                  <span className="font-bold text-white">$185.00</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Fuel className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-400">Gas</span>
                  </div>
                  <span className="font-bold text-white">$123.70</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-400">Maintenance</span>
                  </div>
                  <span className="font-bold text-white">$89.99</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-400">Other</span>
                  </div>
                  <span className="font-bold text-white">$45.00</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="bg-slate-800 border-slate-700 w-full max-w-lg">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-green-500" />
                Add Expense
              </CardTitle>
              <CardDescription>Record a new business expense</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-slate-400">Date</label>
                <input
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                  className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400">Category</label>
                <select 
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                  className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  <option value="fuel">Gas / Fuel</option>
                  <option value="maintenance">Maintenance / Repairs</option>
                  <option value="insurance">Insurance</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-slate-400">Description</label>
                <input
                  type="text"
                  placeholder="e.g., Shell Gas Station"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                  className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                  className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAddExpense(false)}
                  className="flex-1 border-slate-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddExpense}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Add Expense
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
