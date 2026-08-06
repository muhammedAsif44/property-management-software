import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Prisma, TemplateStatus } from '@prisma/client';

export interface CompiledInvoiceResult {
  previewHtml: string;
  bookingId: string;
  isAgency: boolean;
}

@Injectable()
export class InvoiceHtmlRendererService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Replace template placeholders with booking data
   */
  public compilePlaceholders(templateHtml: string, data: any): string {
    let compiled = templateHtml;
    const replacements: Record<string, string> = {
      '{{guest_name}}': data.guestName || 'Valued Guest',
      '{{guest_email}}': data.guestEmail || '',
      '{{guest_phone}}': data.guestPhone || '',
      '{{property_name}}': data.propertyName || 'Orvyn PMS',
      '{{property_address}}': data.propertyAddress || '',
      '{{invoice_number}}': data.invoiceNumber || 'INV-PREVIEW',
      '{{booking_id}}': data.bookingId || '',
      '{{room_type}}': data.roomTypeName || '',
      '{{check_in_date}}': data.checkInDate || '',
      '{{check_out_date}}': data.checkOutDate || '',
      '{{total_amount}}': `₹${data.totalAmount?.toFixed(2) || '0.00'}`,
      '{{total_paid}}': `₹${data.totalPaid?.toFixed(2) || '0.00'}`,
      '{{balance_due}}': `₹${data.balanceDue?.toFixed(2) || '0.00'}`,
      '{{agency_name}}': data.agencyName || 'N/A',
      '{{created_at}}': new Date().toLocaleDateString('en-IN'),
    };

    for (const [key, val] of Object.entries(replacements)) {
      compiled = compiled.replaceAll(key, val);
    }

    return compiled;
  }

  /**
   * Generate compiled HTML for a booking and optional template ID
   */
  async renderInvoiceHtml(
    bookingId: string,
    templateId?: string,
    invoiceNumberOverride?: string,
    isAgency = false,
  ): Promise<CompiledInvoiceResult> {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, deletedAt: null },
      include: {
        guest: true,
        property: true,
        roomType: true,
        agency: true,
        payments: true,
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking not found for ID: ${bookingId}`);
    }

    const totalPaid = booking.payments.reduce(
      (sum, p) => sum.plus(p.amount),
      new Prisma.Decimal(0),
    );

    let template = templateId
      ? await this.prisma.invoiceTemplate.findUnique({ where: { id: templateId } })
      : await this.prisma.invoiceTemplate.findFirst({
          where: {
            organizationId: booking.property.organizationId,
            status: TemplateStatus.PUBLISHED,
          },
          orderBy: { version: 'desc' },
        });

    const defaultHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Invoice</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #1e293b; margin: 0; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #059669; padding-bottom: 15px; }
          .header h1 { color: #059669; margin: 0; font-size: 28px; }
          .details { margin: 25px 0; line-height: 1.6; }
          .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .table th { background-color: #f8fafc; text-align: left; padding: 12px; border-bottom: 1px solid #e2e8f0; }
          .table td { padding: 12px; border-bottom: 1px solid #f1f5f9; }
          .total-row { font-weight: bold; color: #059669; }
          .due-row { font-weight: bold; color: #dc2626; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>INVOICE</h1>
          <span>{{invoice_number}}</span>
        </div>
        <div class="details">
          <p><strong>Property:</strong> {{property_name}} ({{property_address}})</p>
          <p><strong>Guest:</strong> {{guest_name}} | <strong>Email:</strong> {{guest_email}} | <strong>Phone:</strong> {{guest_phone}}</p>
          <p><strong>Stay Period:</strong> {{check_in_date}} to {{check_out_date}} ({{room_type}})</p>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Accommodation Services ({{room_type}})</td>
              <td>{{total_amount}}</td>
            </tr>
            <tr>
              <td>Total Paid</td>
              <td>{{total_paid}}</td>
            </tr>
            <tr class="due-row">
              <td>Balance Due</td>
              <td>{{balance_due}}</td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;

    const htmlContent = template?.htmlContent || defaultHtml;

    const compiledHtml = this.compilePlaceholders(htmlContent, {
      guestName: booking.guest.fullName,
      guestEmail: booking.guest.email,
      guestPhone: booking.guest.phone,
      propertyName: booking.property.name,
      propertyAddress: booking.property.address,
      invoiceNumber: invoiceNumberOverride || 'INV-PREVIEW-001',
      bookingId: booking.id,
      roomTypeName: booking.roomType.name,
      checkInDate: new Date(booking.checkInDate).toLocaleDateString('en-IN'),
      checkOutDate: new Date(booking.checkOutDate).toLocaleDateString('en-IN'),
      totalAmount: booking.totalAmount.toNumber(),
      totalPaid: totalPaid.toNumber(),
      balanceDue: booking.totalAmount.minus(totalPaid).toNumber(),
      agencyName: booking.agency?.name,
    });

    return {
      previewHtml: compiledHtml,
      bookingId: booking.id,
      isAgency,
    };
  }
}
