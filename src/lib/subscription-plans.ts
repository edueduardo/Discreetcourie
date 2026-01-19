// Planos de assinatura do Discreet Courier
export const SUBSCRIPTION_PLANS = {
  guardian_basic: {
    name: 'Guardian Mode Basic',
    description: 'Priority access during extended hours',
    price: 99,
    interval: 'month' as const,
    features: ['Check-in diário', 'Alertas SMS', 'Suporte por email']
  },
  guardian_premium: {
    name: 'Guardian Mode Premium', 
    description: 'Full priority access + emergency on-call',
    price: 299,
    interval: 'month' as const,
    features: ['Check-in em tempo real', 'Alertas SMS + Chamada', 'Suporte prioritário', 'Protocolo de emergência']
  },
  vault_storage: {
    name: 'Cofre Humano',
    description: 'Armazenamento seguro de documentos',
    price: 49,
    interval: 'month' as const,
    features: ['Até 10 itens', 'Criptografia AES-256', 'Last Will básico']
  },
  vault_premium: {
    name: 'Cofre Humano Premium',
    description: 'Cofre ilimitado com recursos avançados',
    price: 149,
    interval: 'month' as const,
    features: ['Itens ilimitados', 'Last Will avançado', 'Time Capsule', 'Vídeo de destruição']
  },
  concierge_retainer: {
    name: 'Concierge Retainer',
    description: 'Acesso prioritário ao serviço de concierge',
    price: 499,
    interval: 'month' as const,
    features: ['10 horas inclusas', 'Prioridade máxima', 'Linha direta', 'Sem taxas de urgência']
  }
}

export type SubscriptionPlanKey = keyof typeof SUBSCRIPTION_PLANS
export type SubscriptionPlan = typeof SUBSCRIPTION_PLANS[SubscriptionPlanKey]
