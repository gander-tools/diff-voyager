import crypto from 'node:crypto';
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
] as const;

function versionDir(snapshotDir: string, version: number): string {
  return path.join(snapshotDir, `version-${version}`);
}

type ClassifiedBucket = 'matched' | 'changed';
type FileType = 'screenshot' | 'meta';

const TYPE_EXT: Record<FileType, string> = { screenshot: 'png', meta: 'json' };

const TYPE_README: Record<`${ClassifiedBucket}/${FileType}`, string> = {
  'matched/screenshot': `# matched/screenshot

Diff-image screenshot.png for pages whose pixel-diff was within tolerance.

File: <slug>___<hash>.png.
`,
  'matched/meta': `# matched/meta

Merged meta.json for pages whose meta.json classification keys were
unchanged between the two versions. Unchanged keys are plain values.

File: <slug>___<hash>.json.
`,
  'changed/screenshot': `# changed/screenshot

Diff-image screenshot.png for pages whose pixel-diff exceeded tolerance, or
whose screenshots had mismatched dimensions.

File: <slug>___<hash>.png. Absent when dimensions mismatched between versions
(no valid pixel diff to render).
`,
  'changed/meta': `# changed/meta

Merged meta.json for pages whose meta.json classification key differed
between the two versions. Changed keys are wrapped as
{"reason":"diff","versions":{"<v1>":...,"<v2>":...}}.

File: <slug>___<hash>.json.
`,
};

const SKIPPED_README = `# skipped

skip.json-shaped file ({"reason": "<why this page was skipped>"}) for pages
whose artifacts (screenshot.png/meta.json) were missing in one of the two
compared versions, so no diff could be computed. Page-level: any missing
artifact skips the whole page, not just one file type.

File: <slug>___<hash>.json.
`;

function diffBaseDir(resultDir: string, v1: number, v2: number): string {
  return path.join(resultDir, `v${v1}-v${v2}`);
}

function typeDir(base: string, bucket: ClassifiedBucket, type: FileType): string {
  return path.join(base, bucket, type);
}

function fileName(slug: string, hash: string, ext: string): string {
  return `${slug}___${hash}.${ext}`;
}

function writeTypeReadme(base: string, bucket: ClassifiedBucket, type: FileType): void {
  const dir = typeDir(base, bucket, type);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'README.md'), TYPE_README[`${bucket}/${type}`]);
}

function writeSkippedReadme(base: string): void {
  const dir = path.join(base, 'skipped');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'README.md'), SKIPPED_README);
}

// V67: stale-removal per type, independent — reclassifying screenshot ⊥ touches meta's bucket, vice versa.
function removeStaleTypeEntry(
  base: string,
  currentBucket: ClassifiedBucket,
  type: FileType,
  slug: string,
  hash: string,
): void {
  const otherBucket: ClassifiedBucket = currentBucket === 'matched' ? 'changed' : 'matched';
  const file = path.join(typeDir(base, otherBucket, type), fileName(slug, hash, TYPE_EXT[type]));
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
  }
}

function removeStaleSkippedEntry(base: string, slug: string, hash: string): void {
  const file = path.join(base, 'skipped', fileName(slug, hash, 'json'));
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
  }
}

// V62 hash source is urls.url (DB); slug fallback covers pages with no matching urls row.
export function computePageHash(dbUrl: string | undefined, slug: string): string {
  return crypto
    .createHash('md5')
    .update(dbUrl ?? slug)
    .digest('hex');
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
    return 100;
  }

  const matches = Object.entries(toleranceMap)
    .filter(([glob]) => glob === '*' || candidateUrls.some((url) => micromatch.isMatch(url, glob)))
    .map(([, tolerance]) => tolerance);

  return matches.length > 0 ? Math.max(...matches) : 100;
}

function diffMeta(
  v1: number,
  v2: number,
  meta1: ScrapedPage,
  meta2: ScrapedPage,
): { merged: Record<string, unknown>; changed: boolean } {
  const merged: Record<string, unknown> = {};
  let changed = false;
  for (const key of META_DIFF_KEYS) {
    const a = meta1[key];
    const b = meta2[key];
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      merged[key] = { reason: 'diff', versions: { [v1]: a, [v2]: b } };
      changed = true;
    } else {
      merged[key] = a;
    }
  }
  merged.url = { versions: { [v1]: meta1.url, [v2]: meta2.url } };
  return { merged, changed };
}

