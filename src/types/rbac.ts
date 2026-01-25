/**
 * RBAC Types - Role-Based Access Control
 * Created: 2026-01-25
 */

export type UserRole = 'admin' | 'vip_client' | 'courier' | 'client';

export interface RolePermissions {
  canAccessDashboard: boolean;
  canManageDeliveries: boolean;
  canManageUsers: boolean;
  canAccessHumanVault: boolean;
  canAccessCryptoPayments: boolean;
  canManageSettings: boolean;
  canViewAllDeliveries: boolean;
  canViewOwnDeliveries: boolean;
  canUpdateDeliveryStatus: boolean;
  canAccessGPS: boolean;
}

/**
 * Role-based permissions matrix
 */
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    canAccessDashboard: true,
    canManageDeliveries: true,
    canManageUsers: true,
    canAccessHumanVault: true,
    canAccessCryptoPayments: true,
    canManageSettings: true,
    canViewAllDeliveries: true,
    canViewOwnDeliveries: true,
    canUpdateDeliveryStatus: true,
    canAccessGPS: true,
  },
  vip_client: {
    canAccessDashboard: true,
    canManageDeliveries: false,
    canManageUsers: false,
    canAccessHumanVault: true,
    canAccessCryptoPayments: true,
    canManageSettings: false,
    canViewAllDeliveries: false,
    canViewOwnDeliveries: true,
    canUpdateDeliveryStatus: false,
    canAccessGPS: false,
  },
  courier: {
    canAccessDashboard: true,
    canManageDeliveries: false,
    canManageUsers: false,
    canAccessHumanVault: false,
    canAccessCryptoPayments: false,
    canManageSettings: false,
    canViewAllDeliveries: false,
    canViewOwnDeliveries: true,
    canUpdateDeliveryStatus: true,
    canAccessGPS: true,
  },
  client: {
    canAccessDashboard: true,
    canManageDeliveries: false,
    canManageUsers: false,
    canAccessHumanVault: false,
    canAccessCryptoPayments: false,
    canManageSettings: false,
    canViewAllDeliveries: false,
    canViewOwnDeliveries: true,
    canUpdateDeliveryStatus: false,
    canAccessGPS: false,
  },
};

/**
 * Get permissions for a specific role
 */
export function getPermissions(role: UserRole): RolePermissions {
  return ROLE_PERMISSIONS[role];
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(
  role: UserRole,
  permission: keyof RolePermissions
): boolean {
  return ROLE_PERMISSIONS[role][permission];
}

/**
 * Get user-friendly role name
 */
export function getRoleName(role: UserRole): string {
  const names: Record<UserRole, string> = {
    admin: 'Administrator',
    vip_client: 'VIP Client',
    courier: 'Courier',
    client: 'Client',
  };
  return names[role];
}
