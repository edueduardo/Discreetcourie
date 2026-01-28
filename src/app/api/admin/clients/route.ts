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

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const { data: clients, error } = await supabase
      .from('clients')
      .select(`
        id,
        name,
        email,
        phone,
        company,
        created_at,
        vetting_status,
        guardian_mode_active
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching clients:', error)
      return NextResponse.json(
        { error: 'Failed to fetch clients' },
        { status: 500 }
      )
    }

    // Get delivery count for each client
    const clientsWithStats = await Promise.all(
      (clients || []).map(async (client) => {
        const { count } = await supabase
          .from('deliveries')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', client.id)

        return {
          ...client,
          total_deliveries: count || 0
        }
      })
    )

    return NextResponse.json({ clients: clientsWithStats })
  } catch (error: any) {
    console.error('Clients fetch error:', error)
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch clients' },
      { status: 500 }
    )
  }
}
