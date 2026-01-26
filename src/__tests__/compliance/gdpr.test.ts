import {
  DEFAULT_CONSENT,
  DATA_RETENTION,
  COOKIE_CATEGORIES,
  SECURITY_HEADERS,
  getConsent,
  saveConsent,
  hasConsent,
  createAuditLog,
  formatAuditLog,
  shouldDeleteData,
  anonymizeData,
  generateComplianceReport,
  isValidGDPREmail,
  calculateDataSize
} from '@/lib/gdpr-compliance'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    clear: () => { store = {} }
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('GDPR & Compliance System', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  describe('DEFAULT_CONSENT', () => {
    it('should have essential cookies enabled by default', () => {
      expect(DEFAULT_CONSENT.essential).toBe(true)
    })

    it('should have analytics disabled by default', () => {
      expect(DEFAULT_CONSENT.analytics).toBe(false)
    })

    it('should have marketing disabled by default', () => {
      expect(DEFAULT_CONSENT.marketing).toBe(false)
    })

    it('should have version 1.0', () => {
      expect(DEFAULT_CONSENT.version).toBe('1.0')
    })
  })

  describe('DATA_RETENTION', () => {
    it('should have retention periods defined', () => {
      expect(DATA_RETENTION.deliveries).toBe(2555) // 7 years
      expect(DATA_RETENTION.auditLogs).toBe(2555)
      expect(DATA_RETENTION.customerData).toBe(1825) // 5 years
      expect(DATA_RETENTION.payments).toBe(2555)
      expect(DATA_RETENTION.analytics).toBe(730) // 2 years
      expect(DATA_RETENTION.marketing).toBe(365) // 1 year
    })

    it('should have legal compliance periods (7 years)', () => {
      expect(DATA_RETENTION.deliveries).toBeGreaterThanOrEqual(2555)
      expect(DATA_RETENTION.auditLogs).toBeGreaterThanOrEqual(2555)
      expect(DATA_RETENTION.payments).toBeGreaterThanOrEqual(2555)
    })
  })

  describe('COOKIE_CATEGORIES', () => {
    it('should have all three categories', () => {
      expect(COOKIE_CATEGORIES.essential).toBeDefined()
      expect(COOKIE_CATEGORIES.analytics).toBeDefined()
      expect(COOKIE_CATEGORIES.marketing).toBeDefined()
    })

    it('should have descriptions for each category', () => {
      expect(COOKIE_CATEGORIES.essential.description).toBeTruthy()
      expect(COOKIE_CATEGORIES.analytics.description).toBeTruthy()
      expect(COOKIE_CATEGORIES.marketing.description).toBeTruthy()
    })

    it('should list cookies for each category', () => {
      expect(COOKIE_CATEGORIES.essential.cookies.length).toBeGreaterThan(0)
      expect(COOKIE_CATEGORIES.analytics.cookies.length).toBeGreaterThan(0)
      expect(COOKIE_CATEGORIES.marketing.cookies.length).toBeGreaterThan(0)
    })
  })

  describe('SECURITY_HEADERS', () => {
    it('should have CSP header', () => {
      expect(SECURITY_HEADERS['Content-Security-Policy']).toBeDefined()
    })

    it('should have X-Frame-Options set to DENY', () => {
      expect(SECURITY_HEADERS['X-Frame-Options']).toBe('DENY')
    })

    it('should have HSTS header', () => {
      expect(SECURITY_HEADERS['Strict-Transport-Security']).toContain('max-age=31536000')
    })

    it('should have all required security headers', () => {
      expect(SECURITY_HEADERS['X-Content-Type-Options']).toBe('nosniff')
      expect(SECURITY_HEADERS['Referrer-Policy']).toBeDefined()
      expect(SECURITY_HEADERS['Permissions-Policy']).toBeDefined()
    })
  })

  describe('getConsent() and saveConsent()', () => {
    it('should return default consent when nothing saved', () => {
      const consent = getConsent()
      expect(consent.essential).toBe(true)
      expect(consent.analytics).toBe(false)
      expect(consent.marketing).toBe(false)
    })

    it('should save and retrieve consent preferences', () => {
      const preferences = {
        essential: true,
        analytics: true,
        marketing: false,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
      saveConsent(preferences)
      const retrieved = getConsent()
      expect(retrieved.analytics).toBe(true)
      expect(retrieved.marketing).toBe(false)
    })

    it('should always keep essential cookies enabled', () => {
      const preferences = {
        essential: false, // Try to disable
        analytics: true,
        marketing: true,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
      saveConsent(preferences)
      const retrieved = getConsent()
      expect(retrieved.essential).toBe(true) // Should be forced to true
    })
  })

  describe('hasConsent()', () => {
    it('should return true for essential cookies', () => {
      expect(hasConsent('essential')).toBe(true)
    })

    it('should return false for analytics by default', () => {
      expect(hasConsent('analytics')).toBe(false)
    })

    it('should return true after consent given', () => {
      saveConsent({
        essential: true,
        analytics: true,
        marketing: false,
        timestamp: new Date().toISOString(),
        version: '1.0'
      })
      expect(hasConsent('analytics')).toBe(true)
    })
  })

  describe('createAuditLog()', () => {
    it('should create audit log with all fields', () => {
      const log = createAuditLog(
        'user123',
        'test@example.com',
        'create',
        'delivery',
        'del123'
      )
      expect(log.userId).toBe('user123')
      expect(log.userEmail).toBe('test@example.com')
      expect(log.action).toBe('create')
      expect(log.resource).toBe('delivery')
      expect(log.resourceId).toBe('del123')
      expect(log.timestamp).toBeDefined()
    })

    it('should generate unique IDs', () => {
      const log1 = createAuditLog('user1', 'test@example.com', 'create', 'delivery')
      const log2 = createAuditLog('user1', 'test@example.com', 'create', 'delivery')
      expect(log1.id).not.toBe(log2.id)
    })

    it('should include metadata when provided', () => {
      const log = createAuditLog(
        'user123',
        'test@example.com',
        'export',
        'user_data',
        undefined,
        { format: 'json', size: '1MB' }
      )
      expect(log.metadata).toEqual({ format: 'json', size: '1MB' })
    })
  })

  describe('formatAuditLog()', () => {
    it('should format audit log as readable string', () => {
      const log = createAuditLog(
        'user123',
        'test@example.com',
        'create',
        'delivery',
        'del123'
      )
      const formatted = formatAuditLog(log)
      expect(formatted).toContain('test@example.com')
      expect(formatted).toContain('create')
      expect(formatted).toContain('delivery:del123')
    })
  })

  describe('shouldDeleteData()', () => {
    it('should return false for recent data', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      expect(shouldDeleteData(yesterday.toISOString(), 'deliveries')).toBe(false)
    })

    it('should return true for old data past retention', () => {
      const oldDate = new Date()
      oldDate.setFullYear(oldDate.getFullYear() - 10) // 10 years ago
      expect(shouldDeleteData(oldDate.toISOString(), 'deliveries')).toBe(true)
    })

    it('should respect different retention periods', () => {
      const twoYearsAgo = new Date()
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
      
      expect(shouldDeleteData(twoYearsAgo.toISOString(), 'analytics')).toBe(true) // 730 days
      expect(shouldDeleteData(twoYearsAgo.toISOString(), 'deliveries')).toBe(false) // 2555 days
    })
  })

  describe('anonymizeData()', () => {
    it('should replace personal data with [DELETED]', () => {
      const data = {
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-1234',
        address: '123 Main St',
        company: 'Acme Corp'
      }
      const anonymized = anonymizeData(data)
      expect(anonymized.name).toBe('[DELETED]')
      expect(anonymized.email).toBe('[DELETED]')
      expect(anonymized.phone).toBe('[DELETED]')
      expect(anonymized.address).toBe('[DELETED]')
      expect(anonymized.company).toBe('[DELETED]')
    })

    it('should keep non-personal fields', () => {
      const data = {
        id: '123',
        name: 'John Doe',
        createdAt: '2024-01-01'
      }
      const anonymized = anonymizeData(data)
      expect(anonymized.id).toBe('123')
      expect(anonymized.createdAt).toBe('2024-01-01')
    })

    it('should add deleted_at timestamp', () => {
      const data = { name: 'John Doe' }
      const anonymized = anonymizeData(data)
      expect(anonymized.deleted_at).toBeDefined()
    })
  })

  describe('generateComplianceReport()', () => {
    it('should generate compliance status', () => {
      const report = generateComplianceReport()
      expect(report.gdprCompliant).toBeDefined()
      expect(report.soc2Compliant).toBeDefined()
      expect(report.lastAudit).toBeDefined()
      expect(report.issues).toBeDefined()
      expect(report.recommendations).toBeDefined()
    })

    it('should be GDPR compliant', () => {
      const report = generateComplianceReport()
      expect(report.gdprCompliant).toBe(true)
    })

    it('should be SOC2 compliant', () => {
      const report = generateComplianceReport()
      expect(report.soc2Compliant).toBe(true)
    })

    it('should have recommendations when compliant', () => {
      const report = generateComplianceReport()
      if (report.issues.length === 0) {
        expect(report.recommendations.length).toBeGreaterThan(0)
      }
    })
  })

  describe('isValidGDPREmail()', () => {
    it('should validate correct emails', () => {
      expect(isValidGDPREmail('test@example.com')).toBe(true)
      expect(isValidGDPREmail('user.name@domain.co.uk')).toBe(true)
    })

    it('should reject invalid emails', () => {
      expect(isValidGDPREmail('invalid')).toBe(false)
      expect(isValidGDPREmail('no@domain')).toBe(false)
      expect(isValidGDPREmail('@example.com')).toBe(false)
    })
  })

  describe('calculateDataSize()', () => {
    it('should calculate data size in bytes', () => {
      const data = {
        exportDate: new Date().toISOString(),
        userId: '123',
        email: 'test@example.com',
        personalData: { name: 'Test', email: 'test@example.com', phone: '', company: '', createdAt: '' },
        deliveries: [],
        payments: [],
        consents: DEFAULT_CONSENT,
        auditLogs: []
      }
      const size = calculateDataSize(data)
      expect(size).toContain('B') // Should have unit
    })

    it('should format KB correctly', () => {
      const largeData = {
        exportDate: new Date().toISOString(),
        userId: '123',
        email: 'test@example.com',
        personalData: { name: 'Test', email: 'test@example.com', phone: '', company: '', createdAt: '' },
        deliveries: new Array(100).fill({ id: '123', data: 'x'.repeat(100) }),
        payments: [],
        consents: DEFAULT_CONSENT,
        auditLogs: []
      }
      const size = calculateDataSize(largeData)
      expect(size).toMatch(/KB|MB/)
    })
  })
})
