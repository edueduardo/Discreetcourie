import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    // Today's deliveries
    const { count: todayDeliveries } = await supabase
      .from('deliveries')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart)

    // Pending deliveries
    const { count: pendingDeliveries } = await supabase
      .from('deliveries')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'confirmed', 'picked_up', 'in_transit'])

    // Completed today
    const { count: completedToday } = await supabase
      .from('deliveries')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'delivered')
      .gte('delivered_at', todayStart)

    // Revenue calculations
    const { data: todayRevenue } = await supabase
      .from('deliveries')
      .select('price')
      .eq('status', 'delivered')
      .gte('delivered_at', todayStart)

    const { data: weekRevenue } = await supabase
      .from('deliveries')
      .select('price')
      .eq('status', 'delivered')
      .gte('delivered_at', weekStart)

    const { data: monthRevenue } = await supabase
      .from('deliveries')
      .select('price')
      .eq('status', 'delivered')
      .gte('delivered_at', monthStart)

    const revenueToday = todayRevenue?.reduce((sum, d) => sum + (d.price || 0), 0) || 0
    const revenueWeek = weekRevenue?.reduce((sum, d) => sum + (d.price || 0), 0) || 0
    const revenueMonth = monthRevenue?.reduce((sum, d) => sum + (d.price || 0), 0) || 0

    // Recent deliveries
    const { data: recentDeliveries } = await supabase
      .from('deliveries')
      .select(`
        id,
        tracking_code,
        status,
        price,
        created_at,
        clients (
          name,
          company
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      stats: {
        today_deliveries: todayDeliveries || 0,
        pending_deliveries: pendingDeliveries || 0,
        completed_today: completedToday || 0,
        revenue_today: revenueToday,
        revenue_week: revenueWeek,
        revenue_month: revenueMonth
      },
      recent_deliveries: recentDeliveries || []
    })
  } catch (error: any) {
    console.error('Admin stats error:', error)
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
