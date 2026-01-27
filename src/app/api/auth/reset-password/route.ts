import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Request password reset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, token, new_password } = body

    // If token and new_password provided, this is a password reset
    if (token && new_password) {
      return await resetPassword(token, new_password)
    }

    // Otherwise, this is a password reset request
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', email)
      .single()

    if (userError || !user) {
      // Don't reveal if user exists or not (security)
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.'
      })
    }

    // Generate reset token
    const resetToken = uuidv4()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour

    // Save reset token
    await supabase
      .from('users')
      .update({
        reset_token: resetToken,
        reset_token_expires: expiresAt
      })
      .eq('id', user.id)

    // Send email with reset link
    try {
      const { sendEmail } = await import('@/lib/email')
      const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`

      await sendEmail({
        to: user.email,
        template: 'admin_notification',
        variables: {
          subject: 'Password Reset Request',
          message: `Hi ${user.name || 'there'},\n\nYou requested a password reset. Click the link below to reset your password:\n\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, please ignore this email.`,
          actionUrl: resetUrl
        }
      })
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError)
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.'
    })
  } catch (error: any) {
    console.error('Password reset request error:', error)
    
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    )
  }
}

async function resetPassword(token: string, newPassword: string) {
  try {
    // Validate password
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Find user by token
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, reset_token_expires')
      .eq('reset_token', token)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Check if token expired
    if (new Date(user.reset_token_expires) < new Date()) {
      return NextResponse.json(
        { error: 'Reset token has expired' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password and clear reset token
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        reset_token: null,
        reset_token_expires: null
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    })
  } catch (error: any) {
    console.error('Password reset error:', error)
    
    return NextResponse.json(
      { error: error.message || 'Failed to reset password' },
      { status: 500 }
    )
  }
}
