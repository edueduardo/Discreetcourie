import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch all invoices or specific invoice
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)

  const invoiceId = searchParams.get('id')
  const clientId = searchParams.get('client_id')
  const status = searchParams.get('status')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    // Fetch specific invoice by ID
    if (invoiceId) {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients(id, name, email, phone, company)
        `)
        .eq('id', invoiceId)
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }

      // Fetch invoice items
      const { data: items } = await supabase
        .from('invoice_items')
        .select('*, delivery:deliveries(id, tracking_code, pickup_address, delivery_address)')
        .eq('invoice_id', invoiceId)

      return NextResponse.json({
        invoice: {
          ...data,
          items: items || []
        }
      })
    }

    // Build query
    let query = supabase
      .from('invoices')
      .select(`
        *,
        client:clients(id, name, email, phone, company)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate summary stats
    const { data: stats } = await supabase
      .from('invoices')
      .select('amount, status')

    const summary = {
      total: count || 0,
      totalAmount: stats?.reduce((sum, inv) => sum + (parseFloat(inv.amount as any) || 0), 0) || 0,
      pending: stats?.filter(inv => inv.status === 'pending').length || 0,
      paid: stats?.filter(inv => inv.status === 'paid').length || 0,
      overdue: stats?.filter(inv => inv.status === 'overdue').length || 0,
      paidAmount: stats
        ?.filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + (parseFloat(inv.amount as any) || 0), 0) || 0,
      pendingAmount: stats
        ?.filter(inv => inv.status === 'pending')
        .reduce((sum, inv) => sum + (parseFloat(inv.amount as any) || 0), 0) || 0
    }

    return NextResponse.json({
      invoices: data,
      summary,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })

  } catch (error: any) {
    console.error('Invoices fetch error:', error)
    return NextResponse.json({
      error: 'Failed to fetch invoices',
      message: error.message
    }, { status: 500 })
  }
}

// POST - Create a new invoice
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()

  const {
    client_id,
    amount,
    status = 'pending',
    due_date,
    notes,
    items = []
  } = body

  if (!client_id || !amount) {
    return NextResponse.json({
      error: 'client_id and amount are required'
    }, { status: 400 })
  }

  try {
    // Generate invoice number (format: INV-YYYYMMDD-XXXX)
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')

    // Get count of invoices today to generate sequential number
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(now.setHours(0, 0, 0, 0)).toISOString())

    const invoiceNumber = `INV-${dateStr}-${String((count || 0) + 1).padStart(4, '0')}`

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        client_id,
        invoice_number: invoiceNumber,
        amount,
        status,
        due_date,
        notes
      })
      .select()
      .single()

    if (invoiceError) {
      return NextResponse.json({ error: invoiceError.message }, { status: 500 })
    }

    // Create invoice items if provided
    if (items.length > 0) {
      const itemsToInsert = items.map((item: any) => ({
        invoice_id: invoice.id,
        delivery_id: item.delivery_id || null,
        description: item.description,
        amount: item.amount
      }))

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert)

      if (itemsError) {
        console.error('Failed to create invoice items:', itemsError)
      }
    }

    return NextResponse.json({
      success: true,
      invoice,
      message: `Invoice ${invoiceNumber} created successfully`
    }, { status: 201 })

  } catch (error: any) {
    console.error('Invoice creation error:', error)
    return NextResponse.json({
      error: 'Failed to create invoice',
      message: error.message
    }, { status: 500 })
  }
}

// PUT - Update an invoice
export async function PUT(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()

  const { id, status, paid_at, notes, amount } = body

  if (!id) {
    return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })
  }

  try {
    const updateData: any = {}

    if (status !== undefined) updateData.status = status
    if (paid_at !== undefined) updateData.paid_at = paid_at
    if (notes !== undefined) updateData.notes = notes
    if (amount !== undefined) updateData.amount = amount

    // Auto-set paid_at when status changes to paid
    if (status === 'paid' && !paid_at) {
      updateData.paid_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        client:clients(id, name, email, phone)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      invoice: data,
      message: 'Invoice updated successfully'
    })

  } catch (error: any) {
    console.error('Invoice update error:', error)
    return NextResponse.json({
      error: 'Failed to update invoice',
      message: error.message
    }, { status: 500 })
  }
}

// DELETE - Delete an invoice
export async function DELETE(request: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)

  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })
  }

  try {
    // Invoice items will be cascade deleted due to ON DELETE CASCADE

    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Invoice deleted successfully'
    })

  } catch (error: any) {
    console.error('Invoice deletion error:', error)
    return NextResponse.json({
      error: 'Failed to delete invoice',
      message: error.message
    }, { status: 500 })
  }
}
