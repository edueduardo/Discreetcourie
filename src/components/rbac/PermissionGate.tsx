/**
 * PermissionGate Component - Conditional rendering based on permissions
 * Created: 2026-01-25
 *
 * Usage:
 * <PermissionGate permission="canAccessHumanVault">
 *   <HumanVaultLink />
 * </PermissionGate>
 *
 * <PermissionGate permission="canManageUsers">
 *   <UserManagement />
 * </PermissionGate>
 */

'use client';

import { useRBAC } from '@/hooks/useRBAC';
import type { RolePermissions } from '@/types/rbac';

interface PermissionGateProps {
  permission: keyof RolePermissions;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const { hasPermission, isLoading } = useRBAC();

  if (isLoading) {
    return null; // Or a loading spinner
  }

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
