import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isInternalLink, resolveConfig, scrape } from '../src/scraper';
import type { Config } from '../src/types';

describe('resolveConfig', () => {
  it('applies full_page=true when omitted', () => {
    expect(resolveConfig({}).full_page).toBe(true);
  });

  it('applies format=png when omitted', () => {
    expect(resolveConfig({}).format).toBe('png');
  });

  it('applies timeout_ms=30000 when omitted', () => {
    expect(resolveConfig({}).timeout_ms).toBe(30000);
  });

  it("applies wait_for='load' when omitted", () => {
    expect(resolveConfig({}).wait_for).toBe('load');
  });

  it('applies viewport 1280x800 when omitted', () => {
    expect(resolveConfig({}).viewport).toEqual({ width: 1280, height: 800 });
  });

  it('keeps explicit values instead of defaults', () => {
    const config: Config = {
      screenshot: { full_page: false, format: 'jpeg' },
      timeout_ms: 5000,
      wait_for: 'networkidle',
      viewport: { width: 800, height: 600 },
    };

    expect(resolveConfig(config)).toMatchObject({
      full_page: false,
      format: 'jpeg',
      timeout_ms: 5000,
      wait_for: 'networkidle',
      viewport: { width: 800, height: 600 },
    });
  });

  it('ignores quality for png format', () => {
    expect(resolveConfig({ format: 'png', quality: 80 }).quality).toBeUndefined();
  });
});

interface FakePage {
  on: ReturnType<typeof vi.fn>;
  goto: ReturnType<typeof vi.fn>;
  waitForSelector: ReturnType<typeof vi.fn>;
  content: ReturnType<typeof vi.fn>;
  evaluate: ReturnType<typeof vi.fn>;
  screenshot: ReturnType<typeof vi.fn>;
  locator: ReturnType<typeof vi.fn>;
  mainFrame: ReturnType<typeof vi.fn>;
}

const MAIN_FRAME = { __brand: 'main-frame' };
const OTHER_FRAME = { __brand: 'other-frame' };

interface DomExtract {
  title: string;
  lang: string;
  canonical: string;
  description: string;
  ogDescription: string;
  links: { href: string; text: string }[];
}

const DEFAULT_EXTRACT: DomExtract = {
  title: 'Example',
  lang: 'en',
  canonical: 'https://example.com/canonical',
  description: 'a description',
  ogDescription: 'og description',
  links: [],
};

function createFakePage(extract: DomExtract = DEFAULT_EXTRACT): {
  page: FakePage;
  callOrder: string[];
  responseHandlers: ((response: unknown) => void)[];
} {
  const callOrder: string[] = [];
  const responseHandlers: ((response: unknown) => void)[] = [];

  const page: FakePage = {
    on: vi.fn((event: string, handler: (arg: unknown) => void) => {
      callOrder.push(`on:${event}`);
      if (event === 'response') {
        responseHandlers.push(handler);
      }
    }),
    goto: vi.fn(async () => {
      callOrder.push('goto');
    }),
    waitForSelector: vi.fn(async () => {
      callOrder.push('waitForSelector');
    }),
    content: vi.fn(async () => '<html>rendered</html>'),
    evaluate: vi.fn(async () => extract),
    screenshot: vi.fn(async () => {}),
    locator: vi.fn(() => ({ screenshot: vi.fn(async () => {}) })),
    mainFrame: vi.fn(() => MAIN_FRAME),
  };

  return { page, callOrder, responseHandlers };
}

function createFakeResponse(
  url: string,
  body = 'raw body',
  options: { isNavigationRequest?: boolean; frame?: unknown } = {},
): {
  url: ReturnType<typeof vi.fn>;
  text: ReturnType<typeof vi.fn>;
  request: ReturnType<typeof vi.fn>;
  frame: ReturnType<typeof vi.fn>;
} {
  const { isNavigationRequest = true, frame = MAIN_FRAME } = options;
  return {
    url: vi.fn(() => url),
    text: vi.fn(async () => body),
    request: vi.fn(() => ({ isNavigationRequest: vi.fn(() => isNavigationRequest) })),
    frame: vi.fn(() => frame),
  };
}

function createFakeContext(page: FakePage): { newPage: ReturnType<typeof vi.fn>; close: ReturnType<typeof vi.fn> } {
  return {
    newPage: vi.fn(async () => page),
    close: vi.fn(async () => {}),
  };
}

