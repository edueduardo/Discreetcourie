import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Business metrics and analytics
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  
  const metric = searchParams.get('metric') || 'all'
  const period = searchParams.get('period') || '30' // days
  const periodDays = parseInt(period)
  
  const now = new Date()
  const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000).toISOString()
  const previousPeriodStart = new Date(now.getTime() - periodDays * 2 * 24 * 60 * 60 * 1000).toISOString()

  try {
    const metrics: Record<string, any> = {}

    // 1. Revenue Metrics
    if (metric === 'all' || metric === 'revenue') {
      // Current period revenue
      const { data: currentRevenue } = await supabase
        .from('invoices')
        .select('amount')
        .eq('status', 'paid')
        .gte('paid_at', periodStart)

      const totalRevenue = currentRevenue?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0

      // Previous period for comparison
      const { data: prevRevenue } = await supabase
        .from('invoices')
        .select('amount')
        .eq('status', 'paid')
        .gte('paid_at', previousPeriodStart)
        .lt('paid_at', periodStart)

      const prevTotal = prevRevenue?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0
      const revenueGrowth = prevTotal > 0 ? ((totalRevenue - prevTotal) / prevTotal) * 100 : 0

      // MRR (Monthly Recurring Revenue)
      const { data: activeSubscriptions } = await supabase
        .from('subscriptions')
        .select('amount')
        .eq('status', 'active')

      const mrr = activeSubscriptions?.reduce((sum, sub) => sum + (sub.amount || 0), 0) || 0
      const arr = mrr * 12

      metrics.revenue = {
        total: totalRevenue,
        previousPeriod: prevTotal,
        growth: Math.round(revenueGrowth * 100) / 100,
        mrr,
        arr,
        averageOrderValue: currentRevenue?.length ? totalRevenue / currentRevenue.length : 0
      }
    }

    // 2. Customer Metrics
    if (metric === 'all' || metric === 'customers') {
      const { count: totalClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })

      const { count: newClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', periodStart)

      const { count: activeClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      const { count: vipClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('vip', true)

      // Churn rate (clients who became inactive this period)
      const { count: churnedClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'inactive')
        .gte('updated_at', periodStart)

      const churnRate = activeClients && activeClients > 0 
        ? ((churnedClients || 0) / activeClients) * 100 
        : 0

      const retentionRate = 100 - churnRate

      metrics.customers = {
        total: totalClients || 0,
        new: newClients || 0,
        active: activeClients || 0,
        vip: vipClients || 0,
        churned: churnedClients || 0,
        churnRate: Math.round(churnRate * 100) / 100,
        retentionRate: Math.round(retentionRate * 100) / 100
      }
    }

    // 3. Lifetime Value (LTV)
    if (metric === 'all' || metric === 'ltv') {
      // Calculate average revenue per client
      const { data: clientRevenue } = await supabase
        .from('invoices')
        .select('client_id, amount')
        .eq('status', 'paid')

      const revenueByClient: Record<string, number> = {}
      for (const inv of clientRevenue || []) {
        if (inv.client_id) {
          revenueByClient[inv.client_id] = (revenueByClient[inv.client_id] || 0) + (inv.amount || 0)
        }
      }

      const clientCount = Object.keys(revenueByClient).length
      const totalClientRevenue = Object.values(revenueByClient).reduce((sum, v) => sum + v, 0)
      const averageLTV = clientCount > 0 ? totalClientRevenue / clientCount : 0

      // Top clients by LTV
      const topClients = Object.entries(revenueByClient)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([id, revenue]) => ({ clientId: id, totalRevenue: revenue }))

      metrics.ltv = {
        average: Math.round(averageLTV * 100) / 100,
        totalCustomersWithRevenue: clientCount,
        topClients
      }
    }

    // 4. Delivery Metrics
    if (metric === 'all' || metric === 'deliveries') {
      const { count: totalDeliveries } = await supabase
        .from('deliveries')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', periodStart)

      const { count: completedDeliveries } = await supabase
        .from('deliveries')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'delivered')
        .gte('created_at', periodStart)

      const { count: pendingDeliveries } = await supabase
        .from('deliveries')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'in_transit', 'picked_up'])

      const completionRate = totalDeliveries && totalDeliveries > 0
        ? ((completedDeliveries || 0) / totalDeliveries) * 100
        : 0

      metrics.deliveries = {
        total: totalDeliveries || 0,
        completed: completedDeliveries || 0,
        pending: pendingDeliveries || 0,
        completionRate: Math.round(completionRate * 100) / 100
      }
    }

    // 5. Subscription Metrics
    if (metric === 'all' || metric === 'subscriptions') {
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('status, plan_type, amount')

      const byStatus: Record<string, number> = {}
      const byPlan: Record<string, number> = {}
      let totalMRR = 0

      for (const sub of subscriptions || []) {
        byStatus[sub.status] = (byStatus[sub.status] || 0) + 1
        if (sub.plan_type) {
          byPlan[sub.plan_type] = (byPlan[sub.plan_type] || 0) + 1
        }
        if (sub.status === 'active') {
          totalMRR += sub.amount || 0
        }
      }

      metrics.subscriptions = {
        total: subscriptions?.length || 0,
        byStatus,
        byPlan,
        mrr: totalMRR
      }
    }

    // 6. Revenue Forecast (simple linear projection)
    if (metric === 'all' || metric === 'forecast') {
      const mrr = metrics.revenue?.mrr || metrics.subscriptions?.mrr || 0
      const growth = metrics.revenue?.growth || 0
      const monthlyGrowthRate = growth / 100 / (periodDays / 30)

      const forecast = []
      let projectedMRR = mrr
      for (let i = 1; i <= 12; i++) {
        projectedMRR = projectedMRR * (1 + monthlyGrowthRate)
        forecast.push({
          month: i,
          projectedMRR: Math.round(projectedMRR * 100) / 100,
          projectedARR: Math.round(projectedMRR * 12 * 100) / 100
        })
      }

      metrics.forecast = {
        baseMRR: mrr,
        assumedMonthlyGrowth: Math.round(monthlyGrowthRate * 100 * 100) / 100,
        twelveMonthProjection: forecast
      }
    }

    // 7. Lead Metrics
    if (metric === 'all' || metric === 'leads') {
      const { count: totalLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', periodStart)

      const { count: convertedLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'converted')
        .gte('created_at', periodStart)

      const conversionRate = totalLeads && totalLeads > 0
        ? ((convertedLeads || 0) / totalLeads) * 100
        : 0

      metrics.leads = {
        total: totalLeads || 0,
        converted: convertedLeads || 0,
        conversionRate: Math.round(conversionRate * 100) / 100
      }
    }

    return NextResponse.json({
      success: true,
      period: `${periodDays} days`,
      generatedAt: now.toISOString(),
      metrics
    })

  } catch (error: any) {

    return NextResponse.json({ 
      error: 'Failed to generate analytics',
      message: error.message 
    }, { status: 500 })
  }
}
