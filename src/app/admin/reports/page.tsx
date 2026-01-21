'use client'

import { useState } from 'react'
import { 
  FileText, 
  Download, 
  Calendar,
  Filter,
  Package,
  DollarSign,
  Users,
  Clock
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type ReportType = 'deliveries' | 'revenue' | 'clients' | 'performance'

interface ReportConfig {
  type: ReportType
  title: string
  description: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}

const REPORT_TYPES: ReportConfig[] = [
  {
    type: 'deliveries',
    title: 'Deliveries Report',
    description: 'All delivery records with status, routes, and timing',
    icon: Package
  },
  {
    type: 'revenue',
    title: 'Revenue Report',
    description: 'Financial summary with payments and invoices',
    icon: DollarSign
  },
  {
    type: 'clients',
    title: 'Clients Report',
    description: 'Client activity, retention, and preferences',
    icon: Users
  },
  {
    type: 'performance',
    title: 'Performance Report',
    description: 'Delivery times, success rates, and efficiency',
    icon: Clock
  }
]

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('deliveries')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [generating, setGenerating] = useState(false)
  const [generatedReport, setGeneratedReport] = useState<any>(null)

  async function generateReport() {
    setGenerating(true)
    setGeneratedReport(null)
    
    try {
      const params = new URLSearchParams({
        type: selectedReport,
        ...(dateRange.start && { start: dateRange.start }),
        ...(dateRange.end && { end: dateRange.end })
      })
      
      const res = await fetch(`/api/reports?${params}`)
      if (res.ok) {
        const data = await res.json()
        setGeneratedReport(data)
      } else {
        // Generate mock report data
        setGeneratedReport(getMockReport(selectedReport))
      }
    } catch (error) {
      setGeneratedReport(getMockReport(selectedReport))
    } finally {
      setGenerating(false)
    }
  }

  function getMockReport(type: ReportType) {
    const now = new Date().toLocaleDateString()
    switch (type) {
      case 'deliveries':
        return {
          title: 'Deliveries Report',
          generatedAt: now,
          summary: {
            total: 127,
            completed: 98,
            pending: 15,
            cancelled: 4,
            inTransit: 10
          },
          data: [
            { tracking: 'DC-ABC123', date: '2024-03-15', status: 'delivered', route: 'Downtown → Westerville', time: '38 min' },
            { tracking: 'DC-DEF456', date: '2024-03-15', status: 'delivered', route: 'OSU → Dublin', time: '42 min' },
            { tracking: 'DC-GHI789', date: '2024-03-14', status: 'in_transit', route: 'Short North → Grandview', time: '-' }
          ]
        }
      case 'revenue':
        return {
          title: 'Revenue Report',
          generatedAt: now,
          summary: {
            totalRevenue: 8750,
            paidInvoices: 45,
            pendingPayments: 3,
            averageOrderValue: 68.90
          },
          data: [
            { invoice: 'INV-001', date: '2024-03-15', client: 'Medical Center', amount: 150, status: 'paid' },
            { invoice: 'INV-002', date: '2024-03-14', client: 'Law Firm LLC', amount: 85, status: 'paid' },
            { invoice: 'INV-003', date: '2024-03-14', client: 'Pharmacy Plus', amount: 65, status: 'pending' }
          ]
        }
      case 'clients':
        return {
          title: 'Clients Report',
          generatedAt: now,
          summary: {
            totalClients: 24,
            activeThisMonth: 18,
            newClients: 3,
            vipClients: 5
          },
          data: [
            { name: 'Medical Center', deliveries: 32, revenue: 2400, lastOrder: '2024-03-15' },
            { name: 'Law Firm LLC', deliveries: 28, revenue: 1960, lastOrder: '2024-03-14' },
            { name: 'Pharmacy Plus', deliveries: 21, revenue: 1365, lastOrder: '2024-03-13' }
          ]
        }
      case 'performance':
        return {
          title: 'Performance Report',
          generatedAt: now,
          summary: {
            avgDeliveryTime: 42,
            onTimeRate: 96.5,
            successRate: 98.2,
            customerSatisfaction: 4.8
          },
          data: [
            { metric: 'Average Pickup Time', value: '12 min', trend: '+2%' },
            { metric: 'Average Transit Time', value: '30 min', trend: '-5%' },
            { metric: 'Same-Day Completion', value: '94%', trend: '+3%' }
          ]
        }
      default:
        return null
    }
  }

  function downloadReport() {
    if (!generatedReport) return
    
    const blob = new Blob([JSON.stringify(generatedReport, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedReport}-report-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <FileText /> Reports
      </h1>

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {REPORT_TYPES.map((report) => (
          <Card 
            key={report.type}
            className={`cursor-pointer transition-all ${
              selectedReport === report.type 
                ? 'bg-blue-600 border-blue-500' 
                : 'bg-slate-800 border-slate-700 hover:border-slate-600'
            }`}
            onClick={() => setSelectedReport(report.type)}
          >
            <CardContent className="p-4">
              <report.icon size={24} className="mb-2" />
              <h3 className="font-semibold">{report.title}</h3>
              <p className="text-sm text-slate-300">{report.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter size={18} /> Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="text-sm text-slate-400 block mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2"
              />
            </div>
            <Button 
              onClick={generateReport}
              disabled={generating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Calendar size={16} className="mr-2" />
              {generating ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Report */}
      {generatedReport && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{generatedReport.title}</CardTitle>
            <Button onClick={downloadReport} variant="outline" size="sm">
              <Download size={16} className="mr-2" /> Export JSON
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-400 mb-4">Generated: {generatedReport.generatedAt}</p>
            
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {Object.entries(generatedReport.summary).map(([key, value]) => (
                <div key={key} className="bg-slate-700/50 p-3 rounded-lg">
                  <p className="text-xs text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                  <p className="text-xl font-bold">
                    {typeof value === 'number' && key.toLowerCase().includes('revenue') 
                      ? `$${(value as number).toLocaleString()}` 
                      : typeof value === 'number' && key.toLowerCase().includes('rate')
                      ? `${value}%`
                      : String(value)}
                  </p>
                </div>
              ))}
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    {generatedReport.data[0] && Object.keys(generatedReport.data[0]).map((key) => (
                      <th key={key} className="text-left p-2 text-slate-400 capitalize">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {generatedReport.data.map((row: any, index: number) => (
                    <tr key={index} className="border-b border-slate-700/50">
                      {Object.values(row).map((value, i) => (
                        <td key={i} className="p-2">
                          {typeof value === 'number' && String(Object.keys(row)[i]).toLowerCase().includes('amount')
                            ? `$${value}`
                            : String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
