import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { SUBSCRIPTION_PLANS } from '@/lib/subscription-plans'

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

// GET - Listar assinaturas do cliente ou todas (admin)
export async function GET(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ 
      error: 'Stripe not configured',
      subscriptions: [],
      plans: SUBSCRIPTION_PLANS
    }, { status: 200 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customer_id')
    const email = searchParams.get('email')
    const listPlans = searchParams.get('plans') === 'true'

    // Retornar apenas os planos disponíveis
    if (listPlans) {
      return NextResponse.json({ plans: SUBSCRIPTION_PLANS })
    }

    // Buscar cliente pelo email
    let stripeCustomerId = customerId
    if (!stripeCustomerId && email) {
      const customers = await stripe.customers.list({ email, limit: 1 })
      if (customers.data.length > 0) {
        stripeCustomerId = customers.data[0].id
      }
    }

    // Listar assinaturas
    const params: Stripe.SubscriptionListParams = {
      limit: 100,
      expand: ['data.default_payment_method', 'data.items.data.price.product']
    }
    
    if (stripeCustomerId) {
      params.customer = stripeCustomerId
    }

    const subscriptions = await stripe.subscriptions.list(params)

    const formattedSubs = subscriptions.data.map(sub => {
      const subAny = sub as any
      return {
        id: sub.id,
        status: sub.status,
        currentPeriodStart: new Date((subAny.current_period_start || 0) * 1000).toISOString(),
        currentPeriodEnd: new Date((subAny.current_period_end || 0) * 1000).toISOString(),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
        created: new Date(sub.created * 1000).toISOString(),
        customer: sub.customer,
        items: sub.items.data.map(item => ({
          id: item.id,
          priceId: item.price.id,
          productId: typeof item.price.product === 'string' ? item.price.product : (item.price.product as any)?.id,
          productName: typeof item.price.product === 'object' ? (item.price.product as Stripe.Product)?.name : null,
          amount: (item.price.unit_amount || 0) / 100,
          interval: item.price.recurring?.interval
        })),
        metadata: sub.metadata
      }
    })

    return NextResponse.json({ subscriptions: formattedSubs })

  } catch (error: any) {
    console.error('Stripe subscriptions error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch subscriptions',
      message: error.message 
    }, { status: 500 })
  }
}

