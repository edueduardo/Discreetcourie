import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

// POST - Criar sessão do Customer Portal Stripe
export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ 
      error: 'Stripe not configured'
    }, { status: 400 })
  }

  try {
    const body = await request.json()
    const { customerId, customerEmail, returnUrl } = body

    if (!customerId && !customerEmail) {
      return NextResponse.json({ 
        error: 'Customer ID or email required' 
      }, { status: 400 })
    }

    // Buscar customer ID pelo email se necessário
    let stripeCustomerId = customerId
    if (!stripeCustomerId && customerEmail) {
      const customers = await stripe.customers.list({ 
        email: customerEmail, 
        limit: 1 
      })
      
      if (customers.data.length === 0) {
        return NextResponse.json({ 
          error: 'No customer found with this email' 
        }, { status: 404 })
      }
      
      stripeCustomerId = customers.data[0].id
    }

    // Criar sessão do portal
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/portal`
    })

    return NextResponse.json({
      url: session.url,
      customerId: stripeCustomerId
    })

  } catch (error: any) {
    console.error('Stripe portal error:', error)
    
    // Se o portal não está configurado, retornar erro amigável
    if (error.code === 'resource_missing') {
      return NextResponse.json({ 
        error: 'Customer Portal not configured',
        message: 'Configure the Customer Portal in Stripe Dashboard: https://dashboard.stripe.com/settings/billing/portal',
        stripeError: error.message
      }, { status: 400 })
    }

    return NextResponse.json({ 
      error: 'Failed to create portal session',
      message: error.message 
    }, { status: 500 })
  }
}
