/**
 * Single page processor
 * Orchestrates page capture, SEO extraction, artifact storage, and snapshot creation
 */

import { randomUUID } from 'node:crypto';
import type { PageRepository } from '../storage/repositories/page-repository.js';
import type { SnapshotRepository } from '../storage/repositories/snapshot-repository.js';
import type { BrowserManager } from './browser-manager.js';
import type { PageCapturer } from './page-capturer.js';
import type { ProcessPageInput, ProcessPageResult } from './types.js';

export interface SinglePageProcessorConfig {
  browserManager: BrowserManager;
  pageCapturer: PageCapturer;
  pageRepository: PageRepository;
  snapshotRepository: SnapshotRepository;
  artifactsDir: string;
}

export class SinglePageProcessor {
  private browserManager: BrowserManager;
  private pageCapturer: PageCapturer;
  private pageRepository: PageRepository;
  private snapshotRepository: SnapshotRepository;
  private artifactsDir: string;

  constructor(config: SinglePageProcessorConfig) {
    this.browserManager = config.browserManager;
    this.pageCapturer = config.pageCapturer;
    this.pageRepository = config.pageRepository;
    this.snapshotRepository = config.snapshotRepository;
    this.artifactsDir = config.artifactsDir;
  }

  /**
   * Process a single page: capture, extract SEO, and store artifacts
   */
  async processPage(input: ProcessPageInput): Promise<ProcessPageResult> {
    try {
      // Normalize URL (basic normalization)
      const normalizedUrl = this.normalizeUrl(input.url);

      // Find or create page
      const page = await this.pageRepository.findOrCreate({
        projectId: input.projectId,
        normalizedUrl,
        originalUrl: input.url,
      });

      // Generate page ID for artifacts
      const pageId = page.id;

      // Capture page with Playwright
      const captureResult = await this.pageCapturer.capture({
        url: input.url,
        pageId,
        viewport: input.viewport || { width: 1920, height: 1080 },
        waitAfterLoad: input.waitAfterLoad || 0,
        collectHar: input.collectHar || false,
      });

      // Check for capture errors
      if (captureResult.error) {
        return {
          pageId,
          snapshotId: '',
          success: false,
          error: captureResult.error,
        };
      }

      // Create snapshot in database
      const snapshot = await this.snapshotRepository.create({
        id: randomUUID(),
        pageId,
        runId: input.runId,
        isBaseline: input.isBaseline,
        capturedAt: new Date(),
        httpStatus: captureResult.httpStatus,
        redirectChain: captureResult.redirectChain,
        htmlHash: captureResult.htmlHash,
        headers: captureResult.headers,
        seo: captureResult.seoData,
        performanceData: captureResult.performanceData,
        hasScreenshot: !!captureResult.screenshotPath,
        hasHar: !!captureResult.harPath,
        hasDiff: false,
      });

      return {
        pageId,
        snapshotId: snapshot.id,
        success: true,
      };
    } catch (error) {
      // Handle any unexpected errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      return {
        pageId: '',
        snapshotId: '',
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Basic URL normalization
   * More advanced normalization should use UrlNormalizer from domain layer
   */
  private normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url);

      // Remove trailing slash
      let path = parsed.pathname;
      if (path.endsWith('/') && path.length > 1) {
        path = path.slice(0, -1);
      }

      // Build normalized URL
      return `${parsed.protocol}//${parsed.host}${path}${parsed.search}`;
    } catch {
      return url;
    }
  }
}
