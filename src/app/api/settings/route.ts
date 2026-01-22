import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch all settings or specific setting by key
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)

  const key = searchParams.get('key')
  const category = searchParams.get('category')
  const publicOnly = searchParams.get('public') === 'true'

  try {
    let query = supabase
      .from('settings')
      .select('*')
      .order('category', { ascending: true })
      .order('key', { ascending: true })

    if (key) {
      query = query.eq('key', key)
      const { data, error } = await query.single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }

      return NextResponse.json({ setting: data })
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (publicOnly) {
      query = query.eq('is_public', true)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Group settings by category
    const settingsByCategory: Record<string, any[]> = {}
    for (const setting of data || []) {
      if (!settingsByCategory[setting.category]) {
        settingsByCategory[setting.category] = []
      }
      settingsByCategory[setting.category].push(setting)
    }

    return NextResponse.json({
      settings: data,
      byCategory: settingsByCategory,
      total: data?.length || 0
    })

  } catch (error: any) {
    console.error('Settings fetch error:', error)
    return NextResponse.json({
      error: 'Failed to fetch settings',
      message: error.message
    }, { status: 500 })
  }
}

// PUT - Update a setting
export async function PUT(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()

  const { key, value, description, category, is_public } = body

  if (!key) {
    return NextResponse.json({ error: 'Setting key is required' }, { status: 400 })
  }

  try {
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (value !== undefined) updateData.value = value
    if (description !== undefined) updateData.description = description
    if (category !== undefined) updateData.category = category
    if (is_public !== undefined) updateData.is_public = is_public

    const { data, error } = await supabase
      .from('settings')
      .update(updateData)
      .eq('key', key)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      setting: data,
      message: `Setting '${key}' updated successfully`
    })

  } catch (error: any) {
    console.error('Settings update error:', error)
    return NextResponse.json({
      error: 'Failed to update setting',
      message: error.message
    }, { status: 500 })
  }
}

// POST - Create a new setting
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()

  const { key, value, description, category = 'general', is_public = false } = body

  if (!key || value === undefined) {
    return NextResponse.json({
      error: 'Key and value are required'
    }, { status: 400 })
  }

  try {
    const { data, error } = await supabase
      .from('settings')
      .insert({
        key,
        value,
        description,
        category,
        is_public
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({
          error: `Setting with key '${key}' already exists. Use PUT to update.`
        }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      setting: data,
      message: `Setting '${key}' created successfully`
    }, { status: 201 })

  } catch (error: any) {
    console.error('Settings creation error:', error)
    return NextResponse.json({
      error: 'Failed to create setting',
      message: error.message
    }, { status: 500 })
  }
}

// DELETE - Delete a setting
export async function DELETE(request: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)

  const key = searchParams.get('key')

  if (!key) {
    return NextResponse.json({ error: 'Setting key is required' }, { status: 400 })
  }

  try {
    const { error } = await supabase
      .from('settings')
      .delete()
      .eq('key', key)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Setting '${key}' deleted successfully`
    })

  } catch (error: any) {
    console.error('Settings deletion error:', error)
    return NextResponse.json({
      error: 'Failed to delete setting',
      message: error.message
    }, { status: 500 })
  }
}
