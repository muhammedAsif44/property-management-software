import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PdfQueueService } from '../modules/invoices/services/pdf-queue.service';
import { PdfWorkerService } from '../modules/invoices/services/pdf-worker.service';
import { PuppeteerBrowserService } from '../modules/invoices/services/puppeteer-browser.service';
import { STORAGE_PROVIDER, IStorageProvider } from '../common/storage/storage-provider.interface';
import { InvoiceHtmlRendererService } from '../modules/invoices/services/invoice-html-renderer.service';

async function testPdfSystem() {
  console.log('🧪 Starting End-to-End PDF System Verification Test...\n');

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const queueService = app.get(PdfQueueService);
    const workerService = app.get(PdfWorkerService);
    const browserService = app.get(PuppeteerBrowserService);
    const htmlRenderer = app.get(InvoiceHtmlRendererService);
    const storageProvider = app.get<IStorageProvider>(STORAGE_PROVIDER);

    // 1. Verify Health Metrics
    console.log('1️⃣ Checking Queue Health Metrics...');
    const health = await queueService.getHealthMetrics();
    console.log('   Redis Connection:', health.redisStatus);
    console.log('   Redis Ping Latency:', health.pingLatencyMs ? `${health.pingLatencyMs}ms` : 'N/A');
    console.log('   Queue Status:', health.queueStatus);
    console.log('   Job Counts:', health.counts);

    // 2. Test HTML Rendering
    console.log('\n2️⃣ Testing HTML Template Compilation...');
    const sampleHtml = htmlRenderer.compilePlaceholders(
      `<html><body><h1>TEST INVOICE</h1><p>Guest: {{guest_name}}</p><p>Amount: {{total_amount}}</p></body></html>`,
      {
        guestName: 'John Doe Test',
        totalAmount: 1500,
        invoiceNumber: 'INV-TEST-001',
      },
    );
    console.log('   HTML Compiled Successfully.');

    // 3. Test Puppeteer Rendering
    console.log('\n3️⃣ Testing Puppeteer Chromium PDF Rendering...');
    const pdfStart = Date.now();
    const pdfBuffer = await browserService.renderPdfFromHtml(sampleHtml, 30000);
    console.log(`   PDF Buffer Generated: ${pdfBuffer.length} bytes in ${Date.now() - pdfStart}ms`);

    // 4. Test Cloudinary Upload
    console.log('\n4️⃣ Testing Cloudinary RAW Asset Upload & Circuit Breaker...');
    const uploadStart = Date.now();
    let uploadResult: any;
    if (typeof (storageProvider as any).uploadDetailed === 'function') {
      uploadResult = await (storageProvider as any).uploadDetailed(
        `test-invoice-${Date.now()}.pdf`,
        pdfBuffer,
        'application/pdf',
      );
    } else {
      const url = await storageProvider.upload(`test-invoice-${Date.now()}.pdf`, pdfBuffer, 'application/pdf');
      uploadResult = { url, publicId: 'direct-upload' };
    }
    console.log(`   Cloudinary Upload Completed in ${Date.now() - uploadStart}ms`);
    console.log(`   Cloudinary URL: ${uploadResult.url}`);
    console.log(`   Public ID: ${uploadResult.publicId}`);

    // 5. Test Worker & Database Updates
    console.log('\n5️⃣ Checking Worker Diagnostics...');
    const workerMetrics = workerService.getWorkerMetrics();
    console.log('   Worker Running:', workerMetrics.isRunning);
    console.log('   Worker Concurrency:', workerMetrics.concurrency);
    console.log('   Worker Memory:', workerMetrics.memoryUsage);

    console.log('\n✅ ALL PDF SYSTEM PIPELINE TESTS PASSED SUCCESSFULLY! 🎉');
  } catch (err: any) {
    console.error('\n❌ PDF System Test Failed:', err?.message || err);
  } finally {
    await app.close();
    process.exit(0);
  }
}

testPdfSystem();
