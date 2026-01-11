/**
 * CaptureLogger - Comprehensive diagnostic logging for page capture operations
 *
 * Provides structured logging for:
 * - Page navigation and lifecycle events
 * - Browser console messages
 * - HTTP requests and responses
 * - Performance metrics
 * - Errors and exceptions
 */

import type { Logger } from 'pino';
import type { ConsoleMessage, Page, Request, Response } from 'playwright';

export interface CaptureLoggerConfig {
  logger: Logger;
  url: string;
  pageId: string;
}

export interface ConsoleLogEntry {
  type: string;
  text: string;
  timestamp: string;
  location?: string;
}

export interface RequestLogEntry {
  method: string;
  url: string;
  resourceType: string;
  timestamp: string;
}

export interface ResponseLogEntry {
  status: number;
  url: string;
  contentType?: string;
  size?: number;
  timestamp: string;
}

export class CaptureLogger {
  private logger: Logger;
  private url: string;
  private pageId: string;
  private consoleLogs: ConsoleLogEntry[] = [];
  private requests: RequestLogEntry[] = [];
  private responses: ResponseLogEntry[] = [];
  private startTime: number;

  constructor(config: CaptureLoggerConfig) {
    this.logger = config.logger;
    this.url = config.url;
    this.pageId = config.pageId;
    this.startTime = Date.now();
  }

  /**
   * Attach all listeners to a Playwright page
   */
  attachToPage(page: Page): void {
    // Browser console messages
    page.on('console', (msg) => this.handleConsoleMessage(msg));

    // Page errors (uncaught exceptions)
    page.on('pageerror', (error) => this.handlePageError(error));

    // Request interception
    page.on('request', (request) => this.handleRequest(request));

    // Response interception
    page.on('response', (response) => this.handleResponse(response));

    // Dialog events (alerts, confirms, prompts)
    page.on('dialog', (dialog) => {
      this.logger.debug(
        { type: dialog.type(), message: dialog.message() },
        '[CAPTURE] Browser dialog appeared',
      );
    });

    this.logger.debug({ url: this.url, pageId: this.pageId }, '[CAPTURE] Logger attached to page');
  }

  /**
   * Log capture lifecycle event
   */
  logLifecycle(stage: string, data?: Record<string, unknown>): void {
    const elapsed = Date.now() - this.startTime;
    this.logger.debug(
      { stage, elapsed, url: this.url, pageId: this.pageId, ...data },
      `[CAPTURE] ${stage}`,
    );
  }

  /**
   * Log navigation start
   */
  logNavigationStart(): void {
    this.logLifecycle('Navigation started');
  }

  /**
   * Log navigation complete
   */
  logNavigationComplete(httpStatus: number, redirectCount: number): void {
    this.logLifecycle('Navigation completed', { httpStatus, redirectCount });
  }

  /**
   * Log HTML capture
   */
  logHtmlCaptured(size: number, hash: string): void {
    this.logLifecycle('HTML captured', { size, hash });
  }

  /**
   * Log screenshot capture
   */
  logScreenshotCaptured(path: string): void {
    this.logLifecycle('Screenshot captured', { path });
  }

  /**
   * Log SEO data extraction
   */
  logSeoDataExtracted(hasTitle: boolean, hasDescription: boolean, h1Count: number): void {
    this.logLifecycle('SEO data extracted', { hasTitle, hasDescription, h1Count });
  }

  /**
   * Log performance metrics
   */
  logPerformanceMetrics(loadTime: number, requestCount: number, totalSize: number): void {
    this.logLifecycle('Performance metrics captured', {
      loadTimeMs: loadTime,
      requestCount,
      totalSizeBytes: totalSize,
    });
  }

  /**
   * Log capture completion
   */
  logCaptureComplete(): void {
    const totalTime = Date.now() - this.startTime;
    this.logger.info(
      {
        url: this.url,
        pageId: this.pageId,
        totalTimeMs: totalTime,
        consoleLogCount: this.consoleLogs.length,
        requestCount: this.requests.length,
        responseCount: this.responses.length,
      },
      '[CAPTURE] Capture completed successfully',
    );
  }

  /**
   * Log capture error
   */
  logCaptureError(error: Error | unknown): void {
    const totalTime = Date.now() - this.startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    this.logger.error(
      {
        url: this.url,
        pageId: this.pageId,
        totalTimeMs: totalTime,
        error: errorMessage,
        stack: errorStack,
        consoleLogCount: this.consoleLogs.length,
        requestCount: this.requests.length,
        responseCount: this.responses.length,
      },
      '[CAPTURE] Capture failed',
    );
  }

  /**
   * Get summary of captured data
   */
  getSummary(): {
    consoleLogs: ConsoleLogEntry[];
    requests: RequestLogEntry[];
    responses: ResponseLogEntry[];
    totalTimeMs: number;
  } {
    return {
      consoleLogs: [...this.consoleLogs],
      requests: [...this.requests],
      responses: [...this.responses],
      totalTimeMs: Date.now() - this.startTime,
    };
  }

  /**
   * Handle browser console messages
   */
  private handleConsoleMessage(msg: ConsoleMessage): void {
    const entry: ConsoleLogEntry = {
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString(),
      location: msg.location().url || undefined,
    };

    this.consoleLogs.push(entry);

    // Log to our logger based on severity
    const level = this.getLogLevelForConsoleType(msg.type());
    this.logger[level]({ consoleLog: entry }, `[CAPTURE] Browser console.${msg.type()}`);
  }

  /**
   * Handle page errors (uncaught exceptions)
   */
  private handlePageError(error: Error): void {
    this.logger.error(
      {
        error: error.message,
        stack: error.stack,
        url: this.url,
      },
      '[CAPTURE] Uncaught exception in page',
    );
  }

  /**
   * Handle HTTP requests
   */
  private handleRequest(request: Request): void {
    const entry: RequestLogEntry = {
      method: request.method(),
      url: request.url(),
      resourceType: request.resourceType(),
      timestamp: new Date().toISOString(),
    };

    this.requests.push(entry);

    // Only log non-image requests at debug level to reduce noise
    if (request.resourceType() !== 'image' && request.resourceType() !== 'font') {
      this.logger.debug(
        { request: entry },
        `[CAPTURE] Request: ${request.method()} ${request.resourceType()}`,
      );
    }
  }

  /**
   * Handle HTTP responses
   */
  private async handleResponse(response: Response): Promise<void> {
    const request = response.request();
    const headers = await response.allHeaders();

    const entry: ResponseLogEntry = {
      status: response.status(),
      url: response.url(),
      contentType: headers['content-type'],
      timestamp: new Date().toISOString(),
    };

    // Try to get response size from headers
    if (headers['content-length']) {
      entry.size = Number.parseInt(headers['content-length'], 10);
    }

    this.responses.push(entry);

    // Log errors and redirects
    if (response.status() >= 400) {
      this.logger.warn(
        { response: entry, resourceType: request.resourceType() },
        `[CAPTURE] Response error: ${response.status()}`,
      );
    } else if (response.status() >= 300 && response.status() < 400) {
      this.logger.debug({ response: entry }, `[CAPTURE] Response redirect: ${response.status()}`);
    }
  }

  /**
   * Map console message type to pino log level
   */
  private getLogLevelForConsoleType(type: string): 'debug' | 'info' | 'warn' | 'error' {
    switch (type) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warn';
      case 'info':
        return 'info';
      default:
        return 'debug';
    }
  }
}
