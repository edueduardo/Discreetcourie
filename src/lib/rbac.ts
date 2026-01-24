/**
 * RBAC (Role-Based Access Control) System
 *
 * Defines roles, permissions, and access control logic
 */

export type Role = 'admin' | 'vip_client' | 'client' | 'courier'

export type Permission =
  // Vault permissions
  | 'vault:read'
  | 'vault:write'
  | 'vault:delete'
  // Delivery permissions
  | 'delivery:create'
  | 'delivery:view_own'
  | 'delivery:view_all'
  | 'delivery:update_status'
  | 'delivery:delete'
  // NDA permissions
  | 'nda:create'
  | 'nda:sign'
  | 'nda:view_own'
  | 'nda:view_all'
  // Crypto payment permissions
  | 'crypto:pay'
  | 'crypto:view_transactions'
  // User management permissions
  | 'user:create'
  | 'user:delete'
  | 'user:update_role'
  // Admin permissions
  | 'admin:access'
  | 'admin:financials'
  | 'admin:settings'
  // Wildcard
  | '*'

/**
 * Role definitions with permissions
 */
export const rolePermissions: Record<Role, Permission[]> = {
  admin: [
    '*', // Admin has all permissions
  ],

  vip_client: [
    // Vault (premium feature)
    'vault:read',
    'vault:write',
    'vault:delete',
    // Deliveries
    'delivery:create',
    'delivery:view_own',
    // NDA (premium feature)
    'nda:create',
    'nda:sign',
    'nda:view_own',
    // Crypto payments (premium feature)
    'crypto:pay',
    'crypto:view_transactions',
  ],

  client: [
    // Deliveries only
    'delivery:create',
    'delivery:view_own',
    // Basic NDA
    'nda:sign',
    'nda:view_own',
  ],

  courier: [
    // Delivery management
    'delivery:view_all',
    'delivery:update_status',
  ],
}

/**
 * Check if role has specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = rolePermissions[role]

  // Check for wildcard (admin has all)
  if (permissions.includes('*')) {
    return true
  }

  // Check for specific permission
  return permissions.includes(permission)
}

/**
 * Check if user can access route
 */
export function canAccessRoute(
  user: { role: Role } | null,
  route: string
): boolean {
  // Public routes (no auth required)
  const publicRoutes = ['/', '/track', '/login', '/register']
  if (publicRoutes.includes(route)) {
    return true
  }

  // Auth required for all other routes
  if (!user) {
    return false
  }

  // Route-specific permissions
  if (route.startsWith('/admin')) {
    return hasPermission(user.role, 'admin:access')
  }

  if (route.startsWith('/vault')) {
    return hasPermission(user.role, 'vault:read')
  }

  if (route.startsWith('/portal')) {
    // All authenticated users can access portal
    return true
  }

  // Default: authenticated users can access
  return true
}

/**
 * Check if user can access resource (e.g., specific delivery)
 */
export function canAccessResource(
  user: { id: string; role: Role },
  resource: { client_id?: string; courier_id?: string; user_id?: string }
): boolean {
  // Admin can access all
  if (user.role === 'admin') {
    return true
  }

  // Courier can access assigned deliveries
  if (user.role === 'courier' && resource.courier_id === user.id) {
    return true
  }

  // Client can access own resources
  if (resource.client_id === user.id || resource.user_id === user.id) {
    return true
  }

  return false
}

/**
 * Get rate limits by role
 */
export function getRateLimits(role: Role): {
  requests_per_minute: number
  requests_per_hour: number
} {
  const limits = {
    admin: {
      requests_per_minute: 0, // No limit
      requests_per_hour: 0,
    },
    vip_client: {
      requests_per_minute: 100,
      requests_per_hour: 5000,
    },
    client: {
      requests_per_minute: 20,
      requests_per_hour: 500,
    },
    courier: {
      requests_per_minute: 50,
      requests_per_hour: 2000,
    },
  }

  return limits[role]
}

/**
 * Get role definition
 */
export function getRole(roleName: Role) {
  return {
    name: roleName,
    permissions: rolePermissions[roleName],
  }
}

/**
 * Log security event
 */
export async function logSecurityEvent(event: {
  user_id?: string
  action: string
  route?: string
  ip?: string
  success: boolean
  timestamp: Date
}) {
  // TODO: Implement actual logging to database or service (Sentry, etc)
  console.log('[SECURITY]', event)

  // In production, log to database:
  // await supabase.from('security_logs').insert([event])
}
