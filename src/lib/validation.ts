/**
 * Input Validation & Sanitization
 * Protects against SQL Injection, XSS, and malicious inputs
 * Uses Zod for schema validation
 */

import { z } from 'zod'

/**
 * Sanitize string input
 * - Trims whitespace
 * - Removes null bytes
 * - Limits length
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  return input
    .trim()
    .replace(/\0/g, '') // Remove null bytes
    .slice(0, maxLength) // Enforce max length
}

/**
 * Sanitize HTML to prevent XSS
 * Basic sanitization - for production use DOMPurify or similar
 */
export function sanitizeHTML(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Validate and sanitize phone number
 */
export function sanitizePhone(phone: string): string {
  // Remove all non-digit characters except + at the beginning
  const cleaned = phone.replace(/[^\d+]/g, '')

  // Ensure + only at the beginning
  if (cleaned.startsWith('+')) {
    return '+' + cleaned.slice(1).replace(/\+/g, '')
  }

  return cleaned
}

/**
 * Validate email format
 */
export const emailSchema = z.string().email().max(255)

/**
 * Validate phone number (US format)
 */
export const phoneSchema = z.string().refine(
  (val) => {
    const cleaned = val.replace(/\D/g, '')
    return cleaned.length === 10 || cleaned.length === 11
  },
  { message: 'Invalid phone number format' }
)

/**
 * Validate UUID
 */
export const uuidSchema = z.string().uuid()

/**
 * Validate tracking code
 */
export const trackingCodeSchema = z.string().regex(/^DC-[A-Z0-9]+$/, {
  message: 'Invalid tracking code format'
})

/**
 * Validate address
 */
export const addressSchema = z.string().min(5).max(500).transform(val => sanitizeString(val, 500))

/**
 * Validate delivery status
 */
export const deliveryStatusSchema = z.enum([
  'pending',
  'confirmed',
  'picked_up',
  'in_transit',
  'delivered',
  'failed',
  'cancelled'
])

/**
 * Validate delivery priority
 */
export const deliveryPrioritySchema = z.enum(['standard', 'express', 'urgent'])

/**
 * Validate package size
 */
export const packageSizeSchema = z.enum(['small', 'medium', 'large'])

/**
 * Schema for creating a new delivery/order
 */
export const createOrderSchema = z.object({
  // Client info
  client_id: uuidSchema.optional(),
  client_name: z.string().min(1).max(255).transform(val => sanitizeString(val, 255)).optional(),
  contact_phone: z.string().max(50).transform(val => sanitizePhone(val)).optional(),

  // Pickup details
  pickup_address: z.string().min(5).max(500).transform(val => sanitizeString(val, 500)).optional(),
  pickup_contact: z.string().max(255).transform(val => sanitizeString(val, 255)).optional(),
  pickup_phone: z.string().max(50).transform(val => sanitizePhone(val)).optional(),
  pickup_notes: z.string().max(1000).transform(val => sanitizeString(val, 1000)).optional(),

  // Delivery details (required)
  delivery_address: addressSchema,
  delivery_contact: z.string().max(255).transform(val => sanitizeString(val, 255)).optional(),
  delivery_phone: z.string().max(50).transform(val => sanitizePhone(val)).optional(),
  delivery_notes: z.string().max(1000).transform(val => sanitizeString(val, 1000)).optional(),

  // Package details
  package_description: z.string().max(1000).transform(val => sanitizeString(val, 1000)).optional(),
  package_size: packageSizeSchema.optional(),
  is_fragile: z.boolean().optional(),
  is_confidential: z.boolean().optional(),

  // Scheduling
  scheduled_date: z.string().datetime().optional(),
  scheduled_time: z.string().optional(),

  // Pricing
  price: z.number().min(0).max(999999.99).optional(),
  priority: deliveryPrioritySchema.optional(),

  // Advanced features
  service_level: z.number().int().min(1).max(5).optional(),
  no_trace_mode: z.boolean().optional(),
  item_type: z.string().max(100).optional(),
  item_description: z.string().max(1000).transform(val => sanitizeString(val, 1000)).optional(),
  special_instructions: z.string().max(2000).transform(val => sanitizeString(val, 2000)).optional()
})

/**
 * Schema for SMS sending
 */
export const sendSMSSchema = z.object({
  to: z.string().min(10).max(20).transform(val => sanitizePhone(val)),
  message: z.string().min(1).max(1600).transform(val => sanitizeString(val, 1600)),
  deliveryId: uuidSchema.optional(),
  clientId: uuidSchema.optional()
})

/**
 * Schema for updating order status
 */
export const updateOrderStatusSchema = z.object({
  status: deliveryStatusSchema,
  notes: z.string().max(1000).transform(val => sanitizeString(val, 1000)).optional(),
  location: z.string().max(500).transform(val => sanitizeString(val, 500)).optional()
})

/**
 * Schema for search/filter params
 */
export const searchParamsSchema = z.object({
  status: deliveryStatusSchema.optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0 && n <= 100).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).refine(n => n >= 0).optional(),
  search: z.string().max(255).transform(val => sanitizeString(val, 255)).optional()
})

/**
 * Helper to validate and parse data
 * Returns validated data or throws ZodError with detailed messages
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data)
}

/**
 * Helper to safely validate and parse data
 * Returns { success: true, data } or { success: false, error }
 */
export function safeValidateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  return { success: false, error: result.error }
}

/**
 * Format Zod errors for API response
 */
export function formatValidationErrors(error: z.ZodError): {
  error: string
  details: Array<{ field: string; message: string }>
} {
  return {
    error: 'Validation failed',
    details: error.issues.map((err) => ({
      field: err.path.join('.'),
      message: err.message
    }))
  }
}
