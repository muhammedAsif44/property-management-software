import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { PdfWorkerService } from './services/pdf-worker.service';
import { STORAGE_PROVIDER, IStorageProvider } from '../../common/storage/storage-provider.interface';
import { CreateTemplateDto } from './dto/create-template.dto';
import { Prisma, InvoiceStatus, TemplateStatus, InvoiceType } from '@prisma/client';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfWorker: PdfWorkerService,
    @Inject(STORAGE_PROVIDER) private readonly storage: IStorageProvider,
  ) {}

  /**
   * Helper: Replace template placeholders with live booking data
   */
  private compileTemplatePlaceholders(templateHtml: string, data: any): string {
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
   * 1. Dynamic Live Invoice Preview (Never stored permanently)
   */
  async generatePreview(
    userId: string,
    bookingId: string,
    templateId?: string,
    isAgency = false,
  ) {
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
      throw new NotFoundException('Booking not found');
    }

    const totalPaid = booking.payments.reduce(
      (sum, p) => sum.plus(p.amount),
      new Prisma.Decimal(0),
    );

    // Fetch specified template or active published template
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
      <div style="font-family: Arial, sans-serif; padding: 40px; color: #1e293b;">
        <h1 style="color: #059669; font-size: 24px;">INVOICE</h1>
        <p><strong>Property:</strong> {{property_name}}</p>
        <p><strong>Guest Name:</strong> {{guest_name}}</p>
        <p><strong>Invoice Number:</strong> {{invoice_number}}</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <table style="width: 100%; text-align: left; border-collapse: collapse;">
          <tr style="background-color: #f8fafc;">
            <th style="padding: 10px;">Description</th>
            <th style="padding: 10px;">Amount</th>
          </tr>
          <tr>
            <td style="padding: 10px;">Accommodation ({{room_type}})</td>
            <td style="padding: 10px;">{{total_amount}}</td>
          </tr>
          <tr>
            <td style="padding: 10px;">Total Paid</td>
            <td style="padding: 10px;">{{total_paid}}</td>
          </tr>
          <tr style="font-weight: bold; color: #dc2626;">
            <td style="padding: 10px;">Balance Due</td>
            <td style="padding: 10px;">{{balance_due}}</td>
          </tr>
        </table>
      </div>
    `;

    const htmlContent = template?.htmlContent || defaultHtml;

    const compiledHtml = this.compileTemplatePlaceholders(htmlContent, {
      guestName: booking.guest.fullName,
      guestEmail: booking.guest.email,
      guestPhone: booking.guest.phone,
      propertyName: booking.property.name,
      propertyAddress: booking.property.address,
      invoiceNumber: 'INV-PREVIEW-001',
      bookingId: booking.id,
      roomTypeName: booking.roomType.name,
      checkInDate: new Date(booking.checkInDate).toLocaleDateString(),
      checkOutDate: new Date(booking.checkOutDate).toLocaleDateString(),
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

  /**
   * 2. Issue Final Invoice (Atomic Sequential Numbering & Queued PDF Generation)
   */
  async issueInvoice(
    userId: string,
    bookingId: string,
    idempotencyKey?: string,
  ) {
    if (idempotencyKey) {
      const existing = await this.prisma.invoice.findUnique({
        where: { idempotencyKey },
      });
      if (existing) {
        return existing;
      }
    }

    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, deletedAt: null },
      include: {
        guest: true,
        property: true,
        roomType: true,
        payments: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Increment property nextInvoiceSequence atomically
      const updatedProperty = await tx.property.update({
        where: { id: booking.propertyId },
        data: {
          nextInvoiceSequence: { increment: 1 },
        },
      });

      const year = new Date().getFullYear();
      const seqStr = String(updatedProperty.nextInvoiceSequence - 1).padStart(6, '0');
      const invoiceNumber = `INV-${year}-${seqStr}`;

      // 2. Fetch active template version
      const activeTemplate = await tx.invoiceTemplate.findFirst({
        where: {
          organizationId: booking.property.organizationId,
          status: TemplateStatus.PUBLISHED,
        },
        orderBy: { version: 'desc' },
      });

      // 3. Create Invoice record in GENERATING status
      const invoice = await tx.invoice.create({
        data: {
          bookingId,
          propertyId: booking.propertyId,
          invoiceNumber,
          invoiceVersion: 1,
          templateVersion: activeTemplate?.version || 1,
          templateId: activeTemplate?.id || null,
          type: InvoiceType.FINAL,
          status: InvoiceStatus.GENERATING,
          idempotencyKey,
          generatedById: userId,
        },
      });

      // 4. Compile HTML & queue PDF worker job asynchronously
      const previewData = await this.generatePreview(userId, bookingId, activeTemplate?.id);
      const filename = `${invoiceNumber}-v${invoice.invoiceVersion}`;

      // Trigger background PDF compilation (Non-blocking)
      this.pdfWorker.processPdfJob({
        invoiceId: invoice.id,
        htmlContent: previewData.previewHtml,
        filename,
      }).catch(() => {});

      return {
        message: 'Invoice issued successfully. PDF generation is processing in the background.',
        invoice: {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          status: invoice.status,
          createdAt: invoice.createdAt,
        },
      };
    });
  }

  /**
   * 3. Secure Invoice Download / Stream
   */
  async downloadInvoice(userId: string, invoiceId: string, res: Response) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { booking: true },
    });

    if (!invoice || !invoice.pdfUrl) {
      throw new NotFoundException('Invoice or compiled PDF not found');
    }

    // Extract storage key from URL
    const storageKey = invoice.pdfUrl.replace('/uploads/invoices/', '');
    const pdfBuffer = await this.storage.download(storageKey);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${invoice.invoiceNumber}.pdf"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(pdfBuffer);
  }

  /**
   * 4. Owner Template Designer: Save Draft Template
   */
  async saveDraftTemplate(userId: string, dto: CreateTemplateDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const template = await this.prisma.invoiceTemplate.create({
      data: {
        organizationId: user.organizationId,
        name: dto.name,
        htmlContent: dto.htmlContent,
        themeConfig: dto.themeConfig,
        status: TemplateStatus.DRAFT,
        version: 1,
      },
    });

    return {
      message: 'Invoice template draft saved',
      template,
    };
  }

  /**
   * 5. Owner Template Designer: Publish Template Version
   */
  async publishTemplate(userId: string, templateId: string) {
    const template = await this.prisma.invoiceTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) throw new NotFoundException('Template not found');

    const latestVersion = await this.prisma.invoiceTemplate.count({
      where: { organizationId: template.organizationId },
    });

    const published = await this.prisma.invoiceTemplate.update({
      where: { id: templateId },
      data: {
        status: TemplateStatus.PUBLISHED,
        version: latestVersion + 1,
        isActive: true,
      },
    });

    return {
      message: `Invoice template v${published.version} published successfully`,
      template: published,
    };
  }

  /**
   * 6. List Invoice Templates
   */
  async getTemplates(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const templates = await this.prisma.invoiceTemplate.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: 'desc' },
    });

    return { templates };
  }
}
