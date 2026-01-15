import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Guardian Mode CRON - Runs every hour to monitor subscribed clients
// Checks for: missed check-ins, unusual activity, expiring subscriptions

export async function GET(request: NextRequest) {
  // Verify CRON secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient()
  const now = new Date()
  const alerts: any[] = []

  // 1. Find clients with active Guardian Mode
  const { data: guardianClients } = await supabase
    .from('clients')
    .select('*')
    .eq('guardian_mode_active', true)
    .or(`guardian_mode_until.is.null,guardian_mode_until.gte.${now.toISOString()}`)

  if (!guardianClients || guardianClients.length === 0) {
    return NextResponse.json({ message: 'No active Guardian Mode clients', alerts: [] })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  for (const client of guardianClients) {
    // 2. Check for missed check-ins (Last Will items)
    const { data: lastWillItems } = await supabase
      .from('vault_items')
      .select('*')
      .eq('client_id', client.id)
      .eq('is_last_will', true)
      .eq('last_will_trigger', 'no_checkin')

    for (const item of lastWillItems || []) {
      const lastCheckin = item.last_checkin_at ? new Date(item.last_checkin_at) : null
      const checkInDays = item.last_will_days_without_checkin || 30
      
      if (lastCheckin) {
        const daysSinceCheckin = Math.floor((now.getTime() - lastCheckin.getTime()) / (1000 * 60 * 60 * 24))
        const warningThreshold = Math.floor(checkInDays * 0.7) // 70% of limit
        
        if (daysSinceCheckin >= warningThreshold && daysSinceCheckin < checkInDays) {
          // Warning alert
          alerts.push({
            client_id: client.id,
            type: 'checkin_warning',
            message: `Client ${client.code_name || client.name} has not checked in for ${daysSinceCheckin} days. Threshold: ${checkInDays} days.`,
            urgency: 'medium'
          })
        }
      }
    }

    // 3. Check for expiring Guardian subscriptions (within 7 days)
    if (client.guardian_mode_until) {
      const expiresAt = new Date(client.guardian_mode_until)
      const daysUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
        alerts.push({
          client_id: client.id,
          type: 'subscription_expiring',
          message: `Guardian Mode for ${client.code_name || client.name} expires in ${daysUntilExpiry} days.`,
          urgency: 'low'
        })

        // Notify client
        if (client.phone) {
          await fetch(`${baseUrl}/api/sms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: client.phone,
              message: `[Discreet Courier] Your Guardian Mode subscription expires in ${daysUntilExpiry} days. Renew to maintain 24/7 protection.`
            })
          }).catch(() => {})
        }
      }
    }

    // 4. Check for pending emergency protocols
    const { data: pendingEmergencies } = await supabase
      .from('emergency_protocols')
      .select('*')
      .eq('client_id', client.id)
      .eq('status', 'pending')
      .lte('trigger_at', now.toISOString())

    for (const emergency of pendingEmergencies || []) {
      alerts.push({
        client_id: client.id,
        type: 'emergency_pending',
        message: `Emergency protocol "${emergency.protocol_type}" for ${client.code_name || client.name} is pending execution!`,
        urgency: 'critical'
      })
    }
  }

  // 5. Process critical alerts - send immediate notifications
  const criticalAlerts = alerts.filter(a => a.urgency === 'critical')
  
  for (const alert of criticalAlerts) {
    // Log the alert
    await supabase.from('guardian_alerts').insert({
      client_id: alert.client_id,
      alert_type: alert.type,
      message: alert.message,
      urgency: alert.urgency,
      created_at: now.toISOString()
    })

    // Notify admin
    if (process.env.ADMIN_PHONE) {
      await fetch(`${baseUrl}/api/sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: process.env.ADMIN_PHONE,
          message: `🚨 GUARDIAN ALERT: ${alert.message}`
        })
      }).catch(() => {})
    }
  }

  // Log CRON execution
  await supabase.from('cron_logs').insert({
    job_name: 'guardian_monitor',
    status: 'completed',
    details: { 
      clients_monitored: guardianClients.length,
      alerts_generated: alerts.length,
      critical_alerts: criticalAlerts.length
    },
    executed_at: now.toISOString()
  })

  return NextResponse.json({
    success: true,
    clients_monitored: guardianClients.length,
    alerts,
    critical_count: criticalAlerts.length
  })
}

// POST - Trigger manual guardian check for specific client
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { client_id, alert_type, message, urgency = 'medium' } = await request.json()

  if (!client_id || !alert_type || !message) {
    return NextResponse.json({ error: 'client_id, alert_type, and message required' }, { status: 400 })
  }

  const now = new Date().toISOString()

  // Get client info
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', client_id)
    .single()

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  // Log alert
  const { data: alert, error } = await supabase
    .from('guardian_alerts')
    .insert({
      client_id,
      alert_type,
      message,
      urgency,
      created_at: now
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // Send notifications based on urgency
  const notifications = []

  if (client.phone) {
    const smsResult = await fetch(`${baseUrl}/api/sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: client.phone,
        message: `[Discreet Courier] 🚨 GUARDIAN ALERT: ${message}`
      })
    }).then(r => r.ok).catch(() => false)
    
    notifications.push({ type: 'sms_client', success: smsResult })
  }

  // Notify emergency contacts if critical
  if (urgency === 'critical' && client.emergency_contacts) {
    const contacts = client.emergency_contacts as any[]
    for (const contact of contacts) {
      if (contact.phone) {
        const result = await fetch(`${baseUrl}/api/sms`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: contact.phone,
            message: `[Discreet Courier] URGENT: Guardian alert for ${client.code_name || client.name}. ${message}`
          })
        }).then(r => r.ok).catch(() => false)
        
        notifications.push({ type: 'sms_emergency_contact', contact: contact.name, success: result })
      }
    }
  }

  // Always notify admin for critical
  if (urgency === 'critical' && process.env.ADMIN_PHONE) {
    await fetch(`${baseUrl}/api/sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: process.env.ADMIN_PHONE,
        message: `🔴 CRITICAL GUARDIAN ALERT for ${client.code_name}: ${message}`
      })
    }).catch(() => {})
  }

  return NextResponse.json({
    success: true,
    alert,
    notifications
  })
}
