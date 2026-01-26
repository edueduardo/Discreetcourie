import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Unsubscribe from push notifications
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { endpoint } = await request.json()

    // Remove subscription from database
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint)
      .eq('user_id', user.id)

    if (error) {
      console.error('Failed to remove subscription:', error)
      return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Unsubscribed from push notifications'
    })

  } catch (error: any) {
    console.error('Push unsubscribe error:', error)
    return NextResponse.json({ 
      error: 'Failed to unsubscribe',
      message: error.message 
    }, { status: 500 })
  }
}
