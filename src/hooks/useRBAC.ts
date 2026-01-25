/**
 * RBAC Hooks - Client-side role checking
 * Created: 2026-01-25
 *
 * Usage:
 * const { role, isAdmin, isVIP, hasPermission } = useRBAC();
 * if (isAdmin) { ... }
 * if (hasPermission('canAccessHumanVault')) { ... }
 */

import { useSession } from 'next-auth/react';
import type { UserRole, RolePermissions } from '@/types/rbac';
import { hasPermission as checkPermission, getPermissions } from '@/types/rbac';

export function useRBAC() {
  const { data: session, status } = useSession();

  const user = session?.user;
  const role = user?.role as UserRole | undefined;
  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading';

  // Role checks
  const isAdmin = role === 'admin';
  const isVIP = role === 'vip_client';
  const isCourier = role === 'courier';
  const isClient = role === 'client';

  // Permission check
  const hasPermission = (permission: keyof RolePermissions): boolean => {
    if (!role) return false;
    return checkPermission(role, permission);
  };

  // Get all permissions for current role
  const permissions = role ? getPermissions(role) : null;

  return {
    // User info
    user,
    role,
    isAuthenticated,
    isLoading,

    // Role checks
    isAdmin,
    isVIP,
    isCourier,
    isClient,

    // Permission checks
    hasPermission,
    permissions,

    // Helpers
    canAccessDashboard: permissions?.canAccessDashboard ?? false,
    canManageDeliveries: permissions?.canManageDeliveries ?? false,
    canManageUsers: permissions?.canManageUsers ?? false,
    canAccessHumanVault: permissions?.canAccessHumanVault ?? false,
    canAccessCryptoPayments: permissions?.canAccessCryptoPayments ?? false,
    canManageSettings: permissions?.canManageSettings ?? false,
    canViewAllDeliveries: permissions?.canViewAllDeliveries ?? false,
    canViewOwnDeliveries: permissions?.canViewOwnDeliveries ?? false,
    canUpdateDeliveryStatus: permissions?.canUpdateDeliveryStatus ?? false,
    canAccessGPS: permissions?.canAccessGPS ?? false,
  };
}
