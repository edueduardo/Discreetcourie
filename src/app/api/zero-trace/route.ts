import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  createZeroTraceDelivery,
  encryptGPSLocation,
  generateAnonymousTrackingId,
  generateBurnerPhone,
  generateCryptoPaymentAddress,
  generateVPNRoute,
  generateAnonymousProof,
  generatePrivacyReport,
  shouldAutoDelete,
  secureDeleteDelivery,
  PrivacySettings,
} from '@/lib/zero-trace/privacy-engine'

/**
 * Zero-Trace Delivery API - Complete Privacy Mode
 * POST /api/zero-trace - Create zero-trace delivery
 * GET /api/zero-trace?id=xxx - Get delivery (encrypted)
 * DELETE /api/zero-trace?id=xxx - Secure delete
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      pickupLocation,
      deliveryLocation,
      privacySettings,
    } = body

    if (!pickupLocation || !deliveryLocation) {
      return NextResponse.json(
        { error: 'Missing required locations' },
        { status: 400 }
      )
    }

    const settings: PrivacySettings = {
      vpnEnabled: privacySettings?.vpnEnabled !== false,
      vpnRegion: privacySettings?.vpnRegion,
      cryptoPaymentOnly: privacySettings?.cryptoPaymentOnly === true,
      autoDeleteHours: privacySettings?.autoDeleteHours || 24,
      encryptGPS: privacySettings?.encryptGPS !== false,
      burnerPhoneMode: privacySettings?.burnerPhoneMode === true,
      noDigitalFootprint: privacySettings?.noDigitalFootprint === true,
      anonymousPickup: privacySettings?.anonymousPickup === true,
      anonymousDelivery: privacySettings?.anonymousDelivery === true,
    }

    // Create zero-trace delivery
    const delivery = createZeroTraceDelivery(settings)

    // Encrypt GPS locations
    const encryptionKey = process.env.GPS_ENCRYPTION_KEY || 'default-key'
    const encryptedPickup = encryptGPSLocation(
      pickupLocation.lat,
      pickupLocation.lng,
      encryptionKey
    )
    const encryptedDelivery = encryptGPSLocation(
      deliveryLocation.lat,
      deliveryLocation.lng,
      encryptionKey
    )

    // Generate VPN route
    const vpnRoute = settings.vpnEnabled ? generateVPNRoute(settings.vpnRegion) : null

    // Generate burner phone
    const burnerPhone = settings.burnerPhoneMode ? generateBurnerPhone() : null

    // Generate crypto payment address
    const cryptoPayment = settings.cryptoPaymentOnly
      ? generateCryptoPaymentAddress()
      : null

    // Generate anonymous proof
    const proof = generateAnonymousProof(delivery.id, delivery.createdAt)

    // Store in database (encrypted)
    const { data: storedDelivery, error: dbError } = await supabase
      .from('zero_trace_deliveries')
      .insert({
        id: delivery.id,
        anonymous_tracking_id: delivery.encryptedTrackingId,
        encrypted_pickup: encryptedPickup,
        encrypted_delivery: encryptedDelivery,
        vpn_route: vpnRoute,
        burner_phone: burnerPhone,
        crypto_payment: cryptoPayment,
        proof_hash: proof.proofHash,
        verification_code: proof.verificationCode,
        privacy_settings: settings,
        status: delivery.status,
        auto_delete_at: delivery.autoDeleteAt,
        created_at: delivery.createdAt,
        owner_id: user.id,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to create zero-trace delivery' },
        { status: 500 }
      )
    }

    // Generate privacy report
    const privacyReport = generatePrivacyReport(delivery)

    return NextResponse.json({
      success: true,
      delivery: {
        trackingId: delivery.encryptedTrackingId,
        status: delivery.status,
        autoDeleteAt: delivery.autoDeleteAt,
        verificationCode: proof.verificationCode,
      },
      privacy: {
        score: privacyReport.privacyScore,
        features: privacyReport.features,
        vpnRoute: vpnRoute ? {
          entryNode: vpnRoute.entryNode,
          exitNode: vpnRoute.exitNode,
        } : null,
        burnerPhone: burnerPhone?.number,
        cryptoAddress: cryptoPayment?.address,
      },
      message: `Zero-trace delivery created. Privacy score: ${privacyReport.privacyScore}/100`,
    })
  } catch (error) {
    console.error('Zero-trace creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const trackingId = searchParams.get('id')

    if (!trackingId) {
      // List all zero-trace deliveries
      const { data: deliveries, error } = await supabase
        .from('zero_trace_deliveries')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch deliveries' },
          { status: 500 }
        )
      }

      // Check for auto-delete
      const now = new Date()
      for (const delivery of deliveries || []) {
        if (shouldAutoDelete(delivery, now)) {
          await secureDeleteDelivery(delivery.id)
          await supabase
            .from('zero_trace_deliveries')
            .delete()
            .eq('id', delivery.id)
        }
      }

      return NextResponse.json({
        success: true,
        deliveries: deliveries?.filter(d => !shouldAutoDelete(d, now)) || [],
      })
    }

    // Get specific delivery
    const { data: delivery, error: dbError } = await supabase
      .from('zero_trace_deliveries')
      .select('*')
      .eq('anonymous_tracking_id', trackingId)
      .eq('owner_id', user.id)
      .single()

    if (dbError || !delivery) {
      return NextResponse.json(
        { error: 'Delivery not found or auto-deleted' },
        { status: 404 }
      )
    }

    // Check if should auto-delete
    if (shouldAutoDelete(delivery)) {
      await secureDeleteDelivery(delivery.id)
      await supabase
        .from('zero_trace_deliveries')
        .delete()
        .eq('id', delivery.id)

      return NextResponse.json(
        { error: 'Delivery has been auto-deleted for privacy' },
        { status: 410 }
      )
    }

    // Generate privacy report
    const privacyReport = generatePrivacyReport(delivery)

    return NextResponse.json({
      success: true,
      delivery: {
        trackingId: delivery.anonymous_tracking_id,
        status: delivery.status,
        createdAt: delivery.created_at,
        autoDeleteAt: delivery.auto_delete_at,
        verificationCode: delivery.verification_code,
      },
      privacy: {
        score: privacyReport.privacyScore,
        features: privacyReport.features,
        risks: privacyReport.risks,
        recommendations: privacyReport.recommendations,
      },
    })
  } catch (error) {
    console.error('Zero-trace fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const trackingId = searchParams.get('id')

    if (!trackingId) {
      return NextResponse.json(
        { error: 'Missing tracking ID' },
        { status: 400 }
      )
    }

    // Get delivery
    const { data: delivery, error: dbError } = await supabase
      .from('zero_trace_deliveries')
      .select('*')
      .eq('anonymous_tracking_id', trackingId)
      .eq('owner_id', user.id)
      .single()

    if (dbError || !delivery) {
      return NextResponse.json(
        { error: 'Delivery not found' },
        { status: 404 }
      )
    }

    // Secure delete (7-pass overwrite)
    const deleteResult = await secureDeleteDelivery(delivery.id)

    // Delete from database
    const { error: deleteError } = await supabase
      .from('zero_trace_deliveries')
      .delete()
      .eq('id', delivery.id)

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete delivery' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Delivery securely deleted with 7-pass overwrite',
      overwritePasses: deleteResult.overwritePasses,
      deletedAt: deleteResult.deletedAt,
    })
  } catch (error) {
    console.error('Zero-trace deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
