import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Expo Push API endpoint
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

interface PushMessage {
  to: string
  title: string
  body: string
  data?: Record<string, any>
  sound?: 'default' | null
  badge?: number
  channelId?: string
}

// POST - Send push notification
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { 
      user_id, 
      title, 
      body: messageBody, 
      data,
      delivery_id 
    } = body

    if (!title || !messageBody) {
      return NextResponse.json(
        { error: 'title and body are required' },
        { status: 400 }
      )
    }

    // Get user's push token from database
    let pushToken: string | null = null

    if (user_id) {
      const { data: user } = await supabase
        .from('users')
        .select('push_token')
        .eq('id', user_id)
        .single()
      
      pushToken = user?.push_token
    }

    // If no specific user, try to get from delivery's client
    if (!pushToken && delivery_id) {
      const { data: delivery } = await supabase
        .from('deliveries')
        .select('client_id, clients(push_token)')
        .eq('id', delivery_id)
        .single()
      
      pushToken = (delivery?.clients as any)?.push_token
    }

    if (!pushToken) {
      // Log notification even if we can't send push
      await supabase.from('notification_logs').insert({
        user_id,
        delivery_id,
        title,
        body: messageBody,
        data,
        status: 'no_token',
        created_at: new Date().toISOString()
      })

      return NextResponse.json({
        success: false,
        message: 'No push token found for user'
      })
    }

    // Send to Expo Push API
    const message: PushMessage = {
      to: pushToken,
      title,
      body: messageBody,
      data: data || {},
      sound: 'default',
    }

    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })

    const result = await response.json()

    // Log the notification
    await supabase.from('notification_logs').insert({
      user_id,
      delivery_id,
      title,
      body: messageBody,
      data,
      push_token: pushToken,
      status: result.data?.[0]?.status || 'sent',
      response: result,
      created_at: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      result
    })

  } catch (error: any) {
    console.error('Error sending push notification:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET - Get notification history
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('notification_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({
      notifications: data || []
    })

  } catch (error: any) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
