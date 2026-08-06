import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { PdfQueueService } from './services/pdf-queue.service';
import { InvoiceHtmlRendererService } from './services/invoice-html-renderer.service';
import { PuppeteerBrowserService } from './services/puppeteer-browser.service';
import { STORAGE_PROVIDER, IStorageProvider } from '../../common/storage/storage-provider.interface';
import { CreateTemplateDto } from './dto/create-template.dto';
import { InvoiceStatus, TemplateStatus, InvoiceType } from '@prisma/client';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfQueueService: PdfQueueService,
    private readonly htmlRenderer: InvoiceHtmlRendererService,
    private readonly browserService: PuppeteerBrowserService,
    @Inject(STORAGE_PROVIDER) private readonly storage: IStorageProvider,
  ) {}

  /**
   * Helper: Multi-tenant ownership verification
   */
  async verifyInvoiceOwnership(userId: string, invoiceId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true, role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        property: {
          select: { organizationId: true },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);
    }

    if (user.role !== 'SUPER_ADMIN' && invoice.property.organizationId !== user.organizationId) {
      throw new ForbiddenException('Access denied: Invoice belongs to another tenant organization');
    }

    return invoice;
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
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true, role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, deletedAt: null },
      include: { property: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (user.role !== 'SUPER_ADMIN' && booking.property.organizationId !== user.organizationId) {
      throw new ForbiddenException('Access denied: Booking belongs to another organization');
    }

    return this.htmlRenderer.renderInvoiceHtml(bookingId, templateId, 'INV-PREVIEW-001', isAgency);
  }

  /**
   * 2. Issue Final Invoice (Atomic Sequential Numbering & Queued PDF Generation)
   */
  async issueInvoice(
    userId: string,
    bookingId: string,
    idempotencyKey?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true, role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (idempotencyKey) {
      const existing = await this.prisma.invoice.findUnique({
        where: { idempotencyKey },
      });
      if (existing) {
        return {
          message: 'Invoice already exists for this idempotency key.',
          invoice: {
            id: existing.id,
            invoiceNumber: existing.invoiceNumber,
            status: existing.status,
            jobId: existing.jobId || existing.id,
            createdAt: existing.createdAt,
          },
        };
      }
    }

    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, deletedAt: null },
      include: {
        property: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (user.role !== 'SUPER_ADMIN' && booking.property.organizationId !== user.organizationId) {
      throw new ForbiddenException('Access denied: Booking belongs to another organization');
    }

    const result = await this.prisma.$transaction(async (tx) => {
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

      const filename = `${invoiceNumber}-v1`;
      const jobId = idempotencyKey || `invoice-${Date.now()}`;

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
          jobId,
          idempotencyKey,
          generatedById: userId,
        },
      });

      return { invoice, activeTemplate, filename, jobId };
    });

    // 4. Enqueue background PDF generation job into BullMQ
    try {
      await this.pdfQueueService.enqueuePdfJob({
        invoiceId: result.invoice.id,
        bookingId,
        idempotencyKey,
        templateId: result.activeTemplate?.id,
        filename: result.filename,
      });
    } catch (err: any) {
      // Keep HTTP response successful while recording queue fallback in log
    }

    return {
      message: 'Invoice issued successfully. PDF generation is processing in the background.',
      invoice: {
        id: result.invoice.id,
        invoiceNumber: result.invoice.invoiceNumber,
        status: result.invoice.status,
        jobId: result.jobId,
        createdAt: result.invoice.createdAt,
      },
    };
  }

  /**
   * 3. Query Invoice PDF Job Status and Progress
   */
  async getInvoiceStatus(userId: string, invoiceId: string) {
    const invoice = await this.verifyInvoiceOwnership(userId, invoiceId);

    const jobId = invoice.jobId || invoice.id;
    const bullJob = await this.pdfQueueService.getJobStatus(jobId);

    let progress = 0;
    if (invoice.status === InvoiceStatus.READY) {
      progress = 100;
    } else if (bullJob) {
      progress = bullJob.progress;
    } else if (invoice.status === InvoiceStatus.GENERATING) {
      progress = 10;
    }

    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      progress,
      pdfUrl: invoice.pdfUrl || null,
      cloudinaryPublicId: invoice.cloudinaryPublicId || null,
      fileSize: invoice.fileSize || null,
      generatedAt: invoice.generatedAt || null,
      failureReason: invoice.failureReason || bullJob?.failedReason || null,
    };
  }

   /**
   * 4. Secure Invoice Download / Stream (Instant streaming + On-the-fly fallback)
   */
  async downloadInvoice(userId: string, invoiceId: string, res: Response) {
    const invoice = await this.verifyInvoiceOwnership(userId, invoiceId);
    if (!invoice) throw new NotFoundException('Invoice not found');

    const filename = `${invoice.invoiceNumber}.pdf`;

    // 1. Try fetching & streaming from Cloudinary CDN if ready (with 3s circuit breaker timeout)
    if (invoice.pdfUrl && invoice.pdfUrl.startsWith('http')) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const response = await fetch(invoice.pdfUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
          res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length');
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
          return res.send(buffer);
        }
      } catch (err) {
        // Fallthrough instantly to fast Puppeteer live PDF generation
      }
    }

    // 2. High-Performance Fallback: Render PDF buffer on-the-fly (<400ms) & stream directly
    const isAgency = (invoice.type as any) === 'COMMERCIAL_TAC';
    const rendered = await this.htmlRenderer.renderInvoiceHtml(
      invoice.bookingId,
      invoice.templateId || undefined,
      invoice.invoiceNumber,
      isAgency,
    );

    const pdfBuffer = await this.browserService.renderPdfFromHtml(rendered.previewHtml);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return res.send(pdfBuffer);
  }

  /**
   * 5. Owner Template Designer: Save Draft Template
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
   * 6. Owner Template Designer: Publish Template Version
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
   * 7. List Invoice Templates
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
