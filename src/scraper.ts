import fs from 'node:fs';
import path from 'node:path';
import type { Browser, Response } from 'playwright';
import type { Config, Link, ScrapedPage } from './types';

type ResolvedConfig = {
  full_page: boolean;
  format: 'png' | 'jpeg';
  timeout_ms: number;
  wait_for: string;
  viewport: { width: number; height: number };
  quality?: number;
  selector?: string;
  exclude: string[];
  user_agent?: string;
};

const NAV_WAIT_UNTIL = new Set(['load', 'networkidle', 'domcontentloaded']);

export function resolveConfig(config: Config): ResolvedConfig {
  const format = config.screenshot?.format ?? 'png';

  return {
    full_page: config.screenshot?.full_page ?? true,
    format,
    timeout_ms: config.timeout_ms ?? 30000,
    wait_for: config.wait_for ?? 'load',
    viewport: config.viewport ?? { width: 1280, height: 800 },
    quality: format === 'jpeg' ? config.screenshot?.quality : undefined,
    selector: config.screenshot?.selector,
    exclude: config.screenshot?.exclude ?? [],
    user_agent: config.user_agent,
  };
}

export function isInternalLink(href: string, baseUrl: string): boolean {
  try {
    return new URL(href, baseUrl).hostname === new URL(baseUrl).hostname;
  } catch {
    return false;
  }
}

interface DomExtract {
  title: string;
  lang: string;
  canonical: string;
  description: string;
  ogDescription: string;
  links: { href: string; text: string }[];
}

export interface ScrapeOptions {
  url: string;
  version: number;
  snapshotDir: string;
  config: Config;
}

export async function scrape(browser: Browser, options: ScrapeOptions): Promise<ScrapedPage> {
  const { url, version, snapshotDir } = options;
  const resolved = resolveConfig(options.config);

  fs.mkdirSync(snapshotDir, { recursive: true });

  const context = await browser.newContext({
    viewport: resolved.viewport,
    userAgent: resolved.user_agent,
    recordHar: { path: path.join(snapshotDir, 'archive.har'), content: 'embed' },
  });

  try {
    const page = await context.newPage();

    const jsErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      jsErrors.push(err.message);
    });

    let navigationResponse: Response | undefined;
    page.on('response', (response) => {
      if (!navigationResponse && response.url() === url) {
        navigationResponse = response;
      }
    });

    if (NAV_WAIT_UNTIL.has(resolved.wait_for)) {
      await page.goto(url, {
        waitUntil: resolved.wait_for as 'load' | 'networkidle' | 'domcontentloaded',
        timeout: resolved.timeout_ms,
      });
    } else {
      await page.goto(url, { timeout: resolved.timeout_ms });
      await page.waitForSelector(resolved.wait_for, { timeout: resolved.timeout_ms });
    }

    const extract = (await page.evaluate(
      (): DomExtract => ({
        title: document.title ?? '',
        lang: document.documentElement.getAttribute('lang') ?? '',
        canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '',
        description:
          document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
        ogDescription:
          document.querySelector('meta[property="og:description"]')?.getAttribute('content') ?? '',
        links: Array.from(document.querySelectorAll('a[href]')).map((a) => ({
          href: a.getAttribute('href') ?? '',
          text: a.textContent?.trim() ?? '',
        })),
      }),
    )) as DomExtract;

    const links: Link[] = extract.links.map((link) => ({
      href: link.href,
      text: link.text,
      internal: isInternalLink(link.href, url),
    }));

    const maskLocators = resolved.exclude.map((selector) => page.locator(selector));
    const screenshotOptions = {
      type: resolved.format,
      quality: resolved.quality,
      mask: maskLocators.length > 0 ? maskLocators : undefined,
    };

    if (resolved.selector) {
      await page.locator(resolved.selector).screenshot({
        ...screenshotOptions,
        path: path.join(snapshotDir, `screenshot.${resolved.format}`),
      });
    } else {
      await page.screenshot({
        ...screenshotOptions,
        fullPage: resolved.full_page,
        path: path.join(snapshotDir, `screenshot.${resolved.format}`),
      });
    }

    const renderedHtml = await page.content();
    const rawHtml = navigationResponse ? await navigationResponse.text() : '';

    fs.writeFileSync(path.join(snapshotDir, 'page.html'), renderedHtml);
    fs.writeFileSync(path.join(snapshotDir, 'page.source.html'), rawHtml);

    const scrapedPage: ScrapedPage = {
      url,
      version,
      scraped_at: new Date().toISOString(),
      title: extract.title,
      lang: extract.lang,
      canonical: extract.canonical,
      description: extract.description,
      og_description: extract.ogDescription,
      links,
      js_errors: jsErrors,
    };

    fs.writeFileSync(path.join(snapshotDir, 'meta.json'), JSON.stringify(scrapedPage, null, 2));

    return scrapedPage;
  } finally {
    await context.close();
  }
}
