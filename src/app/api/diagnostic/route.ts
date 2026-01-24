/**
 * Diagnostic endpoint to check authentication configuration
 * Visit: /api/diagnostic
 */

import { NextResponse } from 'next/server'

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {
      nextauth_secret: {
        configured: !!process.env.NEXTAUTH_SECRET,
        length: process.env.NEXTAUTH_SECRET?.length || 0,
        status: process.env.NEXTAUTH_SECRET ? '✅ SET' : '❌ MISSING'
      },
      nextauth_url: {
        configured: !!process.env.NEXTAUTH_URL,
        value: process.env.NEXTAUTH_URL || 'NOT SET',
        status: process.env.NEXTAUTH_URL ? '✅ SET' : '❌ MISSING'
      },
      supabase_url: {
        configured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        value: process.env.NEXT_PUBLIC_SUPABASE_URL ?
          process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + '...' :
          'NOT SET',
        status: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ SET' : '❌ MISSING'
      },
      supabase_service_key: {
        configured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
        status: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ SET' : '❌ MISSING'
      },
      supabase_anon_key: {
        configured: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        length: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
        status: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ SET' : '❌ MISSING'
      }
    },
    summary: {
      all_required_vars_set:
        !!process.env.NEXTAUTH_SECRET &&
        !!process.env.NEXTAUTH_URL &&
        !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
        (!!process.env.SUPABASE_SERVICE_ROLE_KEY || !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    }
  }

  return NextResponse.json(diagnostics, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}
