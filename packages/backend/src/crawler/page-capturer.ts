/**
 * Page capturer using Playwright
 * Captures HTML, screenshots, headers, and SEO data
 */

import { chromium, type Browser, type Page } from 'playwright';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { SeoData, PerformanceData } from '@gander-tools/diff-voyager-shared';

export interface PageCapturerConfig {
  artifactsDir: string;
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

  constructor(config: PageCapturerConfig) {
    this.artifactsDir = config.artifactsDir;
  }

  async capture(input: CaptureInput): Promise<CaptureResult> {
    const pageDir = join(this.artifactsDir, input.pageId);
    await mkdir(pageDir, { recursive: true });

    if (!this.browser) {
      this.browser = await chromium.launch({ headless: true });
    }

    const context = await this.browser.newContext({
      viewport: input.viewport,
    });

    const page = await context.newPage();

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
          Object.entries(response.headers()).map(([k, v]) => [k.toLowerCase(), v])
        );
      }
    });

    try {
      // Navigate to page
      const response = await page.goto(input.url, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      if (response) {
        httpStatus = response.status();
        responseHeaders = Object.fromEntries(
          Object.entries(response.headers()).map(([k, v]) => [k.toLowerCase(), v])
        );
      }

      // Wait additional time if specified
      if (input.waitAfterLoad > 0) {
        await page.waitForTimeout(input.waitAfterLoad);
      }

      // Capture HTML
      const html = await page.content();
      const htmlHash = createHash('sha256').update(html).digest('hex');
      const htmlPath = join(pageDir, 'page.html');
      await writeFile(htmlPath, html, 'utf-8');

      // Capture screenshot
      const screenshotPath = join(pageDir, 'screenshot.png');
      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
      });

      // Extract SEO data
      const seoData = await this.extractSeoData(page);

      // Get performance metrics
      const performanceData = await this.getPerformanceData(page);

      await context.close();

      return {
        httpStatus,
        redirectChain,
        htmlHash,
        htmlPath,
        headers: responseHeaders,
        seoData,
        performanceData,
        screenshotPath,
      };
    } catch (error) {
      await context.close();
      return {
        httpStatus: 0,
        redirectChain: [],
        htmlHash: '',
        htmlPath: '',
        headers: {},
        seoData: {},
        screenshotPath: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
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
        return Array.from(document.querySelectorAll(tag)).map((el) =>
          el.textContent?.trim() || ''
        );
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
