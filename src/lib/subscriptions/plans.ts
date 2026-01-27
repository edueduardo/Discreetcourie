/**
 * Subscription Plans for Solo Driver - Columbus, Ohio
 * Generate recurring revenue with business clients
 */

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  interval: 'monthly' | 'yearly'
  deliveries: number // -1 = unlimited
  features: string[]
  savings?: number // compared to pay-per-delivery
  recommended?: boolean
  targetCustomer: string
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 99,
    interval: 'monthly',
    deliveries: 10,
    features: [
      '10 deliveries per month',
      'Same-day delivery',
      'Real-time GPS tracking',
      'Photo proof of delivery',
      'Email support',
      'Columbus metro area',
    ],
    savings: 151, // $25 x 10 = $250 - $99 = $151 saved
    targetCustomer: 'Small businesses, real estate agents',
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 199,
    interval: 'monthly',
    deliveries: 25,
    features: [
      '25 deliveries per month',
      'Priority same-day delivery',
      'Real-time GPS tracking',
      'Photo proof of delivery',
      'Priority support',
      'Columbus metro + suburbs',
      'Scheduled pickups',
      'Dedicated account manager',
    ],
    savings: 426, // $25 x 25 = $625 - $199 = $426 saved
    recommended: true,
    targetCustomer: 'Law firms, medical offices, small businesses',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 399,
    interval: 'monthly',
    deliveries: -1, // unlimited
    features: [
      'Unlimited deliveries',
      'Priority same-day delivery',
      'Real-time GPS tracking',
      'Photo proof of delivery',
      '24/7 priority support',
      'Columbus metro + suburbs',
      'Scheduled pickups',
      'Dedicated account manager',
      'Custom invoicing',
      'API access',
      'Human Vault™ access',
      'NDA enforcement',
    ],
    savings: 0, // calculated based on usage
    targetCustomer: 'Law firms, medical practices, corporations',
  },
]

/**
 * Calculate savings for a subscription plan
 */
export function calculateSavings(
  plan: SubscriptionPlan,
  payPerDeliveryPrice: number = 25
): number {
  if (plan.deliveries === -1) {
    // Unlimited - calculate based on average usage
    const averageMonthlyDeliveries = 30
    return averageMonthlyDeliveries * payPerDeliveryPrice - plan.price
  }
  
  return plan.deliveries * payPerDeliveryPrice - plan.price
}

/**
 * Recommend plan based on monthly delivery volume
 */
export function recommendPlan(monthlyDeliveries: number): SubscriptionPlan {
  if (monthlyDeliveries <= 10) {
    return SUBSCRIPTION_PLANS[0] // Starter
  } else if (monthlyDeliveries <= 25) {
    return SUBSCRIPTION_PLANS[1] // Professional
  } else {
    return SUBSCRIPTION_PLANS[2] // Enterprise
  }
}

/**
 * Calculate ROI for customer
 */
export function calculateROI(
  plan: SubscriptionPlan,
  estimatedMonthlyDeliveries: number,
  payPerDeliveryPrice: number = 25
): {
  payPerDeliveryCost: number
  subscriptionCost: number
  savings: number
  savingsPercentage: number
  breakEvenDeliveries: number
} {
  const payPerDeliveryCost = estimatedMonthlyDeliveries * payPerDeliveryPrice
  const subscriptionCost = plan.price
  const savings = payPerDeliveryCost - subscriptionCost
  const savingsPercentage = (savings / payPerDeliveryCost) * 100
  const breakEvenDeliveries = Math.ceil(plan.price / payPerDeliveryPrice)

  return {
    payPerDeliveryCost,
    subscriptionCost,
    savings,
    savingsPercentage: Math.round(savingsPercentage),
    breakEvenDeliveries,
  }
}

/**
 * Columbus, Ohio specific business types
 */
export const COLUMBUS_BUSINESS_TYPES = [
  {
    type: 'Law Firm',
    avgMonthlyDeliveries: 20,
    recommendedPlan: 'professional',
    painPoints: [
      'Court filing deadlines',
      'Confidential documents',
      'Time-sensitive deliveries',
      'Need proof of delivery',
    ],
  },
  {
    type: 'Medical Office',
    avgMonthlyDeliveries: 15,
    recommendedPlan: 'professional',
    painPoints: [
      'HIPAA compliance',
      'Lab results delivery',
      'Prescription delivery',
      'Patient privacy',
    ],
  },
  {
    type: 'Real Estate Agent',
    avgMonthlyDeliveries: 8,
    recommendedPlan: 'starter',
    painPoints: [
      'Contract delivery',
      'Key delivery',
      'Document signing',
      'Time-sensitive closings',
    ],
  },
  {
    type: 'Small Business',
    avgMonthlyDeliveries: 12,
    recommendedPlan: 'professional',
    painPoints: [
      'Customer deliveries',
      'Supplier pickups',
      'Same-day needs',
      'Cost predictability',
    ],
  },
  {
    type: 'Accounting Firm',
    avgMonthlyDeliveries: 25,
    recommendedPlan: 'professional',
    painPoints: [
      'Tax season rush',
      'Confidential documents',
      'Client meetings',
      'Deadline pressure',
    ],
  },
]

