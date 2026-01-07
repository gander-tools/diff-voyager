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
  private launchPromise: Promise<Browser> | null = null;

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

    // If browser already exists, return it
    if (this.browser) {
      return this.browser;
    }

    // If a launch is in progress, wait for it
    if (this.launchPromise) {
      return this.launchPromise;
    }

    // Start a new launch
    this.launchPromise = chromium.launch({
      headless: this.config.headless,
    });

    try {
      this.browser = await this.launchPromise;
      return this.browser;
    } finally {
      this.launchPromise = null;
    }
  }

  /**
   * Close all browser instances
   */
  async close(): Promise<void> {
    this.isClosing = true;

    // Wait for any pending launch to complete
    if (this.launchPromise) {
      await this.launchPromise;
    }

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
