/**
 * Admin-only API - Manage Users
 * Created: 2026-01-25
 *
 * Protected by RBAC - Only admins can access
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/middleware/rbac';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/admin/users
 * List all users (admin only)
 */
export async function GET(request: NextRequest) {
  // Check if user is admin
  const authResult = await requireAdmin();

  if (authResult instanceof NextResponse) {
    return authResult; // Return 401/403 error
  }

  const { user: adminUser } = authResult;

  try {
    // Get all users from Supabase
    const supabase = getSupabaseAdmin();
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, role, name, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      users,
      requestedBy: adminUser.email
    });
  } catch (error) {
    console.error('Error in GET /api/admin/users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users
 * Update user role (admin only)
 */
export async function PATCH(request: NextRequest) {
  // Check if user is admin
  const authResult = await requireAdmin();

  if (authResult instanceof NextResponse) {
    return authResult; // Return 401/403 error
  }

  const { user: adminUser } = authResult;

  try {
    const body = await request.json();
    const { userId, newRole } = body;

    if (!userId || !newRole) {
      return NextResponse.json(
        { error: 'Missing userId or newRole' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['admin', 'vip_client', 'courier', 'client'];
    if (!validRoles.includes(newRole)) {
      return NextResponse.json(
        { error: 'Invalid role', validRoles },
        { status: 400 }
      );
    }

    // Update user role in Supabase
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)
      .select('id, email, role')
      .single();

    if (error) {
      console.error('Error updating user role:', error);
      return NextResponse.json(
        { error: 'Failed to update user role' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: data,
      updatedBy: adminUser.email
    });
  } catch (error) {
    console.error('Error in PATCH /api/admin/users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
