/**
 * RBAC Middleware - Role-Based Access Control
 * Created: 2026-01-25
 *
 * Usage:
 * - requireRole(['admin']) - Only admins
 * - requireRole(['admin', 'vip_client']) - Admins or VIP clients
 * - requirePermission('canAccessHumanVault') - Check specific permission
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { UserRole, RolePermissions } from '@/types/rbac';
import { hasPermission } from '@/types/rbac';

/**
 * Get current user session (server-side)
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user || null;
}

/**
 * Require user to be authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized - Please login' },
      { status: 401 }
    );
  }

  return { user };
}

/**
 * Require user to have specific role(s)
 */
export async function requireRole(allowedRoles: UserRole[]) {
  const authResult = await requireAuth();

  if (authResult instanceof NextResponse) {
    return authResult; // Return error response
  }

  const { user } = authResult;

  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json(
      {
        error: 'Forbidden - Insufficient permissions',
        required: allowedRoles,
        current: user.role
      },
      { status: 403 }
    );
  }

  return { user };
}

/**
 * Require user to have specific permission
 */
export async function requirePermission(permission: keyof RolePermissions) {
  const authResult = await requireAuth();

  if (authResult instanceof NextResponse) {
    return authResult; // Return error response
  }

  const { user } = authResult;

  if (!hasPermission(user.role, permission)) {
    return NextResponse.json(
      {
        error: 'Forbidden - Permission denied',
        required: permission,
        role: user.role
      },
      { status: 403 }
    );
  }

  return { user };
}

/**
 * Check if user is admin (helper)
 */
export async function requireAdmin() {
  return requireRole(['admin']);
}

/**
 * Check if user is VIP or admin (helper)
 */
export async function requireVIP() {
  return requireRole(['admin', 'vip_client']);
}

/**
 * Check if user is courier or admin (helper)
 */
export async function requireCourier() {
  return requireRole(['admin', 'courier']);
}