export type ScreenshotDiffOutcome =
  | { kind: 'match' | 'changed'; diffPixelFraction: number }
  | { kind: 'dimension-mismatch' };

export interface PageDiffOutcome {
  page_slug: string;
  skipped?: string;
  screenshot?: ScreenshotDiffOutcome;
  meta?: Record<string, unknown>;
  metaChanged?: boolean;
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

  const base = diffBaseDir(resultDir, v1, v2);
  const dbUrl = urlsRepo.list().find((row) => row.page_slug === slug)?.url;
  const hash = computePageHash(dbUrl, slug);

  if (
    !fs.existsSync(shot1) ||
    !fs.existsSync(shot2) ||
    !fs.existsSync(meta1Path) ||
    !fs.existsSync(meta2Path)
  ) {
    const reason = `missing artifacts for ${slug} in version-${v1} or version-${v2}`;
    for (const bucket of ['matched', 'changed'] as ClassifiedBucket[]) {
      for (const type of ['screenshot', 'meta'] as FileType[]) {
        const file = path.join(typeDir(base, bucket, type), fileName(slug, hash, TYPE_EXT[type]));
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      }
    }
    const dir = path.join(base, 'skipped');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, fileName(slug, hash, 'json')),
      JSON.stringify({ reason }, null, 2),
    );
    writeSkippedReadme(base);
    return { page_slug: slug, skipped: reason };
  }

  const meta1 = JSON.parse(fs.readFileSync(meta1Path, 'utf-8')) as ScrapedPage;
  const meta2 = JSON.parse(fs.readFileSync(meta2Path, 'utf-8')) as ScrapedPage;
  const { merged: meta, changed: metaChanged } = diffMeta(v1, v2, meta1, meta2);

  const img1 = PNG.sync.read(fs.readFileSync(shot1));
  const img2 = PNG.sync.read(fs.readFileSync(shot2));

  let screenshot: ScreenshotDiffOutcome;
  let diffPng: Buffer | undefined;

  if (img1.width !== img2.width || img1.height !== img2.height) {
    screenshot = { kind: 'dimension-mismatch' };
  } else {
    const { width, height } = img1;
    const output = new PNG({ width, height });
    const numDiffPixels = pixelmatch(img1.data, img2.data, output.data, width, height, {
      threshold: 0.1,
    });

    const tolerance = resolveDiffTolerance(
      config.screenshot?.rules?.diff?.tolerance,
      [dbUrl, meta1.url, meta2.url].filter((u): u is string => u !== undefined),
    );

    const diffPixelFraction = numDiffPixels / (width * height);
    const allowedDiffFraction = (100 - tolerance) / 100;
    const changed = diffPixelFraction > allowedDiffFraction;
    screenshot = { kind: changed ? 'changed' : 'match', diffPixelFraction };
    diffPng = PNG.sync.write(output);
  }

  // V65: screenshot & meta bucket independently, same slug may split across buckets.
  const screenshotBucket: ClassifiedBucket = screenshot.kind === 'match' ? 'matched' : 'changed';
  const metaBucket: ClassifiedBucket = metaChanged ? 'changed' : 'matched';
  removeStaleSkippedEntry(base, slug, hash);

  removeStaleTypeEntry(base, metaBucket, 'meta', slug, hash);
  const metaDir = typeDir(base, metaBucket, 'meta');
  fs.mkdirSync(metaDir, { recursive: true });
  fs.writeFileSync(path.join(metaDir, fileName(slug, hash, 'json')), JSON.stringify(meta, null, 2));
  writeTypeReadme(base, metaBucket, 'meta');

  if (diffPng) {
    removeStaleTypeEntry(base, screenshotBucket, 'screenshot', slug, hash);
    const shotDir = typeDir(base, screenshotBucket, 'screenshot');
    fs.mkdirSync(shotDir, { recursive: true });
    fs.writeFileSync(path.join(shotDir, fileName(slug, hash, 'png')), diffPng);
    writeTypeReadme(base, screenshotBucket, 'screenshot');
  }

  return { page_slug: slug, screenshot, meta, metaChanged };
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
