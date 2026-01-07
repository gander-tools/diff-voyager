/**
 * Scan processor for synchronous scan execution
 * ASAP scenario: blocks until complete
 */

import {
  type PageResponse,
  PageStatus,
  type ProjectDetailsResponse,
  RunStatus,
} from '@gander-tools/diff-voyager-shared';
import type { Database } from 'better-sqlite3';
import { CheerioCrawler } from 'crawlee';
import { PageCapturer } from '../crawler/page-capturer.js';
import * as UrlNormalizer from '../domain/url-normalizer.js';
import type { PageRepository } from '../storage/repositories/page-repository.js';
import type { ProjectRepository } from '../storage/repositories/project-repository.js';
import type { RunRepository } from '../storage/repositories/run-repository.js';
import type { SnapshotRepository } from '../storage/repositories/snapshot-repository.js';

export interface ScanProcessorConfig {
  db: Database;
  artifactsDir: string;
  projectRepo: ProjectRepository;
  runRepo: RunRepository;
  pageRepo: PageRepository;
  snapshotRepo: SnapshotRepository;
}

export interface ProcessScanInput {
  projectId: string;
  runId: string;
  url: string;
  crawl: boolean;
  viewport: { width: number; height: number };
  waitAfterLoad: number;
  collectHar: boolean;
}

export class ScanProcessor {
  private capturer: PageCapturer;

  constructor(private config: ScanProcessorConfig) {
    this.capturer = new PageCapturer({
      artifactsDir: config.artifactsDir,
    });
  }

  async processScan(input: ProcessScanInput): Promise<ProjectDetailsResponse> {
    const { projectRepo, runRepo, pageRepo, snapshotRepo } = this.config;

    // Update project and run status
    await projectRepo.updateStatus(input.projectId, RunStatus.IN_PROGRESS);
    await runRepo.updateStatus(input.runId, RunStatus.IN_PROGRESS);

    try {
      // For single page (no crawl) - capture one page
      const urls = input.crawl ? await this.discoverUrls(input.url) : [input.url];

      const pagesResponse: PageResponse[] = [];

      for (const url of urls) {
        const normalizedUrl = UrlNormalizer.normalize(url);

        // Create or find page
        const page = await pageRepo.findOrCreate({
          projectId: input.projectId,
          normalizedUrl,
          originalUrl: url,
        });

        // Create snapshot
        const snapshot = await snapshotRepo.create({
          pageId: page.id,
          runId: input.runId,
        });

        // Capture page
        const captureResult = await this.capturer.capture({
          url,
          pageId: page.id,
          viewport: input.viewport,
          waitAfterLoad: input.waitAfterLoad,
          collectHar: input.collectHar,
        });

        // Update snapshot with capture results
        await snapshotRepo.update(snapshot.id, {
          status: captureResult.error ? PageStatus.ERROR : PageStatus.COMPLETED,
          httpStatus: captureResult.httpStatus,
          redirectChain: captureResult.redirectChain,
          htmlHash: captureResult.htmlHash,
          htmlPath: captureResult.htmlPath,
          headers: captureResult.headers,
          seoData: captureResult.seoData,
          performanceData: captureResult.performanceData,
          screenshotPath: captureResult.screenshotPath,
          harPath: captureResult.harPath,
          capturedAt: new Date(),
          errorMessage: captureResult.error,
        });

        pagesResponse.push({
          id: page.id,
          url: normalizedUrl,
          originalUrl: url,
          status: captureResult.error ? PageStatus.ERROR : PageStatus.COMPLETED,
          httpStatus: captureResult.httpStatus,
          capturedAt: new Date().toISOString(),
          seoData: captureResult.seoData,
          httpHeaders: captureResult.headers,
          performanceData: captureResult.performanceData,
          artifacts: {
            screenshotUrl: captureResult.screenshotPath
              ? `/api/v1/artifacts/${page.id}/screenshot`
              : undefined,
            harUrl: captureResult.harPath ? `/api/v1/artifacts/${page.id}/har` : undefined,
            htmlUrl: captureResult.htmlPath ? `/api/v1/artifacts/${page.id}/html` : undefined,
          },
          diff: null,
        });
      }

      // Update run statistics and status
      const statistics = {
        totalPages: pagesResponse.length,
        completedPages: pagesResponse.filter((p) => p.status === PageStatus.COMPLETED).length,
        errorPages: pagesResponse.filter((p) => p.status === PageStatus.ERROR).length,
        changedPages: 0,
        unchangedPages: pagesResponse.filter((p) => p.status === PageStatus.COMPLETED).length,
      };

      await runRepo.updateStatistics(input.runId, statistics);
      await runRepo.updateStatus(input.runId, RunStatus.COMPLETED);
      await projectRepo.updateStatus(input.projectId, RunStatus.COMPLETED);

      // Fetch updated project
      const project = await projectRepo.findById(input.projectId);
      if (!project) {
        throw new Error('Project not found after processing');
      }

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        baseUrl: project.baseUrl,
        config: {
          crawl: project.config.crawl,
          viewport: project.config.viewport,
          visualDiffThreshold: project.config.visualDiffThreshold,
          maxPages: project.config.maxPages,
        },
        status: project.status,
        createdAt: project.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: project.updatedAt?.toISOString() || new Date().toISOString(),
        statistics: {
          ...statistics,
          totalDifferences: 0,
          criticalDifferences: 0,
          acceptedDifferences: 0,
          mutedDifferences: 0,
        },
        pages: pagesResponse,
        pagination: {
          totalPages: pagesResponse.length,
          limit: 100,
          offset: 0,
          hasMore: false,
        },
      };
    } catch (error) {
      // Mark as failed on error
      await projectRepo.updateStatus(input.projectId, RunStatus.INTERRUPTED);
      await runRepo.updateStatus(input.runId, RunStatus.INTERRUPTED);
      throw error;
    } finally {
      await this.capturer.close();
    }
  }

  /**
   * Discover URLs using Crawlee
   * Crawls the site starting from base URL and returns all discovered URLs
   */
  private async discoverUrls(baseUrl: string): Promise<string[]> {
    const discoveredUrls: Set<string> = new Set();
    discoveredUrls.add(baseUrl); // Always include the base URL

    // Use default max pages limit
    const maxPages = 100;

    const crawler = new CheerioCrawler({
      maxRequestsPerCrawl: maxPages,
      maxConcurrency: 2, // Limit concurrency for discovery

      requestHandler: async ({ request, enqueueLinks }) => {
        // Add this URL to discovered set
        discoveredUrls.add(request.url);

        // Enqueue links for discovery (same-domain only)
        await enqueueLinks({
          strategy: 'same-domain',
        });
      },

      // Silently handle failed requests during discovery
      failedRequestHandler: async () => {
        // Discovery failures are non-critical
      },
    });

    // Run crawler for discovery
    await crawler.run([baseUrl]);

    return Array.from(discoveredUrls);
  }
}
