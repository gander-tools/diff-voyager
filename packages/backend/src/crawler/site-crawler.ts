/**
 * Site crawler using Crawlee
 * Discovers and crawls multiple pages within a domain
 */

import { CheerioCrawler } from 'crawlee';
import type { SinglePageProcessor } from './single-page-processor.js';
import type {
  CrawlProgress,
  CrawlResult,
  ProcessPageInput,
  ProcessPageResult,
  SiteCrawlerConfig,
} from './types.js';

export class SiteCrawler {
  private config: SiteCrawlerConfig;
  private pageProcessor: SinglePageProcessor;
  private progress: CrawlProgress = {
    discoveredUrls: 0,
    processedUrls: 0,
    failedUrls: 0,
  };

  constructor(config: SiteCrawlerConfig, pageProcessor: SinglePageProcessor) {
    this.config = {
      maxPages: config.maxPages ?? 100,
      concurrency: config.concurrency ?? 1,
      includePatterns: config.includePatterns ?? [],
      excludePatterns: config.excludePatterns ?? [],
      stayInDomain: config.stayInDomain ?? true,
      followSubdomains: config.followSubdomains ?? false,
      ...config,
    };
    this.pageProcessor = pageProcessor;
  }

  /**
   * Crawl a site starting from the base URL
   */
  async crawl(
    projectId: string,
    runId: string,
    isBaseline: boolean,
    viewport?: { width: number; height: number },
    waitAfterLoad?: number,
    collectHar?: boolean,
    onProgress?: (progress: CrawlProgress) => void,
  ): Promise<CrawlResult> {
    const processedUrls: string[] = [];
    const failedUrls: Array<{ url: string; error: string }> = [];

    // Reset progress
    this.progress = {
      discoveredUrls: 0,
      processedUrls: 0,
      failedUrls: 0,
    };

    // Extract base domain for filtering
    const baseDomain = this.extractDomain(this.config.baseUrl);

    const crawler = new CheerioCrawler({
      maxRequestsPerCrawl: this.config.maxPages,
      maxConcurrency: this.config.concurrency,

      requestHandler: async ({ request, enqueueLinks }) => {
        const url = request.url;

        try {
          // Process the page
          const input: ProcessPageInput = {
            url,
            projectId,
            runId,
            isBaseline,
            viewport,
            waitAfterLoad,
            collectHar,
          };

          const result: ProcessPageResult = await this.pageProcessor.processPage(input);

          if (result.success) {
            processedUrls.push(url);
            this.progress.processedUrls++;
            this.progress.currentUrl = url;
          } else {
            failedUrls.push({ url, error: result.error || 'Unknown error' });
            this.progress.failedUrls++;
          }

          // Report progress
          if (onProgress) {
            onProgress({ ...this.progress });
          }

          // Enqueue links if not at max pages
          if (this.progress.processedUrls < (this.config.maxPages || 100)) {
            await enqueueLinks({
              strategy: 'same-domain',
              transformRequestFunction: (req) => {
                // Apply filtering logic
                if (!this.shouldCrawlUrl(req.url, baseDomain)) {
                  return false;
                }

                this.progress.discoveredUrls++;
                return req;
              },
            });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          failedUrls.push({ url, error: errorMessage });
          this.progress.failedUrls++;

          if (onProgress) {
            onProgress({ ...this.progress });
          }
        }
      },

      failedRequestHandler: async ({ request }, error) => {
        const errorMessage = error instanceof Error ? error.message : 'Request failed';
        failedUrls.push({ url: request.url, error: errorMessage });
        this.progress.failedUrls++;

        if (onProgress) {
          onProgress({ ...this.progress });
        }
      },
    });

    // Start crawling
    await crawler.run([this.config.baseUrl]);

    return {
      totalPages: this.progress.processedUrls + this.progress.failedUrls,
      successfulPages: this.progress.processedUrls,
      failedPages: this.progress.failedUrls,
      processedUrls,
      failedUrls,
    };
  }

  /**
   * Check if a URL should be crawled based on configuration
   */
  private shouldCrawlUrl(url: string, baseDomain: string): boolean {
    try {
      // Validate URL format
      new URL(url);

      // Check if in same domain
      if (this.config.stayInDomain) {
        const urlDomain = this.extractDomain(url);

        if (this.config.followSubdomains) {
          // Allow subdomains
          if (!urlDomain.endsWith(baseDomain)) {
            return false;
          }
        } else {
          // Exact domain match
          if (urlDomain !== baseDomain) {
            return false;
          }
        }
      }

      // Check exclude patterns
      if (this.config.excludePatterns) {
        for (const pattern of this.config.excludePatterns) {
          if (this.matchesPattern(url, pattern)) {
            return false;
          }
        }
      }

      // Check include patterns (if specified, URL must match at least one)
      if (this.config.includePatterns && this.config.includePatterns.length > 0) {
        let matches = false;
        for (const pattern of this.config.includePatterns) {
          if (this.matchesPattern(url, pattern)) {
            matches = true;
            break;
          }
        }
        if (!matches) {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.hostname;
    } catch {
      return '';
    }
  }

  /**
   * Check if URL matches a pattern (simple glob-like matching)
   */
  private matchesPattern(url: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
      .replace(/\*/g, '.*'); // Convert * to .*

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(url);
  }
}
