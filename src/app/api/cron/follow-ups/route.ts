import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
// import { sendRichEmail, EmailTemplates } from '@/lib/email' // TODO: Atualizar para usar sendEmail
// import { notifyCustomer } from '@/lib/whatsapp' // TODO: Implementar WhatsApp

/**
 * Automated Follow-Up System (SEMANA 3.3)
 *
 * Runs on cron schedule to:
 * 1. Follow up unconverted quotes (24h, 48h, 7d)
 * 2. Re-engage inactive customers (30d, 60d, 90d)
 * 3. Request reviews after successful delivery
 * 4. Send referral requests to loyal customers
 *
 * Vercel Cron: Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/follow-ups",
 *     "schedule": "0 9 * * *"
 *   }]
 * }
 */

export async function GET(request: NextRequest) {
  try {
    // TODO: Reativar após implementar sendEmail e WhatsApp
    return NextResponse.json({ 
      success: false, 
      message: 'Follow-ups temporariamente desabilitado - aguardando implementação de email/WhatsApp' 
    }, { status: 503 })

    /* CÓDIGO TEMPORARIAMENTE DESABILITADO
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const now = new Date()
    const results = {
      quotes_followed_up: 0,
      customers_reengaged: 0,
      reviews_requested: 0,
      referrals_sent: 0
    }

    // 1. Follow up unconverted quotes
    const quote24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const quote48h = new Date(now.getTime() - 48 * 60 * 60 * 1000)
    const quote7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const { data: unconvertedQuotes } = await supabase
      .from('quotes')
      .select('*')
      .eq('status', 'pending')
      .is('converted_to_delivery_id', null)
      .or(`created_at.gte.${quote24h.toISOString()},created_at.gte.${quote48h.toISOString()},created_at.gte.${quote7d.toISOString()}`)

    if (unconvertedQuotes) {
      for (const quote of unconvertedQuotes) {
        if (!quote.contact_email) continue

        const daysOld = Math.floor((now.getTime() - new Date(quote.created_at).getTime()) / (24 * 60 * 60 * 1000))

        // Send follow-up based on age
        let discountCode = undefined
        if (daysOld >= 7) {
          discountCode = 'QUOTE10' // 10% off for week-old quotes
        }

        const followUpEmail = EmailTemplates.followUp({
          customerName: quote.contact_name || 'Customer',
          daysInactive: daysOld,
          lastDeliveryDate: new Date(quote.created_at).toLocaleDateString(),
          quoteUrl: `${process.env.NEXT_PUBLIC_APP_URL}/quote?id=${quote.id}`,
          discountCode
        })

        await sendRichEmail({
          to: quote.contact_email,
          template: followUpEmail
        })

        results.quotes_followed_up++
      }
    }

    // 2. Re-engage inactive customers
    const inactive30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const inactive60d = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    const inactive90d = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    const { data: inactiveClients } = await supabase
      .from('clients')
      .select('*, deliveries(created_at, status)')
      .or(`last_activity.lt.${inactive30d.toISOString()},last_activity.lt.${inactive60d.toISOString()},last_activity.lt.${inactive90d.toISOString()}`)
      .limit(50)

    if (inactiveClients) {
      for (const client of inactiveClients) {
        if (!client.email) continue

        const lastActivity = new Date(client.last_activity)
        const daysInactive = Math.floor((now.getTime() - lastActivity.getTime()) / (24 * 60 * 60 * 1000))

        // Skip if already contacted recently
        if (client.last_contacted_at) {
          const daysSinceContact = Math.floor((now.getTime() - new Date(client.last_contacted_at).getTime()) / (24 * 60 * 60 * 1000))
          if (daysSinceContact < 14) continue // Don't spam
        }

        // Offer discount based on inactivity
        let discountCode = undefined
        if (daysInactive >= 90) {
          discountCode = 'COMEBACK20' // 20% off for 90+ days inactive
        } else if (daysInactive >= 60) {
          discountCode = 'RETURN15' // 15% off for 60+ days
        } else if (daysInactive >= 30) {
          discountCode = 'WELCOME10' // 10% off for 30+ days
        }

        const reengageEmail = EmailTemplates.followUp({
          customerName: client.name || 'Customer',
          daysInactive,
          lastDeliveryDate: lastActivity.toLocaleDateString(),
          quoteUrl: `${process.env.NEXT_PUBLIC_APP_URL}/quote`,
          discountCode
        })

        await sendRichEmail({
          to: client.email,
          template: reengageEmail
        })

        // Send WhatsApp if available
        if (client.phone) {
          await notifyCustomer(
            'followUpReminder',
            client.phone,
            client.name || 'Customer',
            daysInactive
          )
        }

        // Update last contacted
        await supabase
          .from('clients')
          .update({ last_contacted_at: now.toISOString() })
          .eq('id', client.id)

        results.customers_reengaged++
      }
    }

    // 3. Request reviews from recently completed deliveries
    const reviewWindow = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) // 3 days ago

    const { data: recentDeliveries } = await supabase
      .from('deliveries')
      .select('*, client:clients(name, email, phone)')
      .eq('status', 'delivered')
      .gte('delivered_at', reviewWindow.toISOString())
      .is('review_requested_at', null)
      .limit(20)

    if (recentDeliveries) {
      for (const delivery of recentDeliveries) {
        if (!delivery.client?.email) continue

        // Simple review request email (reusing booking template structure)
        const reviewEmail = {
          subject: 'How was your delivery? - Discreet Courier',
          html: `
            <p>Hi ${delivery.client.name || 'Customer'},</p>
            <p>We hope your recent delivery (${delivery.tracking_code}) was excellent!</p>
            <p>Your feedback helps us improve. Would you mind sharing your experience?</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/portal/feedback?delivery=${delivery.id}" style="background: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 15px 0;">Leave Feedback</a></p>
            <p>Thank you for choosing Discreet Courier!</p>
          `,
          text: `Hi ${delivery.client.name},\n\nWe hope your recent delivery (${delivery.tracking_code}) was excellent!\n\nYour feedback helps us improve: ${process.env.NEXT_PUBLIC_APP_URL}/portal/feedback?delivery=${delivery.id}\n\nThank you!`
        }

        await sendRichEmail({
          to: delivery.client.email,
          template: reviewEmail
        })

        // Mark as requested
        await supabase
          .from('deliveries')
          .update({ review_requested_at: now.toISOString() })
          .eq('id', delivery.id)

        results.reviews_requested++
      }
    }

    // 4. Send referral requests to loyal customers (3+ deliveries)
    const { data: loyalCustomers } = await supabase
      .from('clients')
      .select('*, deliveries(count)')
      .is('referral_sent_at', null)
      .limit(10)

    if (loyalCustomers) {
      for (const client of loyalCustomers) {
        // @ts-ignore - count from aggregate
        const deliveryCount = client.deliveries?.[0]?.count || 0

        if (deliveryCount >= 3 && client.email) {
          const referralEmail = {
            subject: 'Refer a Friend, Get $20 Credit - Discreet Courier',
            html: `
              <p>Hi ${client.name || 'Valued Customer'},</p>
              <p>Thank you for being a loyal customer with ${deliveryCount} deliveries!</p>
              <p><strong>Refer a friend and you BOTH get $20 credit:</strong></p>
              <ol>
                <li>Share your referral code: <strong>${client.id.slice(0, 8).toUpperCase()}</strong></li>
                <li>They get $20 off their first delivery</li>
                <li>You get $20 credit after their delivery</li>
              </ol>
              <p>There's no limit - refer as many friends as you want!</p>
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/portal/referrals">Manage Referrals</a></p>
            `,
            text: `Hi ${client.name},\n\nRefer a friend, get $20!\nYour code: ${client.id.slice(0, 8).toUpperCase()}\n\nDetails: ${process.env.NEXT_PUBLIC_APP_URL}/portal/referrals`
          }

          await sendRichEmail({
            to: client.email,
            template: referralEmail
          })

          // Mark as sent
          await supabase
            .from('clients')
            .update({ referral_sent_at: now.toISOString() })
            .eq('id', client.id)

          results.referrals_sent++
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results
    })
    */

  } catch (error: any) {
    console.error('Follow-ups cron error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

// Manual trigger (for testing)
export async function POST(request: NextRequest) {
  return GET(request)
}
