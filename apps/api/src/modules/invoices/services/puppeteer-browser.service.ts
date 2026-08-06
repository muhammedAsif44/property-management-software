import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import puppeteer, { Browser, Page } from 'puppeteer';

@Injectable()
export class PuppeteerBrowserService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PuppeteerBrowserService.name);
  private browser: Browser | null = null;
  private processedJobCount = 0;
  private browserRestartCount = 0;
  private isInitializing = false;
  private readonly MAX_JOBS_BEFORE_RECYCLE = 50;
  private readonly HEAP_THRESHOLD_BYTES = 150 * 1024 * 1024; // 150 MB

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const shouldWarmUp = this.configService.get<boolean>('PUPPETEER_WARMUP') || false;
    if (shouldWarmUp) {
      this.logger.log('PUPPETEER_WARMUP is enabled. Pre-warming Chromium browser instance on boot...');
      try {
        await this.getBrowserInstance();
        this.logger.log('Chromium browser successfully pre-warmed.');
      } catch (err: any) {
        this.logger.error('Failed to pre-warm Chromium browser:', err?.stack);
      }
    }
  }

  async onModuleDestroy() {
    await this.closeBrowser();
  }

  /**
   * Return active shared browser instance, launching or recycling as required
   */
  public async getBrowserInstance(): Promise<Browser> {
    if (this.shouldRecycleBrowser()) {
      this.logger.log('Browser recycling triggered due to job count, memory limit, or process disconnection.');
      await this.recycleBrowser();
    }

    if (this.browser && this.browser.connected) {
      return this.browser;
    }

    if (this.isInitializing) {
      await new Promise((res) => setTimeout(res, 300));
      return this.getBrowserInstance();
    }

    this.isInitializing = true;
    try {
      const executablePath = this.configService.get<string>('PUPPETEER_EXECUTABLE_PATH');

      this.logger.log('Launching fresh headless Chromium browser instance...');
      this.browser = await puppeteer.launch({
        headless: true,
        executablePath,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-zygote',
          '--disable-background-networking',
          '--disable-background-timer-throttling',
          '--disable-renderer-backgrounding',
        ],
      });

      this.processedJobCount = 0;
      this.browser.on('disconnected', () => {
        this.logger.warn('Chromium browser process disconnected unexpectedly.');
        this.browser = null;
      });

      return this.browser;
    } finally {
      this.isInitializing = false;
    }
  }

  public async recycleBrowser(): Promise<void> {
    this.browserRestartCount++;
    await this.closeBrowser();
  }

  public isMemoryCritical(criticalRatio = 0.75): boolean {
    const memory = process.memoryUsage();
    // In Node.js environment on Render Free (512MB RAM limit), heapTotal or heapUsed > 180MB triggers critical
    const isHeapExceeded = memory.heapUsed > this.HEAP_THRESHOLD_BYTES;
    const isRssCritical = memory.rss > 400 * 1024 * 1024; // 400MB RSS limit
    return isHeapExceeded || isRssCritical;
  }

  private shouldRecycleBrowser(): boolean {
    if (!this.browser || !this.browser.connected) return false;
    if (this.processedJobCount >= this.MAX_JOBS_BEFORE_RECYCLE) return true;
    return this.isMemoryCritical();
  }

  private async closeBrowser(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close();
      } catch (err: any) {
        this.logger.warn(`Error while closing browser instance: ${err?.message}`);
      } finally {
        this.browser = null;
      }
    }
  }

  /**
   * Render HTML content to PDF Buffer using page-level isolation and strict 120s timeout
   */
  async renderPdfFromHtml(htmlContent: string, timeoutMs = 15000): Promise<Buffer> {
    const startTime = Date.now();
    const browser = await this.getBrowserInstance();
    let page: Page | null = null;

    try {
      page = await browser.newPage();
      page.setDefaultNavigationTimeout(timeoutMs);
      page.setDefaultTimeout(timeoutMs);

      await page.setContent(htmlContent, {
        waitUntil: 'domcontentloaded',
        timeout: timeoutMs,
      });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
        timeout: timeoutMs,
      });

      this.processedJobCount++;
      const duration = Date.now() - startTime;
      this.logger.log(`PDF rendered successfully in ${duration}ms (Total jobs rendered on current browser: ${this.processedJobCount})`);

      return Buffer.from(pdfBuffer);
    } catch (err: any) {
      this.logger.error(`Failed to render PDF from HTML (Timeout: ${timeoutMs}ms):`, err?.stack);
      throw err;
    } finally {
      if (page) {
        try {
          await page.close();
        } catch (pageErr: any) {
          this.logger.warn(`Error closing Puppeteer page: ${pageErr?.message}`);
        }
      }
    }
  }

  public getBrowserMetrics() {
    let status = 'closed';
    if (this.browser && this.browser.connected) {
      status = 'healthy';
    } else if (this.isInitializing) {
      status = 'recycling';
    }

    return {
      status,
      restartCount: this.browserRestartCount,
      processedJobCount: this.processedJobCount,
      isMemoryCritical: this.isMemoryCritical(),
    };
  }
}
