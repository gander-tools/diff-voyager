/**
 * Page capturer using Playwright
 * Captures HTML, screenshots, headers, and SEO data
 */

import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { access, chmod, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { PerformanceData, SeoData } from '@gander-tools/diff-voyager-shared';
import type { Logger } from 'pino';
import { type Browser, chromium, type Page } from 'playwright';
import { CaptureLogger } from './capture-logger.js';

export interface PageCapturerConfig {
  artifactsDir: string;
  logger?: Logger;
}

export interface CaptureInput {
  url: string;
  pageId: string;
  viewport: { width: number; height: number };
  waitAfterLoad: number;
  collectHar: boolean;
}

export interface CaptureResult {
  httpStatus: number;
  redirectChain: Array<{ url: string; status: number }>;
  htmlHash: string;
  htmlPath: string;
  headers: Record<string, string>;
  seoData: SeoData;
  performanceData?: PerformanceData;
  screenshotPath: string;
  harPath?: string;
  error?: string;
}

export class PageCapturer {
  private browser: Browser | null = null;
  private artifactsDir: string;
  private logger?: Logger;

  constructor(config: PageCapturerConfig) {
    this.artifactsDir = config.artifactsDir;
    this.logger = config.logger;
  }

  async capture(input: CaptureInput): Promise<CaptureResult> {
    // Create capture logger if we have a logger
    const captureLogger = this.logger
      ? new CaptureLogger({
          logger: this.logger,
          url: input.url,
          pageId: input.pageId,
        })
      : null;

    captureLogger?.logLifecycle('Starting page capture');

    const pageDir = join(this.artifactsDir, input.pageId);
    // Create directory with restricted permissions (owner only: rwx------)
    await mkdir(pageDir, { recursive: true, mode: 0o700 });

    if (!this.browser) {
      this.browser = await chromium.launch({ headless: true });
    }

    // Configure HAR recording if requested
    const contextOptions: Parameters<Browser['newContext']>[0] = {
      viewport: input.viewport,
    };

    let harPath: string | undefined;
    if (input.collectHar) {
      const harFilePath = join(pageDir, 'page.har');
      contextOptions.recordHar = {
        path: harFilePath,
        mode: 'minimal',
      };
      harPath = 'page.har';
    }

    const context = await this.browser.newContext(contextOptions);

    const page = await context.newPage();

    // Attach capture logger to page for automatic event logging
    if (captureLogger) {
      captureLogger.attachToPage(page);
    }

    const redirectChain: Array<{ url: string; status: number }> = [];
    let responseHeaders: Record<string, string> = {};
    let httpStatus = 0;

    // Track redirects
    page.on('response', (response) => {
      const status = response.status();
      if (status >= 300 && status < 400) {
        redirectChain.push({
          url: response.url(),
          status,
        });
      }
      // Capture final response headers
      if (response.url() === page.url() || response.url() === input.url) {
        httpStatus = status;
        responseHeaders = Object.fromEntries(
          Object.entries(response.headers()).map(([k, v]) => [k.toLowerCase(), v]),
        );
      }
    });

    try {
      // Navigate to page
      captureLogger?.logNavigationStart();

      const response = await page.goto(input.url, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      if (response) {
        httpStatus = response.status();
        responseHeaders = Object.fromEntries(
          Object.entries(response.headers()).map(([k, v]) => [k.toLowerCase(), v]),
        );
      }

      captureLogger?.logNavigationComplete(httpStatus, redirectChain.length);

      // Wait additional time if specified
      if (input.waitAfterLoad > 0) {
        await page.waitForTimeout(input.waitAfterLoad);
      }

      // Capture HTML
      const html = await page.content();
      const htmlHash = createHash('sha256').update(html).digest('hex');
      const htmlPath = join(pageDir, 'page.html');
      // Write file with restricted permissions (owner only: rw-------)
      await writeFile(htmlPath, html, { encoding: 'utf-8', mode: 0o600 });

      captureLogger?.logHtmlCaptured(html.length, htmlHash);

      // Capture screenshot
      const screenshotPath = join(pageDir, 'screenshot.png');
      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
      });
      // Ensure screenshot has restricted permissions (owner only: rw-------)
      await chmod(screenshotPath, 0o600);

      captureLogger?.logScreenshotCaptured(screenshotPath);

      // Extract SEO data
      const seoData = await this.extractSeoData(page);
      captureLogger?.logSeoDataExtracted(
        !!seoData.title,
        !!seoData.metaDescription,
        seoData.h1?.length || 0,
      );

      // Get performance metrics
      const performanceData = await this.getPerformanceData(page);
      if (performanceData) {
        captureLogger?.logPerformanceMetrics(
          performanceData.loadTimeMs,
          performanceData.requestCount,
          performanceData.totalSizeBytes,
        );
      }

      await context.close();

      // Set restricted permissions on HAR file if it was collected
      if (harPath) {
        const harFilePath = join(pageDir, 'page.har');
        try {
          await access(harFilePath, constants.F_OK);
          await chmod(harFilePath, 0o600);
        } catch {
          // HAR file doesn't exist, log warning but continue
          console.warn(`HAR file not found at ${harFilePath}`);
        }
      }

      const result = {
        httpStatus,
        redirectChain,
        htmlHash,
        htmlPath,
        headers: responseHeaders,
        seoData,
        performanceData,
        screenshotPath,
        harPath,
      };

      captureLogger?.logCaptureComplete();

      // Log summary if logger exists
      if (captureLogger) {
        const summary = captureLogger.getSummary();
        this.logger?.debug(
          {
            summary,
            consoleErrorCount: summary.consoleLogs.filter((l) => l.type === 'error').length,
            http4xxCount: summary.responses.filter((r) => r.status >= 400 && r.status < 500).length,
            http5xxCount: summary.responses.filter((r) => r.status >= 500).length,
          },
          '[CAPTURE] Summary',
        );
      }

      return result;
    } catch (error) {
      await context.close();

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      captureLogger?.logCaptureError(error);

      const errorResult = {
        httpStatus: 0,
        redirectChain: [],
        htmlHash: '',
        htmlPath: '',
        headers: {},
        seoData: {},
        screenshotPath: '',
        harPath: undefined,
        error: errorMessage,
      };

      return errorResult;
    }
  }

  private async extractSeoData(page: Page): Promise<SeoData> {
    return page.evaluate(() => {
      const getMetaContent = (name: string): string | undefined => {
        const meta =
          document.querySelector(`meta[name="${name}"]`) ||
          document.querySelector(`meta[property="${name}"]`);
        return meta?.getAttribute('content') || undefined;
      };

      const getCanonical = (): string | undefined => {
        const link = document.querySelector('link[rel="canonical"]');
        return link?.getAttribute('href') || undefined;
      };

      const getHeadings = (tag: string): string[] => {
        return Array.from(document.querySelectorAll(tag)).map((el) => el.textContent?.trim() || '');
      };

      return {
        title: document.title || undefined,
        metaDescription: getMetaContent('description'),
        canonical: getCanonical(),
        robots: getMetaContent('robots'),
        h1: getHeadings('h1'),
        h2: getHeadings('h2'),
        lang: document.documentElement.lang || undefined,
      };
    });
  }

  private async getPerformanceData(page: Page): Promise<PerformanceData | undefined> {
    try {
      const metrics = await page.evaluate(() => {
        const timing = performance.timing;
        const resources = performance.getEntriesByType('resource');

        return {
          loadTimeMs: timing.loadEventEnd - timing.navigationStart,
          requestCount: resources.length,
          totalSizeBytes: resources.reduce((acc, r) => {
            const resource = r as PerformanceResourceTiming;
            return acc + (resource.transferSize || 0);
          }, 0),
        };
      });

      return metrics;
    } catch {
      return undefined;
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
