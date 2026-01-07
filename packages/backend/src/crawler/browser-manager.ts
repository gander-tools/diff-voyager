/**
 * Browser manager for reusing browser instances
 * Manages a pool of browsers to improve performance
 */

import { type Browser, chromium } from 'playwright';
import type { BrowserManagerConfig } from './types.js';

export class BrowserManager {
  private config: BrowserManagerConfig;
  private browser: Browser | null = null;
  private isClosing = false;

  constructor(config: BrowserManagerConfig = {}) {
    this.config = {
      headless: config.headless ?? true,
      maxBrowsers: config.maxBrowsers ?? 1,
    };
  }

  /**
   * Get or create a browser instance
   */
  async getBrowser(): Promise<Browser> {
    if (this.isClosing) {
      throw new Error('BrowserManager is closing, cannot get browser');
    }

    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: this.config.headless,
      });
    }

    return this.browser;
  }

  /**
   * Close all browser instances
   */
  async close(): Promise<void> {
    this.isClosing = true;

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }

    this.isClosing = false;
  }

  /**
   * Check if browser manager has active browsers
   */
  isActive(): boolean {
    return this.browser !== null;
  }
}
