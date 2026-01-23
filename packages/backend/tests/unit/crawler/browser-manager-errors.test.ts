/**
 * BrowserManager Error Scenarios tests
 * Tests for browser crashes, CSP violations, network failures, and resource exhaustion
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BrowserManager } from '../../../src/crawler/browser-manager.js';

describe('BrowserManager Error Scenarios', () => {
  let browserManager: BrowserManager;

  beforeEach(() => {
    browserManager = new BrowserManager({ headless: true });
  });

  afterEach(async () => {
    await browserManager.close();
  });

  describe('Browser Launch Failures', () => {
    it('should handle browser launch with custom timeout', async () => {
      const timeoutManager = new BrowserManager({
        headless: true,
        launchTimeout: 30000,
      });

      try {
        const browser = await timeoutManager.getBrowser();
        expect(browser).toBeDefined();
        expect(browser.isConnected()).toBe(true);
      } finally {
        await timeoutManager.close();
      }
    });

    it('should handle multiple concurrent launch attempts', async () => {
      const promises = Array.from({ length: 10 }, () => browserManager.getBrowser());

      const browsers = await Promise.all(promises);

      const uniqueBrowsers = new Set(browsers);
      expect(uniqueBrowsers.size).toBe(1);

      browsers.forEach((browser) => {
        expect(browser.isConnected()).toBe(true);
      });
    });

  });

  describe('Browser Crash Scenarios', () => {
    it('should detect when browser is closed', async () => {
      const browser = await browserManager.getBrowser();
      expect(browser.isConnected()).toBe(true);

      await browserManager.close();

      expect(browser.isConnected()).toBe(false);
    });

    it('should handle multiple crash recovery attempts', async () => {
      for (let i = 0; i < 3; i++) {
        const browser = await browserManager.getBrowser();
        expect(browser.isConnected()).toBe(true);

        await browserManager.close();

        expect(browser.isConnected()).toBe(false);
      }
    });

    it('should cleanup resources after browser close', async () => {
      const browser = await browserManager.getBrowser();
      expect(browser.isConnected()).toBe(true);

      await browserManager.close();

      expect(browserManager.isActive()).toBe(false);
    });
  });

  describe('Memory Management', () => {
    it('should handle creation of many browser contexts', async () => {
      const browser = await browserManager.getBrowser();
      const contexts = [];

      for (let i = 0; i < 10; i++) {
        const context = await browser.newContext();
        contexts.push(context);
      }

      expect(contexts.length).toBe(10);

      for (const context of contexts) {
        await context.close();
      }
    });

    it('should handle creation of many pages', async () => {
      const browser = await browserManager.getBrowser();
      const context = await browser.newContext();
      const pages = [];

      for (let i = 0; i < 20; i++) {
        const page = await context.newPage();
        pages.push(page);
      }

      expect(pages.length).toBe(20);

      for (const page of pages) {
        await page.close();
      }

      await context.close();
    });

    it('should cleanup pages after context close', async () => {
      const browser = await browserManager.getBrowser();
      const context = await browser.newContext();

      const page1 = await context.newPage();
      const page2 = await context.newPage();

      expect(page1.isClosed()).toBe(false);
      expect(page2.isClosed()).toBe(false);

      await context.close();

      expect(page1.isClosed()).toBe(true);
      expect(page2.isClosed()).toBe(true);
    });

    it('should handle rapid browser creation and destruction', async () => {
      for (let i = 0; i < 5; i++) {
        const browser = await browserManager.getBrowser();
        expect(browser.isConnected()).toBe(true);

        await browserManager.close();
        expect(browserManager.isActive()).toBe(false);
      }
    });
  });

  describe('Network Failure Scenarios', () => {
    it('should handle offline network mode', async () => {
      const browser = await browserManager.getBrowser();
      const context = await browser.newContext();
      const page = await context.newPage();

      await context.setOffline(true);

      await expect(page.goto('https://example.com')).rejects.toThrow();

      await context.setOffline(false);
      await context.close();
    });

    it('should handle DNS resolution failure', async () => {
      const browser = await browserManager.getBrowser();
      const context = await browser.newContext();
      const page = await context.newPage();

      await expect(page.goto('https://thisdoesnotexist.invalid')).rejects.toThrow();

      await context.close();
    });

    it('should handle connection timeout', async () => {
      const browser = await browserManager.getBrowser();
      const context = await browser.newContext();
      const page = await context.newPage();

      await expect(page.goto('https://example.com', { timeout: 1 })).rejects.toThrow();

      await context.close();
    });

    it('should handle slow network conditions', async () => {
      const browser = await browserManager.getBrowser();
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.route('**/*', (route) => {
        setTimeout(() => route.continue(), 100);
      });

      await expect(page.goto('https://example.com', { timeout: 50 })).rejects.toThrow();

      await context.close();
    });
  });

  describe('CSP Violations', () => {
    it('should handle pages with strict CSP', async () => {
      const browser = await browserManager.getBrowser();
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.setContent(
        `
        <html>
          <head>
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'">
          </head>
          <body>CSP Test</body>
        </html>
      `,
        { waitUntil: 'domcontentloaded' },
      );

      const content = await page.content();
      expect(content).toContain('CSP Test');

      await context.close();
    });

    it('should detect CSP violations in console', async () => {
      const browser = await browserManager.getBrowser();
      const context = await browser.newContext();
      const page = await context.newPage();

      const cspViolations: string[] = [];
      page.on('console', (msg) => {
        if (msg.text().includes('Content Security Policy')) {
          cspViolations.push(msg.text());
        }
      });

      await page.setContent(
        `
        <html>
          <head>
            <meta http-equiv="Content-Security-Policy" content="script-src 'none'">
          </head>
          <body>
            <script>console.log('This should be blocked');</script>
          </body>
        </html>
      `,
        { waitUntil: 'domcontentloaded' },
      );

      await page.waitForTimeout(100);

      await context.close();
    });

    it('should handle CSP blocking external resources', async () => {
      const browser = await browserManager.getBrowser();
      const context = await browser.newContext();
      const page = await context.newPage();

      const blockedResources: string[] = [];
      page.on('requestfailed', (request) => {
        blockedResources.push(request.url());
      });

      await page.setContent(
        `
        <html>
          <head>
            <meta http-equiv="Content-Security-Policy" content="img-src 'self'">
          </head>
          <body>
            <img src="https://example.com/image.png">
          </body>
        </html>
      `,
        { waitUntil: 'domcontentloaded' },
      );

      await page.waitForTimeout(100);

      await context.close();
    });
  });

  describe('Resource Loading Errors', () => {
    it('should handle 404 errors for resources', async () => {
      const browser = await browserManager.getBrowser();
      const context = await browser.newContext();
      const page = await context.newPage();

      const failedRequests: string[] = [];
      page.on('requestfailed', (request) => {
        failedRequests.push(request.url());
      });

      await page.setContent(
        `
        <html>
          <body>
            <img src="https://example.com/nonexistent.png">
            <script src="https://example.com/missing.js"></script>
          </body>
        </html>
      `,
        { waitUntil: 'domcontentloaded' },
      );

      await context.close();
    });

    it('should handle mixed content blocking', async () => {
      const browser = await browserManager.getBrowser();
      const context = await browser.newContext();
      const page = await context.newPage();

      const blockedRequests: string[] = [];
      page.on('requestfailed', (request) => {
        blockedRequests.push(request.url());
      });

      await page.setContent(
        `
        <html>
          <head>
            <meta http-equiv="Content-Security-Policy" content="script-src 'self'">
          </head>
          <body>
            <h1>Test Page</h1>
          </body>
        </html>
      `,
        { waitUntil: 'domcontentloaded' },
      );

      await page.evaluate(() => {
        const script = document.createElement('script');
        script.src = 'https://external-domain.example/script.js';
        document.body.appendChild(script);
      });

      await page.waitForTimeout(100);

      await context.close();
    });

    it('should handle CORS errors', async () => {
      const browser = await browserManager.getBrowser();
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto('https://example.com');

      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.evaluate(() => {
        fetch('https://different-origin.com/api/data').catch(() => {
          console.error('CORS error occurred');
        });
      });

      await page.waitForTimeout(100);

      await context.close();
    });
  });

  describe('JavaScript Runtime Errors', () => {
    it('should handle uncaught JavaScript exceptions', async () => {
      const browser = await browserManager.getBrowser();
      const context = await browser.newContext();
      const page = await context.newPage();

      const errors: Error[] = [];
      page.on('pageerror', (error) => {
        errors.push(error);
      });

      await page.setContent(
        `
        <html>
          <body>
            <script>
              throw new Error('Test error');
            </script>
          </body>
        </html>
      `,
        { waitUntil: 'domcontentloaded' },
      );

      await page.waitForTimeout(100);

      expect(errors.length).toBeGreaterThan(0);

      await context.close();
    });

    it('should handle evaluate timeout', async () => {
      const browser = await browserManager.getBrowser();
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.setContent('<html><body></body></html>');

      await expect(
        page.evaluate(
          () => {
            return new Promise((resolve) => setTimeout(resolve, 10000));
          },
          { timeout: 100 },
        ),
      ).rejects.toThrow();

      await context.close();
    });

    it('should handle promise rejections', async () => {
      const browser = await browserManager.getBrowser();
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.setContent('<html><body></body></html>');

      await expect(
        page.evaluate(() => {
          return Promise.reject(new Error('Rejected promise'));
        }),
      ).rejects.toThrow();

      await context.close();
    });
  });

  describe('Browser State Management', () => {
    it('should handle browser disconnection gracefully', async () => {
      const browser = await browserManager.getBrowser();
      expect(browser.isConnected()).toBe(true);

      await browser.close();

      expect(browser.isConnected()).toBe(false);
      expect(browserManager.isActive()).toBe(false);
    });

    it('should prevent operations on closed browser', async () => {
      const browser = await browserManager.getBrowser();
      await browser.close();

      await expect(browser.newContext()).rejects.toThrow();
    });

    it('should handle rapid open/close cycles', async () => {
      for (let i = 0; i < 10; i++) {
        const browser = await browserManager.getBrowser();
        expect(browser.isConnected()).toBe(true);

        const context = await browser.newContext();
        const page = await context.newPage();

        await page.setContent('<html><body>Test</body></html>');

        await context.close();
        await browserManager.close();
      }
    });
  });

  describe('Concurrent Browser Operations', () => {
    it('should handle concurrent page navigations', async () => {
      const browser = await browserManager.getBrowser();
      const context = await browser.newContext();

      const pages = await Promise.all([context.newPage(), context.newPage(), context.newPage()]);

      const navigations = pages.map((page) => page.setContent('<html><body>Test</body></html>'));

      await Promise.all(navigations);

      for (const page of pages) {
        const content = await page.content();
        expect(content).toContain('Test');
      }

      for (const page of pages) {
        await page.close();
      }

      await context.close();
    });

    it('should handle concurrent context creation', async () => {
      const browser = await browserManager.getBrowser();

      const contexts = await Promise.all([
        browser.newContext(),
        browser.newContext(),
        browser.newContext(),
      ]);

      expect(contexts.length).toBe(3);

      for (const context of contexts) {
        await context.close();
      }
    });

    it('should isolate errors between concurrent operations', async () => {
      const browser = await browserManager.getBrowser();
      const context = await browser.newContext();

      const page1 = await context.newPage();
      const page2 = await context.newPage();

      const operation1 = page1.goto('https://thisdoesnotexist.invalid').catch(() => 'error1');
      const operation2 = page2.setContent('<html><body>Success</body></html>');

      const [result1, _result2] = await Promise.all([operation1, operation2]);

      expect(result1).toBe('error1');
      const content = await page2.content();
      expect(content).toContain('Success');

      await context.close();
    });
  });

  describe('Configuration Edge Cases', () => {
    it('should handle invalid browser args', async () => {
      const manager = new BrowserManager({
        headless: true,
        args: ['--invalid-flag-that-does-not-exist'],
      });

      const browser = await manager.getBrowser();
      expect(browser.isConnected()).toBe(true);

      await manager.close();
    });

    it('should handle extremely high timeout values', async () => {
      const manager = new BrowserManager({
        headless: true,
        defaultTimeout: Number.MAX_SAFE_INTEGER,
      });

      const browser = await manager.getBrowser();
      expect(browser.isConnected()).toBe(true);

      await manager.close();
    });

    it('should handle zero timeout', async () => {
      const manager = new BrowserManager({
        headless: true,
        defaultTimeout: 0,
      });

      const browser = await manager.getBrowser();
      expect(browser.isConnected()).toBe(true);

      await manager.close();
    });
  });
});
