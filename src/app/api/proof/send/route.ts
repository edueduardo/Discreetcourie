import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendRichEmail, EmailTemplates } from '@/lib/email'
import { sendWhatsApp, WhatsAppTemplates } from '@/lib/whatsapp'

/**
 * Automatically send delivery proof to customer
 * Sends photo via WhatsApp + Email
 */

export async function POST(request: NextRequest) {
  try {
    const { deliveryId, photoUrl } = await request.json()

    if (!deliveryId || !photoUrl) {
      return NextResponse.json({
        error: 'Delivery ID and photo URL required'
      }, { status: 400 })
    }

    // Fetch delivery details
    const supabase = await createClient()
    const { data: delivery, error } = await supabase
      .from('deliveries')
      .select(`
        *,
        client:clients(name, email, phone)
      `)
      .eq('id', deliveryId)
      .single()

    if (error || !delivery) {
      return NextResponse.json({
        error: 'Delivery not found'
      }, { status: 404 })
    }

    const results = {
      email: { success: false, error: null as string | null },
      whatsapp: { success: false, error: null as string | null }
    }

    // Send via WhatsApp
    if (delivery.client?.phone) {
      try {
        const whatsappMessage = WhatsAppTemplates.delivered(
          delivery.tracking_code,
          photoUrl
        )

        const whatsappResult = await sendWhatsApp({
          to: delivery.client.phone,
          message: whatsappMessage,
          mediaUrl: photoUrl
        })

        results.whatsapp = {
          success: whatsappResult.success,
          error: whatsappResult.success ? null : 'Failed to send WhatsApp'
        }
      } catch (error: any) {
        results.whatsapp.error = error.message
      }
    }

    // Send via Email
    if (delivery.client?.email) {
      try {
        const emailTemplate = EmailTemplates.deliveryCompleted({
          customerName: delivery.client.name || 'Customer',
          trackingCode: delivery.tracking_code,
          deliveryTime: new Date().toLocaleString(),
          photoUrl,
          invoiceUrl: delivery.invoice_id
            ? `${process.env.NEXT_PUBLIC_APP_URL}/api/invoices/${delivery.invoice_id}/pdf`
            : undefined
        })

        const emailResult = await sendRichEmail({
          to: delivery.client.email,
          template: emailTemplate
        })

        results.email = {
          success: emailResult.success,
          error: emailResult.success ? null : emailResult.error || 'Failed to send email'
        }
      } catch (error: any) {
        results.email.error = error.message
      }
    }

    // Update delivery with proof sent timestamp
    await supabase
      .from('deliveries')
      .update({
        proof_photo_url: photoUrl,
        proof_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', deliveryId)

    return NextResponse.json({
      success: true,
      results,
      message: `Proof sent via ${results.email.success ? 'email' : ''} ${results.whatsapp.success ? 'WhatsApp' : ''}`.trim()
    })

  } catch (error: any) {
    console.error('Proof send error:', error)
    return NextResponse.json({
      error: 'Failed to send delivery proof',
      message: error.message
    }, { status: 500 })
  }
}

// GET - Check if proof has been sent for a delivery
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const deliveryId = searchParams.get('delivery_id')

    if (!deliveryId) {
      return NextResponse.json({ error: 'Delivery ID required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: delivery, error } = await supabase
      .from('deliveries')
      .select('proof_photo_url, proof_sent_at')
      .eq('id', deliveryId)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json({
      has_proof: !!delivery.proof_photo_url,
      proof_sent: !!delivery.proof_sent_at,
      proof_photo_url: delivery.proof_photo_url,
      proof_sent_at: delivery.proof_sent_at
    })

  } catch (error: any) {
    console.error('Proof check error:', error)
    return NextResponse.json({
      error: 'Failed to check proof status',
      message: error.message
    }, { status: 500 })
  }
}
