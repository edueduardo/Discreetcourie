import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Send test push notification
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's push subscriptions
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user.id)

    if (error || !subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ error: 'No subscriptions found' }, { status: 404 })
    }

    // Send test notification to all subscriptions
    // Note: In production, you would use web-push library here
    // For now, this is a placeholder that returns success
    
    return NextResponse.json({ 
      success: true,
      message: 'Test notification sent',
      subscriptions: subscriptions.length
    })

  } catch (error: any) {
    console.error('Push test error:', error)
    return NextResponse.json({ 
      error: 'Failed to send test notification',
      message: error.message 
    }, { status: 500 })
  }
}
