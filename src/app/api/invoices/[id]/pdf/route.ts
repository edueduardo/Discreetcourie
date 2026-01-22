import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import PDFDocument from 'pdfkit'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Fetch invoice data
    const supabase = await createClient()
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(id, name, email, phone, company, address)
      `)
      .eq('id', id)
      .single()

    if (error || !invoice) {
      return NextResponse.json({
        error: 'Invoice not found'
      }, { status: 404 })
    }

    // Fetch invoice items
    const { data: items } = await supabase
      .from('invoice_items')
      .select('*, delivery:deliveries(tracking_code, pickup_address, delivery_address)')
      .eq('invoice_id', id)

    // Generate PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 })

    // Collect chunks for response
    const chunks: Buffer[] = []
    doc.on('data', (chunk) => chunks.push(chunk))

    // PDF Header - Company Info
    doc
      .fontSize(20)
      .fillColor('#1e40af')
      .text('DISCREET COURIER COLUMBUS', 50, 50)

    doc
      .fontSize(10)
      .fillColor('#6b7280')
      .text('Professional Courier Service', 50, 75)
      .text('Columbus, Ohio', 50, 88)
      .text('Phone: (614) 500-3080', 50, 101)
      .text('contact@discreetcourier.com', 50, 114)

    // Invoice Title
    doc
      .fontSize(28)
      .fillColor('#111827')
      .text('INVOICE', 400, 50, { align: 'right' })

    // Invoice Number and Date
    doc
      .fontSize(10)
      .fillColor('#6b7280')
      .text(`Invoice #: ${invoice.invoice_number}`, 400, 90, { align: 'right' })
      .text(
        `Date: ${new Date(invoice.created_at).toLocaleDateString()}`,
        400,
        103,
        { align: 'right' }
      )

    if (invoice.due_date) {
      doc.text(
        `Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`,
        400,
        116,
        { align: 'right' }
      )
    }

    // Status Badge
    const statusColor =
      invoice.status === 'paid' ? '#10b981' :
      invoice.status === 'overdue' ? '#ef4444' :
      '#f59e0b'

    doc
      .fontSize(12)
      .fillColor(statusColor)
      .text(invoice.status.toUpperCase(), 400, 135, { align: 'right' })

    // Horizontal line
    doc
      .moveTo(50, 160)
      .lineTo(545, 160)
      .strokeColor('#e5e7eb')
      .stroke()

    // Bill To Section
    doc
      .fontSize(12)
      .fillColor('#111827')
      .text('BILL TO:', 50, 180)

    doc
      .fontSize(10)
      .fillColor('#374151')
      .text(invoice.client?.name || 'Customer', 50, 200)

    if (invoice.client?.company) {
      doc.text(invoice.client.company, 50, 213)
    }

    if (invoice.client?.email) {
      doc.text(invoice.client.email, 50, 226)
    }

    if (invoice.client?.phone) {
      doc.text(invoice.client.phone, 50, 239)
    }

    if (invoice.client?.address) {
      doc.text(invoice.client.address, 50, 252)
    }

    // Items Table Header
    const tableTop = 300
    doc
      .fontSize(10)
      .fillColor('#6b7280')
      .text('DESCRIPTION', 50, tableTop)
      .text('AMOUNT', 450, tableTop, { align: 'right' })

    // Table Header Line
    doc
      .moveTo(50, tableTop + 15)
      .lineTo(545, tableTop + 15)
      .strokeColor('#e5e7eb')
      .stroke()

    // Invoice Items
    let yPosition = tableTop + 30
    const itemColor = '#374151'

    if (items && items.length > 0) {
      items.forEach((item, index) => {
        doc
          .fontSize(10)
          .fillColor(itemColor)
          .text(item.description || 'Delivery Service', 50, yPosition, { width: 380 })
          .text(`$${parseFloat(item.amount).toFixed(2)}`, 450, yPosition, { align: 'right' })

        // Delivery details if available
        if (item.delivery) {
          yPosition += 15
          doc
            .fontSize(8)
            .fillColor('#9ca3af')
            .text(
              `Tracking: ${item.delivery.tracking_code}`,
              70,
              yPosition,
              { width: 360 }
            )

          if (item.delivery.pickup_address) {
            yPosition += 12
            doc.text(
              `From: ${item.delivery.pickup_address}`,
              70,
              yPosition,
              { width: 360 }
            )
          }

          if (item.delivery.delivery_address) {
            yPosition += 12
            doc.text(
              `To: ${item.delivery.delivery_address}`,
              70,
              yPosition,
              { width: 360 }
            )
          }
        }

        yPosition += 25
      })
    } else {
      // No items - show main amount
      doc
        .fontSize(10)
        .fillColor(itemColor)
        .text('Courier Service', 50, yPosition)
        .text(`$${parseFloat(invoice.amount).toFixed(2)}`, 450, yPosition, { align: 'right' })

      yPosition += 25
    }

    // Subtotal line
    yPosition += 10
    doc
      .moveTo(350, yPosition)
      .lineTo(545, yPosition)
      .strokeColor('#e5e7eb')
      .stroke()

    // Total
    yPosition += 20
    doc
      .fontSize(12)
      .fillColor('#111827')
      .text('TOTAL', 350, yPosition)
      .text(`$${parseFloat(invoice.amount).toFixed(2)}`, 450, yPosition, { align: 'right' })

    // Total line (bold)
    yPosition += 15
    doc
      .moveTo(350, yPosition)
      .lineTo(545, yPosition)
      .strokeColor('#111827')
      .lineWidth(2)
      .stroke()

    // Notes
    if (invoice.notes) {
      yPosition += 40
      doc
        .fontSize(10)
        .fillColor('#6b7280')
        .text('NOTES:', 50, yPosition)

      yPosition += 15
      doc
        .fontSize(9)
        .fillColor('#374151')
        .text(invoice.notes, 50, yPosition, { width: 495 })
    }

    // Footer
    const footerY = 750
    doc
      .fontSize(8)
      .fillColor('#9ca3af')
      .text(
        'Thank you for your business!',
        50,
        footerY,
        { align: 'center', width: 495 }
      )
      .text(
        'For questions about this invoice, contact us at (614) 500-3080',
        50,
        footerY + 12,
        { align: 'center', width: 495 }
      )

    // Finalize PDF
    doc.end()

    // Wait for all chunks
    await new Promise<void>((resolve) => {
      doc.on('end', () => resolve())
    })

    const pdfBuffer = Buffer.concat(chunks)

    // Return PDF
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoice_number}.pdf"`,
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error: any) {
    console.error('PDF generation error:', error)
    return NextResponse.json({
      error: 'Failed to generate PDF',
      message: error.message
    }, { status: 500 })
  }
}
