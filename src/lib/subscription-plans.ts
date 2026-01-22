// Solo-viable subscription plans for Discreet Courier
export const SUBSCRIPTION_PLANS = {
  priority_client: {
    name: 'Priority Client',
    description: 'Priority scheduling and direct communication',
    price: 99,
    interval: 'month' as const,
    features: ['Priority booking', 'Direct SMS line', 'Same-day guaranteed', '10% recurring discount']
  },
  vip_retainer: {
    name: 'VIP Retainer',
    description: 'Monthly retainer with guaranteed availability',
    price: 299,
    interval: 'month' as const,
    features: ['4 deliveries/month included', 'Priority scheduling', 'Direct phone line', '15% discount on extras', '48h advance booking']
  }
}

export type SubscriptionPlanKey = keyof typeof SUBSCRIPTION_PLANS
export type SubscriptionPlan = typeof SUBSCRIPTION_PLANS[SubscriptionPlanKey]
