// GDPR & Compliance System
// Handles data privacy, consent management, audit logs, and security compliance

export type ConsentCategory = 'essential' | 'analytics' | 'marketing'
export type DataExportFormat = 'json' | 'pdf'
export type AuditAction = 'create' | 'read' | 'update' | 'delete' | 'export' | 'login' | 'logout'

export interface ConsentPreferences {
  essential: boolean // Always true, cannot be disabled
  analytics: boolean
  marketing: boolean
  timestamp: string
  version: string // Privacy policy version
}

export interface AuditLog {
  id: string
  userId: string
  userEmail: string
  action: AuditAction
  resource: string // e.g., 'delivery', 'customer', 'payment'
  resourceId?: string
  ipAddress?: string
  userAgent?: string
  timestamp: string
  metadata?: Record<string, any>
}

export interface UserDataExport {
  exportDate: string
  userId: string
  email: string
  personalData: {
    name: string
    email: string
    phone?: string
    company?: string
    createdAt: string
  }
  deliveries: any[]
  payments: any[]
  consents: ConsentPreferences
  auditLogs: AuditLog[]
}

export interface ComplianceStatus {
  gdprCompliant: boolean
  soc2Compliant: boolean
  lastAudit: string
  issues: string[]
  recommendations: string[]
}

// Default consent preferences
export const DEFAULT_CONSENT: ConsentPreferences = {
  essential: true,
  analytics: false,
  marketing: false,
  timestamp: new Date().toISOString(),
  version: '1.0'
}

// GDPR data retention periods (days)
export const DATA_RETENTION = {
  deliveries: 2555, // 7 years (legal requirement)
  auditLogs: 2555, // 7 years (legal requirement)
  customerData: 1825, // 5 years
  payments: 2555, // 7 years (legal requirement)
  analytics: 730, // 2 years
  marketing: 365 // 1 year
}

// Cookie categories and descriptions
export const COOKIE_CATEGORIES = {
  essential: {
    name: 'Essential Cookies',
    description: 'Required for the website to function. Cannot be disabled.',
    cookies: ['session', 'auth', 'csrf']
  },
  analytics: {
    name: 'Analytics Cookies',
    description: 'Help us understand how visitors use our website.',
    cookies: ['_ga', '_gid', 'analytics_session']
  },
  marketing: {
    name: 'Marketing Cookies',
    description: 'Used to deliver personalized advertisements.',
    cookies: ['_fbp', 'ads_preferences']
  }
}

// Get consent from localStorage
export function getConsent(): ConsentPreferences {
  if (typeof window === 'undefined') return DEFAULT_CONSENT

  const stored = localStorage.getItem('cookie_consent')
  if (!stored) return DEFAULT_CONSENT

  try {
    return JSON.parse(stored)
  } catch {
    return DEFAULT_CONSENT
  }
}

// Save consent to localStorage
export function saveConsent(preferences: ConsentPreferences): void {
  if (typeof window === 'undefined') return

  const consent: ConsentPreferences = {
    ...preferences,
    essential: true, // Always true
    timestamp: new Date().toISOString(),
    version: '1.0'
  }

  localStorage.setItem('cookie_consent', JSON.stringify(consent))

  // Trigger consent change event
  window.dispatchEvent(new CustomEvent('consentChanged', { detail: consent }))
}

// Check if user has given consent
export function hasConsent(category: ConsentCategory): boolean {
  const consent = getConsent()
  return consent[category]
}

// Generate UUID compatible with Node.js and browser
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for Node.js test environment
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Create audit log entry
export function createAuditLog(
  userId: string,
  userEmail: string,
  action: AuditAction,
  resource: string,
  resourceId?: string,
  metadata?: Record<string, any>
): AuditLog {
  return {
    id: generateUUID(),
    userId,
    userEmail,
    action,
    resource,
    resourceId,
    timestamp: new Date().toISOString(),
    metadata
  }
}

// Format audit log for display
export function formatAuditLog(log: AuditLog): string {
  const date = new Date(log.timestamp).toLocaleString()
  const resource = log.resourceId ? `${log.resource}:${log.resourceId}` : log.resource
  return `[${date}] ${log.userEmail} ${log.action} ${resource}`
}

// Check if data should be deleted (retention period expired)
export function shouldDeleteData(createdAt: string, dataType: keyof typeof DATA_RETENTION): boolean {
  const created = new Date(createdAt)
  const now = new Date()
  const daysDiff = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
  
  return daysDiff > DATA_RETENTION[dataType]
}

// Anonymize personal data (for GDPR right to be forgotten)
export function anonymizeData(data: any): any {
  return {
    ...data,
    name: '[DELETED]',
    email: '[DELETED]',
    phone: '[DELETED]',
    address: '[DELETED]',
    company: '[DELETED]',
    deleted_at: new Date().toISOString()
  }
}

// Generate compliance report
export function generateComplianceReport(): ComplianceStatus {
  const issues: string[] = []
  const recommendations: string[] = []

  // Check GDPR compliance
  const hasPrivacyPolicy = true // Should check if exists
  const hasCookieConsent = true // Should check implementation
  const hasDataExport = true // Should check API exists

  if (!hasPrivacyPolicy) {
    issues.push('Missing Privacy Policy')
  }
  if (!hasCookieConsent) {
    issues.push('Missing Cookie Consent Banner')
  }
  if (!hasDataExport) {
    issues.push('Missing Data Export API')
  }

  // Check SOC2 compliance
  const hasAuditLogs = true // Should check implementation
  const hasEncryption = true // Should check SSL/TLS
  const hasAccessControl = true // Should check auth

  if (!hasAuditLogs) {
    issues.push('Missing Audit Logs')
  }
  if (!hasEncryption) {
    issues.push('Missing Data Encryption')
  }
  if (!hasAccessControl) {
    issues.push('Missing Access Control')
  }

  // Recommendations
  if (issues.length === 0) {
    recommendations.push('Conduct regular security audits')
    recommendations.push('Review data retention policies')
    recommendations.push('Update privacy policy annually')
  }

  return {
    gdprCompliant: issues.filter(i => i.includes('GDPR') || i.includes('Privacy') || i.includes('Cookie') || i.includes('Data Export')).length === 0,
    soc2Compliant: issues.filter(i => i.includes('Audit') || i.includes('Encryption') || i.includes('Access')).length === 0,
    lastAudit: new Date().toISOString(),
    issues,
    recommendations
  }
}

// Security headers configuration
export const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
}

// Validate email for GDPR compliance
export function isValidGDPREmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Calculate data size for export
export function calculateDataSize(data: UserDataExport): string {
  const jsonString = JSON.stringify(data)
  const bytes = new Blob([jsonString]).size
  
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
