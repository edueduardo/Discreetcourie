# Invoice PDF Generation Setup

## Overview

The system automatically generates professional PDF invoices with company branding, client information, and itemized billing.

## Installation

Install the required PDF generation package:

```bash
npm install pdfkit
npm install --save-dev @types/pdfkit
```

## Features

### PDF Invoice includes:
- Company header with branding
- Invoice number and date
- Client billing information
- Itemized services with delivery details
- Tracking codes (if applicable)
- Subtotal and total amounts
- Payment status badge
- Notes section
- Professional footer

### Download Options:
1. **Admin Panel** - Download button in invoices table
2. **API Endpoint** - `/api/invoices/[id]/pdf`
3. **Email Attachment** - Auto-attach to invoice emails (future)

## Usage

### From Admin Panel

1. Go to `/admin/invoices`
2. Click the Download icon next to any invoice
3. PDF will download automatically

### Via API

```bash
GET /api/invoices/[invoice-id]/pdf
```

Returns PDF file with filename: `invoice-{invoice_number}.pdf`

### Example Response Headers:
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="invoice-INV-20250122-0001.pdf"
Cache-Control: no-cache
```

## PDF Layout

```
┌─────────────────────────────────────────────┐
│ DISCREET COURIER COLUMBUS          INVOICE │
│ Professional Courier Service       #INV-XX │
│ Columbus, Ohio                     Date     │
│ (614) 500-3080                     Status   │
├─────────────────────────────────────────────┤
│ BILL TO:                                    │
│ Client Name                                 │
│ Company                                     │
│ Email | Phone                               │
├─────────────────────────────────────────────┤
│ DESCRIPTION                        AMOUNT   │
├─────────────────────────────────────────────┤
│ Delivery Service                   $XX.XX  │
│   Tracking: TRACK-XXXX                      │
│   From: Address                             │
│   To: Address                               │
├─────────────────────────────────────────────┤
│ TOTAL                             $XXX.XX   │
├─────────────────────────────────────────────┤
│ NOTES:                                      │
│ Additional information here                 │
├─────────────────────────────────────────────┤
│        Thank you for your business!         │
│  For questions, contact (614) 500-3080      │
└─────────────────────────────────────────────┘
```

## Customization

Edit `/src/app/api/invoices/[id]/pdf/route.ts` to customize:

- **Company Information** - Line 45-54
- **Colors** - statusColor (line 108), header colors (line 47)
- **Fonts** - fontSize calls throughout
- **Layout** - Margins, spacing, positioning
- **Branding** - Add logo at top (replace text with image)

## Color Scheme

- **Primary Blue**: `#1e40af` - Company name
- **Gray Text**: `#6b7280` - Labels and meta
- **Black Text**: `#111827` - Important text
- **Status Colors**:
  - Paid: `#10b981` (green)
  - Overdue: `#ef4444` (red)
  - Pending: `#f59e0b` (orange)

## Troubleshooting

### PDF Not Generating
- Check if pdfkit is installed: `npm list pdfkit`
- Verify invoice exists in database
- Check browser console for errors

### Missing Invoice Data
- Ensure invoice has client relationship
- Check invoice_items table for line items
- Verify deliveries link correctly

### Download Fails
- Check network tab for API errors
- Verify user has permissions
- Check server logs for PDF generation errors

## Future Enhancements

- [ ] Auto-email PDFs to customers
- [ ] Add company logo image
- [ ] Multiple PDF templates
- [ ] PDF signing/verification
- [ ] Batch PDF generation
- [ ] PDF archiving to cloud storage

## Solo-Operator Benefits

✅ **Automated** - No manual invoice creation
✅ **Professional** - Clean, branded invoices
✅ **Fast** - Instant download
✅ **No Third-Party** - Built-in, no monthly fees
✅ **Customizable** - Easy to modify template
