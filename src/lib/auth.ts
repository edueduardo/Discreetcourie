/**
 * NextAuth Configuration
 *
 * Real authentication implementation with:
 * - Credentials provider (email/password)
 * - Supabase integration
 * - RBAC (Role-Based Access Control)
 * - Session management
 * - Password hashing with bcrypt
 */

import { NextAuthOptions, User as NextAuthUser } from 'next-auth'
import { JWT } from 'next-auth/jwt'
import CredentialsProvider from 'next-auth/providers/credentials'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcrypt'

// Extend NextAuth types to include role
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      role: 'admin' | 'vip_client' | 'client' | 'courier'
      name?: string | null
    }
  }

  interface User {
    id: string
    email: string
    role: 'admin' | 'vip_client' | 'client' | 'courier'
    name?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    email: string
    role: 'admin' | 'vip_client' | 'client' | 'courier'
  }
}

// Supabase admin client (lazy initialization to prevent build errors)
let supabaseAdminClient: ReturnType<typeof createClient> | null = null

function getSupabaseAdmin() {
  if (!supabaseAdminClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials are not configured')
    }

    supabaseAdminClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
  return supabaseAdminClient
}

/**
 * Validate password requirements
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' }
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least 1 uppercase letter' }
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least 1 number' }
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, error: 'Password must contain at least 1 special character' }
  }

  // Common passwords blacklist
  const commonPasswords = ['password123', 'admin123', 'qwerty123', '12345678']
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    return { valid: false, error: 'Password is too common' }
  }

  return { valid: true }
}

/**
 * Hash password with bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10
  return bcrypt.hash(password, saltRounds)
}

/**
 * Verify password with bcrypt
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

/**
 * NextAuth configuration
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials')
        }

        // Get user from Supabase
        const { data, error } = await getSupabaseAdmin()
          .from('users')
          .select('id, email, password_hash, role, name')
          .eq('email', credentials.email)
          .single()

        if (error || !data) {
          throw new Error('Invalid credentials')
        }

        // Type assertion for Supabase result
        const user = data as {
          id: string
          email: string
          password_hash: string
          role: string
          name: string | null
        }

        // Verify password
        const isValidPassword = await verifyPassword(credentials.password, user.password_hash)

        if (!isValidPassword) {
          throw new Error('Invalid credentials')
        }

        // Return user object (without password_hash)
        return {
          id: user.id,
          email: user.email,
          role: user.role as 'admin' | 'vip_client' | 'client' | 'courier',
          name: user.name
        }
      }
    })
  ],

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  callbacks: {
    async jwt({ token, user }) {
      // On sign in, add user data to token
      if (user) {
        token.id = user.id
        token.email = user.email
        token.role = user.role
      }
      return token
    },

    async session({ session, token }) {
      // Add user data from token to session
      if (token) {
        session.user.id = token.id
        session.user.email = token.email
        session.user.role = token.role
      }
      return session
    }
  },

  // Enable debug messages in development
  debug: process.env.NODE_ENV === 'development',
}

/**
 * Register new user
 */
export async function registerUser(data: {
  email: string
  password: string
  role?: 'admin' | 'vip_client' | 'client' | 'courier'
  name?: string
}): Promise<{ id: string; email: string; role: string }> {
  const { email, password, role = 'client', name } = data

  // Validate password
  const passwordValidation = validatePassword(password)
  if (!passwordValidation.valid) {
    throw new Error(passwordValidation.error)
  }

  // Check if user already exists
  const { data: existingUser } = await (getSupabaseAdmin() as any)
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  if (existingUser) {
    throw new Error('Email already registered')
  }

  // Hash password
  const password_hash = await hashPassword(password)

  // Create user
  const { data: newUser, error } = await (getSupabaseAdmin() as any)
    .from('users')
    .insert([
      {
        email,
        password_hash,
        role,
        name: name || null,
        created_at: new Date().toISOString()
      }
    ])
    .select('id, email, role')
    .single()

  if (error || !newUser) {
    throw new Error('Failed to create user')
  }

  return newUser
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(
  adminUser: { role: string },
  userId: string,
  newRole: 'admin' | 'vip_client' | 'client' | 'courier'
): Promise<void> {
  if (adminUser.role !== 'admin') {
    throw new Error('Forbidden')
  }

  const { error } = await (getSupabaseAdmin() as any)
    .from('users')
    .update({ role: newRole })
    .eq('id', userId)

  if (error) {
    throw new Error('Failed to update user role')
  }
}

/**
 * Get user by ID
 */
export async function getUser(userId: string) {
  const { data: user, error } = await getSupabaseAdmin()
    .from('users')
    .select('id, email, role, name, created_at')
    .eq('id', userId)
    .single()

  if (error || !user) {
    return null
  }

  return user
}