function createFakeBrowser(context: ReturnType<typeof createFakeContext>): {
  newContext: ReturnType<typeof vi.fn>;
} {
  return {
    newContext: vi.fn(async () => context),
  };
}

describe('isInternalLink', () => {
  it('returns true for a same-host href', () => {
    expect(isInternalLink('/about', 'https://example.com/page')).toBe(true);
    expect(isInternalLink('https://example.com/other', 'https://example.com/page')).toBe(true);
  });

  it('returns false for a cross-host href', () => {
    expect(isInternalLink('https://other.com/page', 'https://example.com/page')).toBe(false);
  });

  it('returns false for an unparsable href', () => {
    expect(isInternalLink('http://[::1', 'https://example.com/page')).toBe(false);
  });
});

describe('scrape', () => {
  let tmpDir: string;
  let snapshotDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'voyager-scraper-'));
    snapshotDir = path.join(tmpDir, 'version-1', 'some-slug');
  });

  function baseOptions(config: Config = {}) {
    return {
      url: 'https://example.com/page',
      version: 1,
      snapshotDir,
      config,
    };
  }

  it('creates snapshot dir before navigating', async () => {
    const { page, callOrder } = createFakePage();
    const context = createFakeContext(page);
    const browser = createFakeBrowser(context);

    expect(fs.existsSync(snapshotDir)).toBe(false);

    await scrape(browser as never, baseOptions());

    expect(fs.existsSync(snapshotDir)).toBe(true);
    expect(callOrder.indexOf('goto')).toBeGreaterThan(-1);
  });

  it('registers response listener before goto', async () => {
    const { page, callOrder } = createFakePage();
    const context = createFakeContext(page);
    const browser = createFakeBrowser(context);

    await scrape(browser as never, baseOptions());

    const responseIndex = callOrder.indexOf('on:response');
    const gotoIndex = callOrder.indexOf('goto');
    expect(responseIndex).toBeGreaterThan(-1);
    expect(responseIndex).toBeLessThan(gotoIndex);
  });

  it('opens context with recordHar content=embed and archive.har path', async () => {
    const { page } = createFakePage();
    const context = createFakeContext(page);
    const browser = createFakeBrowser(context);

    await scrape(browser as never, baseOptions());

    expect(browser.newContext).toHaveBeenCalledWith(
      expect.objectContaining({
        recordHar: expect.objectContaining({
          content: 'embed',
          path: path.join(snapshotDir, 'archive.har'),
        }),
      }),
    );
  });

  it('navigates with default wait_for as waitUntil', async () => {
    const { page } = createFakePage();
    const context = createFakeContext(page);
    const browser = createFakeBrowser(context);

    await scrape(browser as never, baseOptions());

    expect(page.goto).toHaveBeenCalledWith(
      'https://example.com/page',
      expect.objectContaining({ waitUntil: 'load', timeout: 30000 }),
    );
    expect(page.waitForSelector).not.toHaveBeenCalled();
  });

  it('navigates with networkidle/domcontentloaded as waitUntil', async () => {
    const { page } = createFakePage();
    const context = createFakeContext(page);
    const browser = createFakeBrowser(context);

    await scrape(browser as never, baseOptions({ wait_for: 'networkidle' }));

    expect(page.goto).toHaveBeenCalledWith(
      'https://example.com/page',
      expect.objectContaining({ waitUntil: 'networkidle' }),
    );
  });

  it('navigates then waits for CSS selector when wait_for is a selector', async () => {
    const { page } = createFakePage();
    const context = createFakeContext(page);
    const browser = createFakeBrowser(context);

    await scrape(browser as never, baseOptions({ wait_for: '#main' }));

    expect(page.goto).toHaveBeenCalledWith(
      'https://example.com/page',
      expect.objectContaining({ timeout: 30000 }),
    );
    expect(page.goto).toHaveBeenCalledWith(
      'https://example.com/page',
      expect.not.objectContaining({ waitUntil: expect.anything() }),
    );
    expect(page.waitForSelector).toHaveBeenCalledWith('#main', { timeout: 30000 });
  });

  it('writes page.html, page.source.html and meta.json to snapshotDir', async () => {
    const { page, responseHandlers } = createFakePage();
    const context = createFakeContext(page);
    const browser = createFakeBrowser(context);
    const response = createFakeResponse('https://example.com/page', 'raw source');

    page.goto.mockImplementation(async () => {
      for (const handler of responseHandlers) {
        handler(response);
      }
    });

    await scrape(browser as never, baseOptions());

    expect(fs.readFileSync(path.join(snapshotDir, 'page.html'), 'utf-8')).toBe(
      '<html>rendered</html>',
    );
    expect(fs.readFileSync(path.join(snapshotDir, 'page.source.html'), 'utf-8')).toBe(
      'raw source',
    );
    const meta = JSON.parse(fs.readFileSync(path.join(snapshotDir, 'meta.json'), 'utf-8'));
    expect(meta.url).toBe('https://example.com/page');
    expect(meta.version).toBe(1);
  });

  it('captures page.source.html from the main-frame navigation response even after a redirect (V33)', async () => {
    const { page, responseHandlers } = createFakePage();
    const context = createFakeContext(page);
    const browser = createFakeBrowser(context);
    // response URL differs from the requested url (redirect target) but is still
    // the main-frame navigation response — must be captured despite the URL mismatch.
    const redirected = createFakeResponse('https://example.com/', 'redirected raw source');

    page.goto.mockImplementation(async () => {
      for (const handler of responseHandlers) {
        handler(redirected);
      }
    });

    await scrape(browser as never, baseOptions());

    expect(fs.readFileSync(path.join(snapshotDir, 'page.source.html'), 'utf-8')).toBe(
      'redirected raw source',
    );
  });

  it('ignores non-navigation responses (e.g. XHR) even when the URL matches (V33)', async () => {
    const { page, responseHandlers } = createFakePage();
    const context = createFakeContext(page);
    const browser = createFakeBrowser(context);
    const xhrResponse = createFakeResponse('https://example.com/page', 'xhr body', {
      isNavigationRequest: false,
    });

    page.goto.mockImplementation(async () => {
      for (const handler of responseHandlers) {
        handler(xhrResponse);
      }
    });

    await scrape(browser as never, baseOptions());

    expect(fs.readFileSync(path.join(snapshotDir, 'page.source.html'), 'utf-8')).toBe('');
  });

  it('ignores navigation responses from a non-main frame (V33)', async () => {
    const { page, responseHandlers } = createFakePage();
    const context = createFakeContext(page);
    const browser = createFakeBrowser(context);
    const iframeResponse = createFakeResponse('https://example.com/page', 'iframe body', {
      frame: OTHER_FRAME,
    });

    page.goto.mockImplementation(async () => {
      for (const handler of responseHandlers) {
        handler(iframeResponse);
      }
    });

    await scrape(browser as never, baseOptions());

    expect(fs.readFileSync(path.join(snapshotDir, 'page.source.html'), 'utf-8')).toBe('');
  });

  it('returns ScrapedPage with extracted meta fields', async () => {
    const { page } = createFakePage();
    const context = createFakeContext(page);
    const browser = createFakeBrowser(context);

    const result = await scrape(browser as never, baseOptions());

    expect(result).toMatchObject({
      url: 'https://example.com/page',
      version: 1,
      title: 'Example',
      lang: 'en',
      canonical: 'https://example.com/canonical',
      description: 'a description',
      og_description: 'og description',
    });
    expect(typeof result.scraped_at).toBe('string');
    expect(() => new Date(result.scraped_at).toISOString()).not.toThrow();
  });

  it('defaults missing meta fields to empty string', async () => {
    const { page } = createFakePage({
      title: '',
      lang: '',
      canonical: '',
      description: '',
      ogDescription: '',
      links: [],
    });
    const context = createFakeContext(page);
    const browser = createFakeBrowser(context);

    const result = await scrape(browser as never, baseOptions());

    expect(result.lang).toBe('');
    expect(result.canonical).toBe('');
    expect(result.description).toBe('');
    expect(result.og_description).toBe('');
  });

  it('marks link internal=true for same-host href', async () => {
    const { page } = createFakePage({
      ...DEFAULT_EXTRACT,
      links: [{ href: '/about', text: 'About' }],
    });
    const context = createFakeContext(page);
    const browser = createFakeBrowser(context);

    const result = await scrape(browser as never, baseOptions());

    expect(result.links).toEqual([{ href: '/about', text: 'About', internal: true }]);
  });

  it('marks link internal=false for cross-host href', async () => {
    const { page } = createFakePage({
      ...DEFAULT_EXTRACT,
      links: [{ href: 'https://other.com/x', text: 'Other' }],
    });
    const context = createFakeContext(page);
    const browser = createFakeBrowser(context);

    const result = await scrape(browser as never, baseOptions());

    expect(result.links).toEqual([{ href: 'https://other.com/x', text: 'Other', internal: false }]);
  });

  it('marks link internal=false for unparsable href, keeps raw href', async () => {
    const { page } = createFakePage({
      ...DEFAULT_EXTRACT,
      links: [{ href: 'http://[::1', text: 'Bad' }],
    });
    const context = createFakeContext(page);
    const browser = createFakeBrowser(context);

    const result = await scrape(browser as never, baseOptions());

    expect(result.links).toEqual([{ href: 'http://[::1', text: 'Bad', internal: false }]);
  });

  it('collects console error messages into js_errors', async () => {
    const { page, callOrder } = createFakePage();
    const context = createFakeContext(page);
    const browser = createFakeBrowser(context);
    let consoleHandler: ((msg: { type(): string; text(): string }) => void) | undefined;
    page.on.mockImplementation((event: string, handler: never) => {
      callOrder.push(`on:${event}`);
      if (event === 'console') {
        consoleHandler = handler as typeof consoleHandler;
      }
    });

    page.goto.mockImplementation(async () => {
      consoleHandler?.({ type: () => 'error', text: () => 'boom' });
    });

    const result = await scrape(browser as never, baseOptions());

    expect(result.js_errors).toContain('boom');
  });

  it('ignores non-error console messages', async () => {
    const { page } = createFakePage();
    const context = createFakeContext(page);
    const browser = createFakeBrowser(context);
    let consoleHandler: ((msg: { type(): string; text(): string }) => void) | undefined;
    page.on.mockImplementation((event: string, handler: never) => {
      if (event === 'console') {
        consoleHandler = handler as typeof consoleHandler;
      }
    });

    page.goto.mockImplementation(async () => {
      consoleHandler?.({ type: () => 'log', text: () => 'not an error' });
    });

    const result = await scrape(browser as never, baseOptions());

    expect(result.js_errors).not.toContain('not an error');
  });

  it('collects pageerror events into js_errors', async () => {
    const { page } = createFakePage();
    const context = createFakeContext(page);
    const browser = createFakeBrowser(context);
    let pageErrorHandler: ((err: { message: string }) => void) | undefined;
    page.on.mockImplementation((event: string, handler: never) => {
      if (event === 'pageerror') {
        pageErrorHandler = handler as typeof pageErrorHandler;
      }
    });

    page.goto.mockImplementation(async () => {
      pageErrorHandler?.({ message: 'uncaught TypeError' });
    });

    const result = await scrape(browser as never, baseOptions());

    expect(result.js_errors).toContain('uncaught TypeError');
  });

  it('takes an element screenshot when screenshot.selector is set', async () => {
    const { page } = createFakePage();
    const context = createFakeContext(page);
    const browser = createFakeBrowser(context);
    const elementScreenshot = vi.fn(async () => {});
    page.locator.mockReturnValue({ screenshot: elementScreenshot });

    await scrape(browser as never, baseOptions({ screenshot: { selector: '#hero' } }));

    expect(page.locator).toHaveBeenCalledWith('#hero');
    expect(elementScreenshot).toHaveBeenCalled();
    expect(page.screenshot).not.toHaveBeenCalled();
  });

  it('takes a full-page screenshot when screenshot.selector is not set', async () => {
    const { page } = createFakePage();
    const context = createFakeContext(page);
    const browser = createFakeBrowser(context);

    await scrape(browser as never, baseOptions());

    expect(page.screenshot).toHaveBeenCalledWith(
      expect.objectContaining({ fullPage: true, path: path.join(snapshotDir, 'screenshot.png') }),
    );
  });

  it('passes exclude selectors as the mask option', async () => {
    const { page } = createFakePage();
    const context = createFakeContext(page);
    const browser = createFakeBrowser(context);

    await scrape(browser as never, baseOptions({ screenshot: { exclude: ['.ad', '.banner'] } }));

    expect(page.screenshot).toHaveBeenCalledWith(
      expect.objectContaining({ mask: [expect.anything(), expect.anything()] }),
    );
    expect(page.locator).toHaveBeenCalledWith('.ad');
    expect(page.locator).toHaveBeenCalledWith('.banner');
  });

  it('propagates navigation errors and still closes the context', async () => {
    const { page } = createFakePage();
    const context = createFakeContext(page);
    const browser = createFakeBrowser(context);
    const error = new Error('navigation timeout');
    page.goto.mockRejectedValue(error);

    await expect(scrape(browser as never, baseOptions())).rejects.toThrow('navigation timeout');
    expect(context.close).toHaveBeenCalled();
  });
});
