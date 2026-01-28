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
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('deliveries')
      .select(`
        id,
        tracking_code,
        pickup_address,
        delivery_address,
        status,
        urgency,
        service_type,
        price,
        notes,
        is_zero_trace,
        created_at,
        updated_at,
        pickup_time,
        delivery_time,
        clients (
          id,
          name,
          email,
          phone
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Filter by status if provided
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Filter by user role
    if (session.user.role === 'client') {
      // Clients see only their deliveries
      const { data: clientData } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', session.user.id)
        .single()

      if (clientData) {
        query = query.eq('client_id', clientData.id)
      } else {
        // No client record, return empty
        return NextResponse.json({ deliveries: [] })
      }
    }
    // Admin and courier see all deliveries (no filter needed)

    const { data: deliveries, error } = await query

    if (error) {
      console.error('Error fetching deliveries:', error)
      return NextResponse.json(
        { error: 'Failed to fetch deliveries' },
        { status: 500 }
      )
    }

    return NextResponse.json({ deliveries: deliveries || [] })
  } catch (error: any) {
    console.error('Delivery list error:', error)
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch deliveries' },
      { status: 500 }
    )
  }
}
