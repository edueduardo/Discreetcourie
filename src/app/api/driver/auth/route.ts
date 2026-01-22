import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// POST - Driver login with PIN
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()
  
  const { pin } = body
  
  if (!pin || pin.length < 4) {
    return NextResponse.json({ error: 'PIN required (min 4 digits)' }, { status: 400 })
  }
  
  // For solo operator: single driver PIN stored in settings
  const { data: setting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'driver_pin')
    .single()
  
  const storedPin = setting?.value || process.env.DRIVER_AUTH_SECRET || '1234'
  
  if (pin !== storedPin) {
    return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
  }
  
  // Generate session token
  const sessionToken = generateSessionToken()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  
  // Store session in database
  await supabase.from('driver_sessions').upsert({
    token: sessionToken,
    expires_at: expiresAt.toISOString(),
    created_at: new Date().toISOString()
  }, { onConflict: 'token' })
  
  // Set cookie
  const cookieStore = cookies()
  cookieStore.set('driver_session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/driver'
  })
  
  return NextResponse.json({
    success: true,
    message: 'Login successful',
    expiresAt: expiresAt.toISOString()
  })
}

// GET - Check session status
export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const sessionToken = cookieStore.get('driver_session')?.value
  
  if (!sessionToken) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
  
  const supabase = createClient()
  const { data: session } = await supabase
    .from('driver_sessions')
    .select('expires_at')
    .eq('token', sessionToken)
    .single()
  
  if (!session || new Date(session.expires_at) < new Date()) {
    // Clear expired cookie
    cookieStore.delete('driver_session')
    return NextResponse.json({ authenticated: false, reason: 'expired' }, { status: 401 })
  }
  
  return NextResponse.json({ authenticated: true })
}

// DELETE - Logout
export async function DELETE() {
  const cookieStore = cookies()
  const sessionToken = cookieStore.get('driver_session')?.value
  
  if (sessionToken) {
    const supabase = createClient()
    await supabase.from('driver_sessions').delete().eq('token', sessionToken)
    cookieStore.delete('driver_session')
  }
  
  return NextResponse.json({ success: true, message: 'Logged out' })
}

function generateSessionToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}
