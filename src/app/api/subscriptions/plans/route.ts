import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  SUBSCRIPTION_PLANS,
  calculateROI,
  shouldUpgrade,
  generatePitch,
} from '@/lib/subscriptions/plans'

/**
 * Subscription Plans API - Solo Driver Columbus
 * GET /api/subscriptions/plans - List all plans
 * POST /api/subscriptions/plans - Subscribe to a plan
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const businessType = searchParams.get('businessType')

    // Generate custom pitch if business type provided
    let pitch = null
    if (businessType) {
      pitch = generatePitch(businessType)
    }

    // Calculate ROI for each plan
    const plansWithROI = SUBSCRIPTION_PLANS.map((plan) => {
      const roi = calculateROI(plan, plan.deliveries === -1 ? 30 : plan.deliveries)
      return {
        ...plan,
        roi: {
          savings: roi.savings,
          savingsPercentage: roi.savingsPercentage,
          breakEvenDeliveries: roi.breakEvenDeliveries,
        },
      }
    })

    return NextResponse.json({
      success: true,
      plans: plansWithROI,
      pitch,
    })
  } catch (error) {
    console.error('Plans fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { planId, paymentMethodId } = body

    // Validate plan
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId)
    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      )
    }

    // Check if user already has active subscription
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (existingSub) {
      return NextResponse.json(
        { error: 'You already have an active subscription' },
        { status: 400 }
      )
    }

    // Create subscription in database
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        plan_id: planId,
        plan_name: plan.name,
        price: plan.price,
        interval: plan.interval,
        deliveries_included: plan.deliveries,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        payment_method_id: paymentMethodId,
      })
      .select()
      .single()

    if (subError) {
      console.error('Subscription creation error:', subError)
      return NextResponse.json(
        { error: 'Failed to create subscription' },
        { status: 500 }
      )
    }

    // Create Stripe subscription (if payment method provided)
    // TODO: Integrate with Stripe API

    return NextResponse.json({
      success: true,
      subscription,
      message: `Successfully subscribed to ${plan.name} plan!`,
    })
  } catch (error) {
    console.error('Subscription error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body // 'upgrade', 'downgrade', 'cancel'

    // Get current subscription
    const { data: currentSub, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (fetchError || !currentSub) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    if (action === 'cancel') {
      // Cancel subscription
      const { error: cancelError } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', currentSub.id)

      if (cancelError) {
        return NextResponse.json(
          { error: 'Failed to cancel subscription' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Subscription cancelled successfully',
      })
    }

    if (action === 'upgrade' || action === 'downgrade') {
      const { newPlanId } = body
      const newPlan = SUBSCRIPTION_PLANS.find((p) => p.id === newPlanId)

      if (!newPlan) {
        return NextResponse.json(
          { error: 'Invalid plan' },
          { status: 400 }
        )
      }

      // Update subscription
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          plan_id: newPlanId,
          plan_name: newPlan.name,
          price: newPlan.price,
          deliveries_included: newPlan.deliveries,
        })
        .eq('id', currentSub.id)

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update subscription' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: `Successfully ${action}d to ${newPlan.name} plan!`,
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Subscription update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
