import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import webpush from 'web-push'

// Configure web-push with VAPID keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@discreetcourier.com'

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

// POST - Send push notification
export async function POST(request: NextRequest) {
  const supabase = createClient()
  
  try {
    const body = await request.json()
    const { 
      userId, 
      clientId,
      title = 'Discreet Courier',
      body: messageBody,
      url,
      data,
      broadcast = false 
    } = body

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Push notifications not configured',
        message: 'Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY environment variables'
      })
    }

    // Get subscriptions
    let query = supabase.from('push_subscriptions').select('*')
    
    if (!broadcast) {
      if (userId) {
        query = query.eq('user_id', userId)
      } else if (clientId) {
        query = query.eq('client_id', clientId)
      } else {
        return NextResponse.json({ error: 'userId or clientId required' }, { status: 400 })
      }
    }

    const { data: subscriptions, error } = await query

    if (error) {
      return NextResponse.json({ 
        error: 'Failed to fetch subscriptions',
        message: error.message 
      }, { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No push subscriptions found'
      })
    }

    const payload = JSON.stringify({
      title,
      body: messageBody,
      url: url || '/portal/dashboard',
      ...data
    })

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Send to all subscriptions
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          },
          payload
        )
        results.sent++
      } catch (e: any) {
        results.failed++
        results.errors.push(e.message)
        
        // Remove invalid subscriptions
        if (e.statusCode === 410 || e.statusCode === 404) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', sub.id)
        }
      }
    }

    // Log the notification
    await supabase.from('notification_logs').insert({
      type: 'push',
      title,
      body: messageBody,
      user_id: userId,
      client_id: clientId,
      sent_count: results.sent,
      failed_count: results.failed,
      created_at: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      results
    })

  } catch (error: any) {
    console.error('Push notification error:', error)
    return NextResponse.json({ 
      error: 'Failed to send push notification',
      message: error.message 
    }, { status: 500 })
  }
}

// PUT - Subscribe to push notifications
export async function PUT(request: NextRequest) {
  const supabase = createClient()
  
  try {
    const body = await request.json()
    const { subscription, userId, clientId } = body

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
    }

    // Check if subscription already exists
    const { data: existing } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('endpoint', subscription.endpoint)
      .single()

    if (existing) {
      // Update existing
      await supabase
        .from('push_subscriptions')
        .update({
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          user_id: userId,
          client_id: clientId,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
    } else {
      // Create new
      await supabase.from('push_subscriptions').insert({
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        user_id: userId,
        client_id: clientId
      })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Push subscription error:', error)
    return NextResponse.json({ 
      error: 'Failed to save subscription',
      message: error.message 
    }, { status: 500 })
  }
}

// DELETE - Unsubscribe from push notifications
export async function DELETE(request: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  const endpoint = searchParams.get('endpoint')

  if (!endpoint) {
    return NextResponse.json({ error: 'endpoint required' }, { status: 400 })
  }

  try {
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint)

    return NextResponse.json({ success: true })

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Failed to unsubscribe',
      message: error.message 
    }, { status: 500 })
  }
}

// GET - Get VAPID public key and subscription status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')
  const clientId = searchParams.get('client_id')

  const response: Record<string, any> = {
    configured: !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY),
    vapidPublicKey: VAPID_PUBLIC_KEY || null
  }

  if (userId || clientId) {
    const supabase = createClient()
    let query = supabase.from('push_subscriptions').select('id, endpoint, created_at')
    
    if (userId) query = query.eq('user_id', userId)
    if (clientId) query = query.eq('client_id', clientId)

    const { data } = await query
    response.subscriptions = data || []
  }

  return NextResponse.json(response)
}
