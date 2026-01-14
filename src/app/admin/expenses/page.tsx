'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Receipt,
  Plus,
  Download,
  Filter,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Fuel,
  Car,
  Wrench,
  FileText,
  CreditCard,
  PieChart,
  Edit,
  Trash2,
  Eye,
  Upload,
  CheckCircle
} from 'lucide-react'

interface Expense {
  id: string
  description: string
  amount: number
  category: 'fuel' | 'vehicle' | 'maintenance' | 'supplies' | 'insurance' | 'other'
  date: string
  vendor: string
  receiptUrl?: string
  status: 'pending' | 'approved' | 'rejected'
  notes?: string
}

const categoryColors = {
  fuel: 'bg-orange-500',
  vehicle: 'bg-blue-500',
  maintenance: 'bg-yellow-500',
  supplies: 'bg-purple-500',
  insurance: 'bg-green-500',
  other: 'bg-slate-500'
}

const categoryIcons = {
  fuel: Fuel,
  vehicle: Car,
  maintenance: Wrench,
  supplies: FileText,
  insurance: CheckCircle,
  other: Receipt
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: '1', description: 'Gas - Fleet Vehicle #1', amount: 78.50, category: 'fuel', date: '2026-01-13', vendor: 'Shell', status: 'approved' },
    { id: '2', description: 'Oil Change - Van #2', amount: 65.00, category: 'maintenance', date: '2026-01-12', vendor: 'Jiffy Lube', status: 'approved' },
    { id: '3', description: 'Delivery Bags (10 pack)', amount: 125.00, category: 'supplies', date: '2026-01-11', vendor: 'Amazon', status: 'pending' },
    { id: '4', description: 'Monthly Insurance Premium', amount: 450.00, category: 'insurance', date: '2026-01-10', vendor: 'State Farm', status: 'approved' },
    { id: '5', description: 'Tire Replacement', amount: 320.00, category: 'vehicle', date: '2026-01-09', vendor: 'Discount Tire', status: 'approved' },
    { id: '6', description: 'Gas - Fleet Vehicle #2', amount: 82.30, category: 'fuel', date: '2026-01-08', vendor: 'BP', status: 'approved' },
    { id: '7', description: 'Brake Pads Replacement', amount: 180.00, category: 'maintenance', date: '2026-01-07', vendor: 'Midas', status: 'pending' },
  ])

  const [showNewExpense, setShowNewExpense] = useState(false)
  const [newExpense, setNewExpense] = useState<{
    description: string
    amount: string
    category: Expense['category']
    vendor: string
    notes: string
  }>({
    description: '',
    amount: '',
    category: 'fuel',
    vendor: '',
    notes: ''
  })
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const approvedExpenses = expenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.amount, 0)
  const pendingExpenses = expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0)

  const expensesByCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount
    return acc
  }, {} as Record<string, number>)

  const addExpense = () => {
    if (!newExpense.description || !newExpense.amount || !newExpense.vendor) return
    setExpenses([{
      id: Date.now().toString(),
      description: newExpense.description,
      amount: parseFloat(newExpense.amount),
      category: newExpense.category,
      date: new Date().toISOString().split('T')[0],
      vendor: newExpense.vendor,
      status: 'pending',
      notes: newExpense.notes
    }, ...expenses])
    setNewExpense({ description: '', amount: '', category: 'fuel', vendor: '', notes: '' })
    setShowNewExpense(false)
  }

  const deleteExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id))
  }

  const filteredExpenses = filterCategory === 'all' 
    ? expenses 
    : expenses.filter(e => e.category === filterCategory)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Expense Tracking</h1>
          <p className="text-slate-400">Track and manage business expenses</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-600">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button 
            onClick={() => setShowNewExpense(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Expenses</p>
                <p className="text-2xl font-bold text-white">${totalExpenses.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Approved</p>
                <p className="text-2xl font-bold text-white">${approvedExpenses.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Receipt className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Pending</p>
                <p className="text-2xl font-bold text-white">${pendingExpenses.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Fuel className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Fuel This Month</p>
                <p className="text-2xl font-bold text-white">${(expensesByCategory['fuel'] || 0).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {showNewExpense && (
            <Card className="bg-slate-800 border-blue-500">
              <CardHeader>
                <CardTitle className="text-white">New Expense</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Description</label>
                    <Input
                      placeholder="Expense description"
                      value={newExpense.description}
                      onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Amount</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Category</label>
                    <select
                      value={newExpense.category}
                      onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value as Expense['category'] })}
                      className="w-full bg-slate-700 border-slate-600 text-white rounded-md px-3 py-2"
                    >
                      <option value="fuel">Fuel</option>
                      <option value="vehicle">Vehicle</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="supplies">Supplies</option>
                      <option value="insurance">Insurance</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Vendor</label>
                    <Input
                      placeholder="Vendor name"
                      value={newExpense.vendor}
                      onChange={(e) => setNewExpense({ ...newExpense, vendor: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Notes (optional)</label>
                  <Textarea
                    placeholder="Additional notes..."
                    value={newExpense.notes}
                    onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={addExpense} className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Expense
                  </Button>
                  <Button variant="outline" className="border-slate-600" onClick={() => setShowNewExpense(false)}>
                    Cancel
                  </Button>
                  <Button variant="outline" className="border-slate-600 ml-auto">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Receipt
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Recent Expenses</CardTitle>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-400" />
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white rounded-md px-3 py-1 text-sm"
                  >
                    <option value="all">All Categories</option>
                    <option value="fuel">Fuel</option>
                    <option value="vehicle">Vehicle</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="supplies">Supplies</option>
                    <option value="insurance">Insurance</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredExpenses.map((expense) => {
                  const CategoryIcon = categoryIcons[expense.category]
                  return (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${categoryColors[expense.category]}/20`}>
                          <CategoryIcon className={`h-5 w-5 ${
                            expense.category === 'fuel' ? 'text-orange-500' :
                            expense.category === 'vehicle' ? 'text-blue-500' :
                            expense.category === 'maintenance' ? 'text-yellow-500' :
                            expense.category === 'supplies' ? 'text-purple-500' :
                            expense.category === 'insurance' ? 'text-green-500' : 'text-slate-400'
                          }`} />
                        </div>
                        <div>
                          <p className="text-white font-medium">{expense.description}</p>
                          <p className="text-slate-400 text-sm">
                            {expense.vendor} • {expense.date}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className={`${categoryColors[expense.category]} text-white`}>
                          {expense.category}
                        </Badge>
                        <Badge className={`${
                          expense.status === 'approved' ? 'bg-green-500' :
                          expense.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                        } text-white`}>
                          {expense.status}
                        </Badge>
                        <p className="text-white font-bold text-lg w-24 text-right">
                          ${expense.amount.toFixed(2)}
                        </p>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-400 hover:text-red-300"
                            onClick={() => deleteExpense(expense.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <PieChart className="h-5 w-5 text-blue-500" />
                By Category
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(expensesByCategory).map(([category, amount]) => {
                const percentage = (amount / totalExpenses) * 100
                const CategoryIcon = categoryIcons[category as keyof typeof categoryIcons]
                return (
                  <div key={category} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CategoryIcon className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-300 text-sm capitalize">{category}</span>
                      </div>
                      <span className="text-white font-medium">${amount.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${categoryColors[category as keyof typeof categoryColors]}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-500" />
                Monthly Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                <span className="text-slate-300">January 2026</span>
                <span className="text-white font-bold">${totalExpenses.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                <span className="text-slate-300">Budget</span>
                <span className="text-green-400 font-bold">$2,000.00</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                <span className="text-slate-300">Remaining</span>
                <span className={`font-bold ${(2000 - totalExpenses) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${(2000 - totalExpenses).toFixed(2)}
                </span>
              </div>
              <div className="pt-2">
                <div className="flex justify-between text-sm text-slate-400 mb-1">
                  <span>Budget Used</span>
                  <span>{((totalExpenses / 2000) * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${(totalExpenses / 2000) > 0.9 ? 'bg-red-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min((totalExpenses / 2000) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-sm">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Avg. per expense</span>
                <span className="text-white font-medium">${(totalExpenses / expenses.length).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Total entries</span>
                <span className="text-white font-medium">{expenses.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Pending approval</span>
                <span className="text-yellow-400 font-medium">{expenses.filter(e => e.status === 'pending').length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
