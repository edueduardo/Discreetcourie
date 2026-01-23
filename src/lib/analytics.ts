// Google Analytics 4 Integration

declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}

// Initialize GA4
export function initGA4() {
  if (typeof window === 'undefined') return

  const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID

  if (!measurementId) {
    console.warn('GA4 Measurement ID not configured')
    return
  }

  // Load GA4 script
  const script = document.createElement('script')
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
  script.async = true
  document.head.appendChild(script)

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    window.dataLayer.push(arguments)
  }

  window.gtag('js', new Date())
  window.gtag('config', measurementId, {
    page_path: window.location.pathname,
    send_page_view: true,
  })
}

// Track page view
export function trackPageView(url: string, title?: string) {
  if (typeof window === 'undefined' || !window.gtag) return

  window.gtag('event', 'page_view', {
    page_path: url,
    page_title: title || document.title,
  })
}

// Track custom events
export function trackEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window === 'undefined' || !window.gtag) return

  window.gtag('event', eventName, params)
}

// E-commerce events
export function trackPurchase(
  transactionId: string,
  value: number,
  currency: string = 'USD',
  items: any[] = []
) {
  trackEvent('purchase', {
    transaction_id: transactionId,
    value,
    currency,
    items,
  })
}

export function trackBeginCheckout(value: number, items: any[] = []) {
  trackEvent('begin_checkout', {
    value,
    currency: 'USD',
    items,
  })
}

export function trackAddToCart(item: any) {
  trackEvent('add_to_cart', {
    currency: 'USD',
    value: item.price,
    items: [item],
  })
}

// User engagement
export function trackSignUp(method: string = 'email') {
  trackEvent('sign_up', { method })
}

export function trackLogin(method: string = 'email') {
  trackEvent('login', { method })
}

export function trackSearch(searchTerm: string) {
  trackEvent('search', { search_term: searchTerm })
}

// Custom DiscreetCourie events
export function trackDeliveryCreated(deliveryId: string, price: number, distance: number) {
  trackEvent('delivery_created', {
    delivery_id: deliveryId,
    value: price,
    distance_km: distance,
  })
}

export function trackDeliveryCompleted(deliveryId: string, duration: number, rating?: number) {
  trackEvent('delivery_completed', {
    delivery_id: deliveryId,
    duration_minutes: duration,
    rating,
  })
}

export function trackDriverAssigned(deliveryId: string, driverId: string) {
  trackEvent('driver_assigned', {
    delivery_id: deliveryId,
    driver_id: driverId,
  })
}

export function trackFeedbackSubmitted(rating: number, deliveryId: string) {
  trackEvent('feedback_submitted', {
    rating,
    delivery_id: deliveryId,
  })
}

// Set user properties
export function setUserProperties(userId: string, properties: Record<string, any>) {
  if (typeof window === 'undefined' || !window.gtag) return

  window.gtag('set', 'user_properties', properties)
  window.gtag('config', process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID, {
    user_id: userId,
  })
}

// Conversion tracking
export function trackConversion(conversionLabel: string, value?: number) {
  trackEvent('conversion', {
    send_to: conversionLabel,
    value,
  })
}
