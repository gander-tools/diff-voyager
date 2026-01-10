/**
 * Page capturer using Playwright
 * Captures HTML, screenshots, headers, and SEO data
 */

import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { access, chmod, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { PerformanceData, SeoData } from '@gander-tools/diff-voyager-shared';
import { type Browser, chromium, type Page } from 'playwright';

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

      // Capture screenshot
      const screenshotPath = join(pageDir, 'screenshot.png');
      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
      });
      // Ensure screenshot has restricted permissions (owner only: rw-------)
      await chmod(screenshotPath, 0o600);

      // Extract SEO data
      const seoData = await this.extractSeoData(page);

      // Get performance metrics
      const performanceData = await this.getPerformanceData(page);

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

      return {
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
        harPath: undefined,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async extractSeoData(page: Page): Promise<SeoData> {
    return page.evaluate(() => {
      // Use function declarations instead of arrow functions to avoid bundler issues
      function getMetaContent(name: string) {
        const meta =
          document.querySelector(`meta[name="${name}"]`) ||
          document.querySelector(`meta[property="${name}"]`);
        return meta?.getAttribute('content') || undefined;
      }

      function getCanonical() {
        const link = document.querySelector('link[rel="canonical"]');
        return link?.getAttribute('href') || undefined;
      }

      function getHeadings(tag: string) {
        return Array.from(document.querySelectorAll(tag)).map((el) => el.textContent?.trim() || '');
      }

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

        // Calculate total size using for...of loop (avoid arrow functions in evaluate)
        let totalSize = 0;
        for (const resource of resources) {
          totalSize += (resource as PerformanceResourceTiming).transferSize || 0;
        }

        return {
          loadTimeMs: timing.loadEventEnd - timing.navigationStart,
          requestCount: resources.length,
          totalSizeBytes: totalSize,
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
