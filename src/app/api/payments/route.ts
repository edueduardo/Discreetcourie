import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

// Initialize Stripe (only if key is available)
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

// GET - List recent payments from Stripe
export async function GET(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ 
      error: 'Stripe not configured',
      message: 'Add STRIPE_SECRET_KEY to environment variables',
      payments: []
    }, { status: 200 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    // Fetch payment intents from Stripe
    const paymentIntents = await stripe.paymentIntents.list({
      limit,
      expand: ['data.customer']
    })

    const payments = paymentIntents.data.map(pi => ({
      id: pi.id,
      amount: pi.amount / 100, // Convert cents to dollars
      currency: pi.currency,
      status: pi.status,
      created: new Date(pi.created * 1000).toISOString(),
      customerEmail: typeof pi.customer === 'object' && pi.customer && 'email' in pi.customer 
        ? (pi.customer as { email?: string }).email 
        : null,
      description: pi.description,
      metadata: pi.metadata,
      last4: pi.payment_method_types.includes('card') ? 
        (pi.latest_charge as any)?.payment_method_details?.card?.last4 : null
    }))

    return NextResponse.json({ payments })

  } catch (error: any) {
    console.error('Stripe error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch payments',
      message: error.message 
    }, { status: 500 })
  }
}

// POST - Create a new payment intent
export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ 
      error: 'Stripe not configured',
      message: 'Add STRIPE_SECRET_KEY to environment variables'
    }, { status: 400 })
  }

  try {
    const body = await request.json()
    const { amount, currency = 'usd', customerEmail, description, metadata } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // Create or retrieve customer
    let customerId: string | undefined
    if (customerEmail) {
      const customers = await stripe.customers.list({ email: customerEmail, limit: 1 })
      if (customers.data.length > 0) {
        customerId = customers.data[0].id
      } else {
        const customer = await stripe.customers.create({ email: customerEmail })
        customerId = customer.id
      }
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert dollars to cents
      currency,
      customer: customerId,
      description: description || 'Discreet Courier Service',
      metadata: {
        ...metadata,
        source: 'discreet_courier_admin'
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    // Log to Supabase for tracking
    const supabase = createClient()
    await supabase.from('invoices').insert({
      invoice_number: `INV-${Date.now()}`,
      amount,
      status: 'pending',
      notes: `Stripe PaymentIntent: ${paymentIntent.id}`
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      status: paymentIntent.status
    })

  } catch (error: any) {
    console.error('Stripe payment error:', error)
    return NextResponse.json({ 
      error: 'Failed to create payment',
      message: error.message 
    }, { status: 500 })
  }
}
