import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 400 })
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  let event: Stripe.Event

  try {
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } else {
      // For testing without webhook signature verification
      event = JSON.parse(body) as Stripe.Event
    }
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createClient()
  const now = new Date().toISOString()

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        // Update invoice status
        await supabase
          .from('invoices')
          .update({ 
            status: 'paid',
            paid_at: now,
            stripe_payment_id: paymentIntent.id
          })
          .ilike('notes', `%${paymentIntent.id}%`)

        // Update delivery if linked
        if (paymentIntent.metadata?.delivery_id) {
          await supabase
            .from('deliveries')
            .update({ paid: true, payment_method: 'stripe' })
            .eq('id', paymentIntent.metadata.delivery_id)
        }

        // Log the payment
        await supabase.from('payment_logs').insert({
          event_type: 'payment_succeeded',
          stripe_payment_id: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          customer_email: paymentIntent.receipt_email,
          metadata: paymentIntent.metadata,
          created_at: now
        })

        // Send SMS notification if phone available
        if (paymentIntent.metadata?.customer_phone) {
          try {
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/sms`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: paymentIntent.metadata.customer_phone,
                message: `[Discreet Courier] Payment of $${(paymentIntent.amount / 100).toFixed(2)} confirmed. Thank you!`
              })
            })
          } catch (e) {
            console.error('SMS notification failed:', e)
          }
        }

        console.log(`✅ Payment succeeded: ${paymentIntent.id}`)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        await supabase
          .from('invoices')
          .update({ status: 'failed' })
          .ilike('notes', `%${paymentIntent.id}%`)

        await supabase.from('payment_logs').insert({
          event_type: 'payment_failed',
          stripe_payment_id: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          error_message: paymentIntent.last_payment_error?.message,
          created_at: now
        })

        console.log(`❌ Payment failed: ${paymentIntent.id}`)
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        
        await supabase.from('payment_logs').insert({
          event_type: 'refund',
          stripe_payment_id: charge.payment_intent as string,
          amount: (charge.amount_refunded || 0) / 100,
          created_at: now
        })

        console.log(`💰 Refund processed: ${charge.id}`)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription & { current_period_end?: number }
        
        // Update guardian mode subscription
        if (subscription.metadata?.client_id) {
          const isActive = subscription.status === 'active'
          const periodEnd = subscription.current_period_end 
            ? new Date(subscription.current_period_end * 1000).toISOString() 
            : null
          await supabase
            .from('clients')
            .update({
              guardian_mode_active: isActive,
              guardian_mode_until: isActive ? periodEnd : null
            })
            .eq('id', subscription.metadata.client_id)
        }

        await supabase.from('payment_logs').insert({
          event_type: `subscription_${event.type.split('.')[2]}`,
          stripe_subscription_id: subscription.id,
          metadata: subscription.metadata,
          created_at: now
        })

        console.log(`📅 Subscription ${event.type}: ${subscription.id}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        if (subscription.metadata?.client_id) {
          await supabase
            .from('clients')
            .update({
              guardian_mode_active: false,
              guardian_mode_until: null
            })
            .eq('id', subscription.metadata.client_id)
        }

        console.log(`🚫 Subscription cancelled: ${subscription.id}`)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true, type: event.type })

  } catch (error: any) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET - Verify webhook endpoint is active
export async function GET() {
  return NextResponse.json({ 
    status: 'Stripe webhook endpoint active',
    configured: !!stripe,
    webhook_secret_set: !!webhookSecret
  })
}