// POST - Criar nova assinatura
export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ 
      error: 'Stripe not configured'
    }, { status: 400 })
  }

  try {
    const body = await request.json()
    const { 
      planKey, 
      customerEmail, 
      customerName,
      clientId,
      paymentMethodId,
      trialDays = 0
    } = body

    // Validar plano
    const plan = SUBSCRIPTION_PLANS[planKey as keyof typeof SUBSCRIPTION_PLANS]
    if (!plan) {
      return NextResponse.json({ 
        error: 'Invalid plan',
        availablePlans: Object.keys(SUBSCRIPTION_PLANS)
      }, { status: 400 })
    }

    if (!customerEmail) {
      return NextResponse.json({ error: 'Customer email required' }, { status: 400 })
    }

    // Criar ou buscar cliente
    let customer: Stripe.Customer
    const existingCustomers = await stripe.customers.list({ email: customerEmail, limit: 1 })
    
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0]
      // Atualizar nome se fornecido
      if (customerName && customer.name !== customerName) {
        customer = await stripe.customers.update(customer.id, { name: customerName })
      }
    } else {
      customer = await stripe.customers.create({
        email: customerEmail,
        name: customerName,
        metadata: { client_id: clientId || '' }
      })
    }

    // Criar ou buscar produto/preço
    let price: Stripe.Price
    const productName = `discreet_courier_${planKey}`
    
    // Buscar produto existente
    const products = await stripe.products.list({ limit: 100 })
    let product = products.data.find(p => p.metadata?.plan_key === planKey)
    
    if (!product) {
      // Criar produto
      product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
        metadata: { plan_key: planKey }
      })
    }

    // Buscar preço existente
    const prices = await stripe.prices.list({ product: product.id, active: true, limit: 10 })
    price = prices.data.find(p => 
      p.unit_amount === plan.price * 100 && 
      p.recurring?.interval === plan.interval
    ) as Stripe.Price

    if (!price) {
      // Criar preço
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.price * 100,
        currency: 'usd',
        recurring: { interval: plan.interval }
      })
    }

    // Anexar método de pagamento se fornecido
    if (paymentMethodId) {
      await stripe.paymentMethods.attach(paymentMethodId, { customer: customer.id })
      await stripe.customers.update(customer.id, {
        invoice_settings: { default_payment_method: paymentMethodId }
      })
    }

    // Criar assinatura
    const subscriptionParams: Stripe.SubscriptionCreateParams = {
      customer: customer.id,
      items: [{ price: price.id }],
      metadata: {
        plan_key: planKey,
        client_id: clientId || ''
      },
      expand: ['latest_invoice.payment_intent']
    }

    // Adicionar trial se solicitado
    if (trialDays > 0) {
      subscriptionParams.trial_period_days = trialDays
    }

    // Se não tem payment method, criar checkout session
    if (!paymentMethodId) {
      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        payment_method_types: ['card'],
        line_items: [{
          price: price.id,
          quantity: 1
        }],
        mode: 'subscription',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/portal?subscription=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/portal?subscription=cancelled`,
        metadata: {
          plan_key: planKey,
          client_id: clientId || ''
        }
      })

      return NextResponse.json({
        type: 'checkout_session',
        sessionId: session.id,
        checkoutUrl: session.url,
        customerId: customer.id
      })
    }

    const subscription = await stripe.subscriptions.create(subscriptionParams)

    // Salvar no Supabase
    const supabase = createClient()
    const subData = subscription as any
    await supabase.from('subscriptions').insert({
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customer.id,
      client_id: clientId,
      plan_key: planKey,
      status: subscription.status,
      current_period_start: new Date((subData.current_period_start || 0) * 1000).toISOString(),
      current_period_end: new Date((subData.current_period_end || 0) * 1000).toISOString(),
      amount: plan.price
    })

    // Atualizar cliente com guardian_mode se aplicável
    if (planKey.startsWith('guardian') && clientId) {
      await supabase.from('clients')
        .update({ 
          guardian_mode_active: true,
          guardian_subscription_id: subscription.id
        })
        .eq('id', clientId)
    }

    const latestInvoice = subscription.latest_invoice as any
    const paymentIntent = latestInvoice?.payment_intent as any

    return NextResponse.json({
      type: 'subscription',
      subscriptionId: subscription.id,
      status: subscription.status,
      customerId: customer.id,
      clientSecret: paymentIntent?.client_secret,
      currentPeriodEnd: new Date((subData.current_period_end || 0) * 1000).toISOString()
    })

  } catch (error: any) {
    console.error('Stripe subscription error:', error)
    return NextResponse.json({ 
      error: 'Failed to create subscription',
      message: error.message 
    }, { status: 500 })
  }
}

// PATCH - Atualizar/Cancelar assinatura
export async function PATCH(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 400 })
  }

  try {
    const body = await request.json()
    const { subscriptionId, action, newPlanKey, cancelAtPeriodEnd = true } = body

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID required' }, { status: 400 })
    }

    let subscription: Stripe.Subscription

    switch (action) {
      case 'cancel':
        subscription = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: cancelAtPeriodEnd
        })
        break

      case 'reactivate':
        subscription = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: false
        })
        break

      case 'cancel_immediately':
        subscription = await stripe.subscriptions.cancel(subscriptionId)
        break

      case 'change_plan':
        if (!newPlanKey) {
          return NextResponse.json({ error: 'New plan key required' }, { status: 400 })
        }
        
        const plan = SUBSCRIPTION_PLANS[newPlanKey as keyof typeof SUBSCRIPTION_PLANS]
        if (!plan) {
          return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
        }

        // Buscar subscription atual
        const currentSub = await stripe.subscriptions.retrieve(subscriptionId)
        
        // Criar novo preço se necessário
        const products = await stripe.products.list({ limit: 100 })
        let product = products.data.find(p => p.metadata?.plan_key === newPlanKey)
        
        if (!product) {
          product = await stripe.products.create({
            name: plan.name,
            description: plan.description,
            metadata: { plan_key: newPlanKey }
          })
        }

        const prices = await stripe.prices.list({ product: product.id, active: true })
        let price = prices.data.find(p => 
          p.unit_amount === plan.price * 100 && 
          p.recurring?.interval === plan.interval
        )

        if (!price) {
          price = await stripe.prices.create({
            product: product.id,
            unit_amount: plan.price * 100,
            currency: 'usd',
            recurring: { interval: plan.interval }
          })
        }

        // Atualizar subscription
        subscription = await stripe.subscriptions.update(subscriptionId, {
          items: [{
            id: currentSub.items.data[0].id,
            price: price.id
          }],
          proration_behavior: 'create_prorations',
          metadata: { plan_key: newPlanKey }
        })
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Atualizar no Supabase
    const supabase = createClient()
    await supabase.from('subscriptions')
      .update({
        status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at 
          ? new Date(subscription.canceled_at * 1000).toISOString() 
          : null
      })
      .eq('stripe_subscription_id', subscriptionId)

    const subResult = subscription as any
    return NextResponse.json({
      subscriptionId: subscription.id,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd: new Date((subResult.current_period_end || 0) * 1000).toISOString()
    })

  } catch (error: any) {
    console.error('Stripe subscription update error:', error)
    return NextResponse.json({ 
      error: 'Failed to update subscription',
      message: error.message 
    }, { status: 500 })
  }
}
