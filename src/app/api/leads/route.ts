import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/middleware/rbac'

// GET - List all leads (admin only)
export async function GET(request: NextRequest) {
  // ✅ SECURITY: Only admins can view leads
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const source = searchParams.get('source')

    let query = supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }
    if (source) {
      query = query.eq('source', source)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ leads: data || [] })
  } catch (error: any) {

    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create new lead (admin only)
export async function POST(request: NextRequest) {
  // ✅ SECURITY: Only admins can create leads
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const supabase = await createClient()
    const body = await request.json()

    const { name, company, phone, email, source, potential_value, tags, notes, next_followup } = body

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('leads')
      .insert({
        name,
        company,
        phone,
        email,
        source: source || 'other',
        status: 'new',
        potential_value: potential_value ? parseFloat(potential_value) : null,
        tags: tags || [],
        notes,
        next_followup
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ lead: data })
  } catch (error: any) {

    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH - Update lead (admin only)
export async function PATCH(request: NextRequest) {
  // ✅ SECURITY: Only admins can update leads
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const supabase = await createClient()
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('leads')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ lead: data })
  } catch (error: any) {

    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete lead (admin only)
export async function DELETE(request: NextRequest) {
  // ✅ SECURITY: Only admins can delete leads
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {

    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
