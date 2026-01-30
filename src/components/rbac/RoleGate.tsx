/**
 * RoleGate Component - Conditional rendering based on user role
 * Created: 2026-01-25
 *
 * Usage:
 * <RoleGate allowedRoles={['admin']}>
 *   <AdminPanel />
 * </RoleGate>
 *
 * <RoleGate allowedRoles={['admin', 'vip_client']}>
 *   <HumanVault />
 * </RoleGate>
 */

'use client';

import { useRBAC } from '@/hooks/useRBAC';
import type { UserRole } from '@/types/rbac';

interface RoleGateProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGate({ allowedRoles, children, fallback = null }: RoleGateProps) {
  const { role, isLoading } = useRBAC();

  if (isLoading) {
    return null; // Or a loading spinner
  }

  if (!role || !allowedRoles.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * AdminOnly - Shorthand for admin-only content
 */
export function AdminOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGate allowedRoles={['admin']} fallback={fallback}>
      {children}
    </RoleGate>
  );
}

/**
 * VIPOnly - Shorthand for VIP-only content (includes admin)
 */
export function VIPOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGate allowedRoles={['admin', 'vip_client']} fallback={fallback}>
      {children}
    </RoleGate>
  );
}

/**
 * CourierOnly - Shorthand for courier-only content (includes admin)
 */
export function CourierOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGate allowedRoles={['admin', 'courier']} fallback={fallback}>
      {children}
    </RoleGate>
  );
}