/**
 * Generate subscription pitch for business type
 */
export function generatePitch(businessType: string): {
  headline: string
  subheadline: string
  benefits: string[]
  cta: string
} {
  const business = COLUMBUS_BUSINESS_TYPES.find((b) => b.type === businessType)
  
  if (!business) {
    return {
      headline: 'Reliable Delivery Service in Columbus',
      subheadline: 'Save time and money with our subscription plans',
      benefits: [
        'Same-day delivery',
        'Real-time tracking',
        'Proof of delivery',
        'Priority support',
      ],
      cta: 'Start Saving Today',
    }
  }

  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === business.recommendedPlan)!
  const roi = calculateROI(plan, business.avgMonthlyDeliveries)

  return {
    headline: `${businessType}s in Columbus: Save $${roi.savings}/month`,
    subheadline: `Join ${businessType}s using our ${plan.name} plan`,
    benefits: [
      `Save ${roi.savingsPercentage}% vs pay-per-delivery`,
      `${plan.deliveries === -1 ? 'Unlimited' : plan.deliveries} deliveries/month`,
      'Dedicated account manager',
      'Priority same-day delivery',
    ],
    cta: `Start ${plan.name} Plan - $${plan.price}/mo`,
  }
}

/**
 * Check if customer qualifies for subscription upgrade
 */
export function shouldUpgrade(
  currentPlan: string | null,
  deliveriesThisMonth: number,
  deliveriesLastMonth: number
): {
  shouldUpgrade: boolean
  recommendedPlan: SubscriptionPlan | null
  reason: string
} {
  // No current plan - recommend based on usage
  if (!currentPlan) {
    if (deliveriesThisMonth >= 5 || deliveriesLastMonth >= 5) {
      const recommended = recommendPlan(Math.max(deliveriesThisMonth, deliveriesLastMonth))
      return {
        shouldUpgrade: true,
        recommendedPlan: recommended,
        reason: `You've made ${deliveriesThisMonth} deliveries this month. Save $${calculateSavings(recommended)} with ${recommended.name} plan.`,
      }
    }
    return {
      shouldUpgrade: false,
      recommendedPlan: null,
      reason: 'Not enough usage yet',
    }
  }

  // Has plan - check if should upgrade
  const currentPlanData = SUBSCRIPTION_PLANS.find((p) => p.id === currentPlan)
  if (!currentPlanData) {
    return {
      shouldUpgrade: false,
      recommendedPlan: null,
      reason: 'Invalid plan',
    }
  }

  // Check if exceeding current plan limits
  if (currentPlanData.deliveries !== -1 && deliveriesThisMonth > currentPlanData.deliveries) {
    const nextPlanIndex = SUBSCRIPTION_PLANS.findIndex((p) => p.id === currentPlan) + 1
    if (nextPlanIndex < SUBSCRIPTION_PLANS.length) {
      const nextPlan = SUBSCRIPTION_PLANS[nextPlanIndex]
      return {
        shouldUpgrade: true,
        recommendedPlan: nextPlan,
        reason: `You've exceeded your ${currentPlanData.name} limit. Upgrade to ${nextPlan.name} for unlimited deliveries.`,
      }
    }
  }

  return {
    shouldUpgrade: false,
    recommendedPlan: null,
    reason: 'Current plan is optimal',
  }
}

/**
 * Calculate MRR (Monthly Recurring Revenue)
 */
export function calculateMRR(subscriptions: { planId: string; count: number }[]): {
  totalMRR: number
  breakdown: { plan: string; mrr: number; count: number }[]
  projectedARR: number
} {
  let totalMRR = 0
  const breakdown = subscriptions.map((sub) => {
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === sub.planId)!
    const mrr = plan.price * sub.count
    totalMRR += mrr
    return {
      plan: plan.name,
      mrr,
      count: sub.count,
    }
  })

  return {
    totalMRR,
    breakdown,
    projectedARR: totalMRR * 12,
  }
}
