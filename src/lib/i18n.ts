// Simple i18n implementation for Discreet Courier

export type Locale = 'en' | 'pt' | 'es'

export const DEFAULT_LOCALE: Locale = 'en'

export const LOCALES: Record<Locale, string> = {
  en: 'English',
  pt: 'Português',
  es: 'Español'
}

type TranslationKey = string
type TranslationValue = string | Record<string, string>

const translations: Record<Locale, Record<TranslationKey, TranslationValue>> = {
  en: {
    // Common
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.create': 'Create',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.status': 'Status',
    'common.actions': 'Actions',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.submit': 'Submit',
    'common.confirm': 'Confirm',
    'common.yes': 'Yes',
    'common.no': 'No',

    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.deliveries': 'Deliveries',
    'nav.clients': 'Clients',
    'nav.vault': 'Vault',
    'nav.guardian': 'Guardian Mode',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',
    'nav.portal': 'Client Portal',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.welcome': 'Welcome back',
    'dashboard.totalRevenue': 'Total Revenue',
    'dashboard.activeClients': 'Active Clients',
    'dashboard.pendingDeliveries': 'Pending Deliveries',
    'dashboard.completedDeliveries': 'Completed Deliveries',

    // Deliveries
    'delivery.title': 'Deliveries',
    'delivery.new': 'New Delivery',
    'delivery.tracking': 'Tracking Code',
    'delivery.status.pending': 'Pending',
    'delivery.status.picked_up': 'Picked Up',
    'delivery.status.in_transit': 'In Transit',
    'delivery.status.delivered': 'Delivered',
    'delivery.status.cancelled': 'Cancelled',

    // Clients
    'client.title': 'Clients',
    'client.new': 'New Client',
    'client.codeName': 'Code Name',
    'client.vip': 'VIP',
    'client.status.active': 'Active',
    'client.status.inactive': 'Inactive',

    // Vault
    'vault.title': 'Human Vault',
    'vault.newItem': 'New Item',
    'vault.lastWill': 'Last Will',
    'vault.timeCapsule': 'Time Capsule',
    'vault.encrypted': 'Encrypted',

    // Guardian Mode
    'guardian.title': 'Guardian Mode',
    'guardian.active': 'Active',
    'guardian.inactive': 'Inactive',
    'guardian.checkin': 'Check-in',
    'guardian.lastCheckin': 'Last Check-in',
    'guardian.alert': 'Alert Triggered',

    // Portal
    'portal.title': 'Client Portal',
    'portal.myDeliveries': 'My Deliveries',
    'portal.myVault': 'My Vault',
    'portal.subscriptions': 'Subscriptions',
    'portal.billing': 'Billing',
    'portal.support': 'Support',

    // Subscriptions
    'subscription.title': 'Subscriptions',
    'subscription.currentPlan': 'Current Plan',
    'subscription.upgrade': 'Upgrade',
    'subscription.cancel': 'Cancel Subscription',
    'subscription.manageBilling': 'Manage Billing',

    // Notifications
    'notification.deliveryCreated': 'Delivery created successfully',
    'notification.deliveryUpdated': 'Delivery updated',
    'notification.paymentReceived': 'Payment received',
    'notification.paymentFailed': 'Payment failed',
  },

  pt: {
    // Common
    'common.loading': 'Carregando...',
    'common.error': 'Ocorreu um erro',
    'common.save': 'Salvar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Excluir',
    'common.edit': 'Editar',
    'common.create': 'Criar',
    'common.search': 'Buscar',
    'common.filter': 'Filtrar',
    'common.status': 'Status',
    'common.actions': 'Ações',
    'common.back': 'Voltar',
    'common.next': 'Próximo',
    'common.previous': 'Anterior',
    'common.submit': 'Enviar',
    'common.confirm': 'Confirmar',
    'common.yes': 'Sim',
    'common.no': 'Não',

    // Navigation
    'nav.dashboard': 'Painel',
    'nav.deliveries': 'Entregas',
    'nav.clients': 'Clientes',
    'nav.vault': 'Cofre',
    'nav.guardian': 'Modo Guardião',
    'nav.settings': 'Configurações',
    'nav.logout': 'Sair',
    'nav.portal': 'Portal do Cliente',

    // Dashboard
    'dashboard.title': 'Painel',
    'dashboard.welcome': 'Bem-vindo de volta',
    'dashboard.totalRevenue': 'Receita Total',
    'dashboard.activeClients': 'Clientes Ativos',
    'dashboard.pendingDeliveries': 'Entregas Pendentes',
    'dashboard.completedDeliveries': 'Entregas Concluídas',

    // Deliveries
    'delivery.title': 'Entregas',
    'delivery.new': 'Nova Entrega',
    'delivery.tracking': 'Código de Rastreio',
    'delivery.status.pending': 'Pendente',
    'delivery.status.picked_up': 'Coletado',
    'delivery.status.in_transit': 'Em Trânsito',
    'delivery.status.delivered': 'Entregue',
    'delivery.status.cancelled': 'Cancelado',

    // Clients
    'client.title': 'Clientes',
    'client.new': 'Novo Cliente',
    'client.codeName': 'Codinome',
    'client.vip': 'VIP',
    'client.status.active': 'Ativo',
    'client.status.inactive': 'Inativo',

    // Vault
    'vault.title': 'Cofre Humano',
    'vault.newItem': 'Novo Item',
    'vault.lastWill': 'Última Vontade',
    'vault.timeCapsule': 'Cápsula do Tempo',
    'vault.encrypted': 'Criptografado',

    // Guardian Mode
    'guardian.title': 'Modo Guardião',
    'guardian.active': 'Ativo',
    'guardian.inactive': 'Inativo',
    'guardian.checkin': 'Check-in',
    'guardian.lastCheckin': 'Último Check-in',
    'guardian.alert': 'Alerta Acionado',

    // Portal
    'portal.title': 'Portal do Cliente',
    'portal.myDeliveries': 'Minhas Entregas',
    'portal.myVault': 'Meu Cofre',
    'portal.subscriptions': 'Assinaturas',
    'portal.billing': 'Faturamento',
    'portal.support': 'Suporte',

    // Subscriptions
    'subscription.title': 'Assinaturas',
    'subscription.currentPlan': 'Plano Atual',
    'subscription.upgrade': 'Fazer Upgrade',
    'subscription.cancel': 'Cancelar Assinatura',
    'subscription.manageBilling': 'Gerenciar Faturamento',

    // Notifications
    'notification.deliveryCreated': 'Entrega criada com sucesso',
    'notification.deliveryUpdated': 'Entrega atualizada',
    'notification.paymentReceived': 'Pagamento recebido',
    'notification.paymentFailed': 'Pagamento falhou',
  },

  es: {
    // Common
    'common.loading': 'Cargando...',
    'common.error': 'Ocurrió un error',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.create': 'Crear',
    'common.search': 'Buscar',
    'common.filter': 'Filtrar',
    'common.status': 'Estado',
    'common.actions': 'Acciones',
    'common.back': 'Volver',
    'common.next': 'Siguiente',
    'common.previous': 'Anterior',
    'common.submit': 'Enviar',
    'common.confirm': 'Confirmar',
    'common.yes': 'Sí',
    'common.no': 'No',

    // Navigation
    'nav.dashboard': 'Panel',
    'nav.deliveries': 'Entregas',
    'nav.clients': 'Clientes',
    'nav.vault': 'Bóveda',
    'nav.guardian': 'Modo Guardián',
    'nav.settings': 'Configuración',
    'nav.logout': 'Salir',
    'nav.portal': 'Portal del Cliente',

    // Dashboard
    'dashboard.title': 'Panel',
    'dashboard.welcome': 'Bienvenido de nuevo',
    'dashboard.totalRevenue': 'Ingresos Totales',
    'dashboard.activeClients': 'Clientes Activos',
    'dashboard.pendingDeliveries': 'Entregas Pendientes',
    'dashboard.completedDeliveries': 'Entregas Completadas',

    // Deliveries
    'delivery.title': 'Entregas',
    'delivery.new': 'Nueva Entrega',
    'delivery.tracking': 'Código de Seguimiento',
    'delivery.status.pending': 'Pendiente',
    'delivery.status.picked_up': 'Recogido',
    'delivery.status.in_transit': 'En Tránsito',
    'delivery.status.delivered': 'Entregado',
    'delivery.status.cancelled': 'Cancelado',

    // Clients
    'client.title': 'Clientes',
    'client.new': 'Nuevo Cliente',
    'client.codeName': 'Nombre Código',
    'client.vip': 'VIP',
    'client.status.active': 'Activo',
    'client.status.inactive': 'Inactivo',

    // Vault
    'vault.title': 'Bóveda Humana',
    'vault.newItem': 'Nuevo Elemento',
    'vault.lastWill': 'Última Voluntad',
    'vault.timeCapsule': 'Cápsula del Tiempo',
    'vault.encrypted': 'Cifrado',

    // Guardian Mode
    'guardian.title': 'Modo Guardián',
    'guardian.active': 'Activo',
    'guardian.inactive': 'Inactivo',
    'guardian.checkin': 'Check-in',
    'guardian.lastCheckin': 'Último Check-in',
    'guardian.alert': 'Alerta Activada',

    // Portal
    'portal.title': 'Portal del Cliente',
    'portal.myDeliveries': 'Mis Entregas',
    'portal.myVault': 'Mi Bóveda',
    'portal.subscriptions': 'Suscripciones',
    'portal.billing': 'Facturación',
    'portal.support': 'Soporte',

    // Subscriptions
    'subscription.title': 'Suscripciones',
    'subscription.currentPlan': 'Plan Actual',
    'subscription.upgrade': 'Mejorar',
    'subscription.cancel': 'Cancelar Suscripción',
    'subscription.manageBilling': 'Gestionar Facturación',

    // Notifications
    'notification.deliveryCreated': 'Entrega creada exitosamente',
    'notification.deliveryUpdated': 'Entrega actualizada',
    'notification.paymentReceived': 'Pago recibido',
    'notification.paymentFailed': 'Pago fallido',
  }
}

export function t(key: TranslationKey, locale: Locale = DEFAULT_LOCALE, params?: Record<string, string>): string {
  let text = translations[locale]?.[key] || translations[DEFAULT_LOCALE]?.[key] || key
  
  if (typeof text !== 'string') {
    return key
  }
  
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = (text as string).replace(new RegExp(`{${k}}`, 'g'), v)
    })
  }
  
  return text
}

export function getLocaleFromHeader(acceptLanguage?: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE
  
  const locales = acceptLanguage.split(',').map(lang => {
    const [code] = lang.trim().split(';')
    return code.split('-')[0].toLowerCase()
  })
  
  for (const locale of locales) {
    if (locale in LOCALES) {
      return locale as Locale
    }
  }
  
  return DEFAULT_LOCALE
}

export function getAllTranslations(locale: Locale = DEFAULT_LOCALE) {
  return translations[locale] || translations[DEFAULT_LOCALE]
}
