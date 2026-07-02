import fs from 'node:fs';
import path from 'node:path';
import micromatch from 'micromatch';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import type { RunsRepo } from './repos/runsRepo';
import type { UrlsRepo } from './repos/urlsRepo';
import { pageSlug } from './slug';
import type { Config, ScrapedPage } from './types';

const META_DIFF_KEYS = [
  'title',
  'lang',
  'canonical',
  'description',
  'og_description',
  'js_errors',
  'links',
] as const;

function versionDir(snapshotDir: string, version: number): string {
  return path.join(snapshotDir, `version-${version}`);
}

export function resolvePageSlugs(
  v1: number,
  v2: number,
  urlOrPath: string | undefined,
  urlsRepo: UrlsRepo,
  snapshotDir: string,
): string[] {
  if (urlOrPath === undefined) {
    const dir1 = versionDir(snapshotDir, v1);
    const dir2 = versionDir(snapshotDir, v2);
    const names1 = fs.existsSync(dir1) ? fs.readdirSync(dir1) : [];
    const names2 = new Set(fs.existsSync(dir2) ? fs.readdirSync(dir2) : []);
    return names1.filter((name) => names2.has(name)).sort();
  }

  if (urlOrPath.startsWith('/')) {
    const [urlPath, queryString = ''] = urlOrPath.split('?');
    const rows = urlsRepo.findByPathAndQuery(urlPath, queryString);
    return [...new Set(rows.map((row) => row.page_slug))].sort();
  }

  const parsed = new URL(urlOrPath);
  return [pageSlug(parsed.pathname, parsed.search.replace(/^\?/, ''))];
}

function resolveDiffTolerance(
  toleranceMap: Record<string, number> | undefined,
  candidateUrls: string[],
): number {
  if (!toleranceMap) {
    return 0;
  }

  for (const [glob, tolerance] of Object.entries(toleranceMap)) {
    if (glob === '*' || candidateUrls.some((url) => micromatch.isMatch(url, glob))) {
      return tolerance;
    }
  }

  return 0;
}

function diffMeta(
  meta1: ScrapedPage,
  meta2: ScrapedPage,
): Record<string, { old: unknown; new: unknown }> {
  const diff: Record<string, { old: unknown; new: unknown }> = {};
  for (const key of META_DIFF_KEYS) {
    const a = meta1[key];
    const b = meta2[key];
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      diff[key] = { old: a, new: b };
    }
  }
  return diff;
}

export type ScreenshotDiffOutcome =
  | { kind: 'match' | 'changed'; diffPixelFraction: number }
  | { kind: 'dimension-mismatch' };

export interface PageDiffOutcome {
  page_slug: string;
  skipped?: string;
  screenshot?: ScreenshotDiffOutcome;
  meta?: Record<string, { old: unknown; new: unknown }>;
}

export function diffPageSlug(
  v1: number,
  v2: number,
  slug: string,
  snapshotDir: string,
  resultDir: string,
  config: Config,
  urlsRepo: UrlsRepo,
): PageDiffOutcome {
  const dir1 = path.join(versionDir(snapshotDir, v1), slug);
  const dir2 = path.join(versionDir(snapshotDir, v2), slug);
  const shot1 = path.join(dir1, 'screenshot.png');
  const shot2 = path.join(dir2, 'screenshot.png');
  const meta1Path = path.join(dir1, 'meta.json');
  const meta2Path = path.join(dir2, 'meta.json');

  if (
    !fs.existsSync(shot1) ||
    !fs.existsSync(shot2) ||
    !fs.existsSync(meta1Path) ||
    !fs.existsSync(meta2Path)
  ) {
    return {
      page_slug: slug,
      skipped: `missing artifacts for ${slug} in version-${v1} or version-${v2}`,
    };
  }

  const meta1 = JSON.parse(fs.readFileSync(meta1Path, 'utf-8')) as ScrapedPage;
  const meta2 = JSON.parse(fs.readFileSync(meta2Path, 'utf-8')) as ScrapedPage;
  const meta = diffMeta(meta1, meta2);

  const outDir = path.join(resultDir, `diff-v${v1}-v${v2}`, slug);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'meta.json'), JSON.stringify(meta, null, 2));

  const img1 = PNG.sync.read(fs.readFileSync(shot1));
  const img2 = PNG.sync.read(fs.readFileSync(shot2));

  if (img1.width !== img2.width || img1.height !== img2.height) {
    return { page_slug: slug, screenshot: { kind: 'dimension-mismatch' }, meta };
  }

  const { width, height } = img1;
  const output = new PNG({ width, height });
  const numDiffPixels = pixelmatch(img1.data, img2.data, output.data, width, height, {
    threshold: 0.1,
  });
  fs.writeFileSync(path.join(outDir, 'screenshot.png'), PNG.sync.write(output));

  const dbUrl = urlsRepo.list().find((row) => row.page_slug === slug)?.url;
  const tolerance = resolveDiffTolerance(
    config.screenshot?.rules?.diff?.tolerance,
    [dbUrl, meta1.url, meta2.url].filter((u): u is string => u !== undefined),
  );

  const diffPixelFraction = numDiffPixels / (width * height);
  const changed = diffPixelFraction > tolerance;

  return {
    page_slug: slug,
    screenshot: { kind: changed ? 'changed' : 'match', diffPixelFraction },
    meta,
  };
}

export function diffVersions(
  v1: number,
  v2: number,
  urlOrPath: string | undefined,
  runsRepo: RunsRepo,
  urlsRepo: UrlsRepo,
  snapshotDir: string,
  resultDir: string,
  config: Config,
): PageDiffOutcome[] {
  for (const version of [v1, v2]) {
    const run = runsRepo.findByVersion(version);
    if (run?.status === 'open') {
      throw new Error(`run ${version} is still open`);
    }
  }

  for (const version of [v1, v2]) {
    if (!fs.existsSync(versionDir(snapshotDir, version))) {
      throw new Error(`version-${version} directory not found under ${snapshotDir}`);
    }
  }

  const slugs = resolvePageSlugs(v1, v2, urlOrPath, urlsRepo, snapshotDir);
  return slugs.map((slug) => diffPageSlug(v1, v2, slug, snapshotDir, resultDir, config, urlsRepo));
}
