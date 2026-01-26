import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/middleware/rbac'

// GET - List all expenses (admin only)
export async function GET(request: NextRequest) {
  // ✅ SECURITY: Only admins can view expenses
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')

    let query = supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ expenses: data || [] })
  } catch (error: any) {

    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create new expense (admin only)
export async function POST(request: NextRequest) {
  // ✅ SECURITY: Only admins can create expenses
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const supabase = await createClient()
    const body = await request.json()

    const { description, amount, category, date, vendor, notes, receipt_url } = body

    if (!description || !amount || !category) {
      return NextResponse.json(
        { error: 'description, amount, and category are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        description,
        amount: parseFloat(amount),
        category,
        date: date || new Date().toISOString().split('T')[0],
        vendor,
        notes,
        receipt_url,
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ expense: data })
  } catch (error: any) {

    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH - Update expense status (admin only)
export async function PATCH(request: NextRequest) {
  // ✅ SECURITY: Only admins can update expenses
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const supabase = await createClient()
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json(
        { error: 'id and status are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('expenses')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ expense: data })
  } catch (error: any) {

    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete expense (admin only)
export async function DELETE(request: NextRequest) {
  // ✅ SECURITY: Only admins can delete expenses
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
      .from('expenses')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {

    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
