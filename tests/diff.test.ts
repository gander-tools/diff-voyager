import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type Database from 'better-sqlite3';
import { PNG } from 'pngjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { migrate, openDb, toDrizzle } from '../src/db';
import { diffPageSlug, diffVersions, resolvePageSlugs } from '../src/diff';
import { DrizzleRunsRepo, type RunsRepo } from '../src/repos/runsRepo';
import { DrizzleUrlsRepo, type UrlsRepo } from '../src/repos/urlsRepo';
import { pageSlug } from '../src/slug';
import type { Config, ScrapedPage } from '../src/types';

function writePng(filePath: string, width: number, height: number, r: number): void {
  const png = new PNG({ width, height });
  for (let i = 0; i < width * height; i++) {
    png.data[i * 4] = r;
    png.data[i * 4 + 1] = 0;
    png.data[i * 4 + 2] = 0;
    png.data[i * 4 + 3] = 255;
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, PNG.sync.write(png));
}

function writeMeta(filePath: string, meta: Partial<ScrapedPage> & { url: string }): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(meta, null, 2));
}

function baseMeta(url: string): ScrapedPage {
  return {
    url,
    version: 1,
    scraped_at: '2026-01-01T00:00:00.000Z',
    title: 'Title',
    lang: 'en',
    canonical: '',
    description: '',
    og_description: '',
    links: [],
    js_errors: [],
  };
}

describe('resolvePageSlugs', () => {
  let tmpDir: string;
  let db: Database.Database;
  let urlsRepo: UrlsRepo;
  let snapshotDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'voyager-diff-'));
    db = openDb(path.join(tmpDir, 'test.db'));
    migrate(db);
    urlsRepo = new DrizzleUrlsRepo(toDrizzle(db));
    snapshotDir = path.join(tmpDir, 'snapshots');
  });

  afterEach(() => {
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('resolves exactly one page_slug from a full url arg (V42)', () => {
    urlsRepo.insert('https://example.com/a/b?x=1');
    const slugs = resolvePageSlugs(1, 2, 'https://example.com/a/b?x=1', urlsRepo, snapshotDir);
    expect(slugs).toHaveLength(1);
  });

  it('resolves the shared page_slug for a path(+query)-only arg matching multiple domains (V42, §C:15)', () => {
    urlsRepo.insert('https://example.com/a/b?x=1');
    urlsRepo.insert('https://other.com/a/b?x=1');
    const slugs = resolvePageSlugs(1, 2, '/a/b?x=1', urlsRepo, snapshotDir);
    expect(slugs).toEqual([pageSlug('/a/b', 'x=1')]);
  });

  it('resolves the intersection of on-disk slugs when arg is omitted (V42)', () => {
    fs.mkdirSync(path.join(snapshotDir, 'version-1', 'slug-a'), { recursive: true });
    fs.mkdirSync(path.join(snapshotDir, 'version-1', 'slug-b'), { recursive: true });
    fs.mkdirSync(path.join(snapshotDir, 'version-2', 'slug-a'), { recursive: true });
    fs.mkdirSync(path.join(snapshotDir, 'version-2', 'slug-c'), { recursive: true });

    const slugs = resolvePageSlugs(1, 2, undefined, urlsRepo, snapshotDir);
    expect(slugs).toEqual(['slug-a']);
  });
});

describe('diffPageSlug', () => {
  let tmpDir: string;
  let db: Database.Database;
  let urlsRepo: UrlsRepo;
  let snapshotDir: string;
  let resultDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'voyager-diff-'));
    db = openDb(path.join(tmpDir, 'test.db'));
    migrate(db);
    urlsRepo = new DrizzleUrlsRepo(toDrizzle(db));
    snapshotDir = path.join(tmpDir, 'snapshots');
    resultDir = path.join(tmpDir, 'results');
  });

  afterEach(() => {
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('skips with a warning when the page_slug is missing in either version (V44)', () => {
    writePng(path.join(snapshotDir, 'version-1', 'slug-a', 'screenshot.png'), 2, 2, 0);
    writeMeta(
      path.join(snapshotDir, 'version-1', 'slug-a', 'meta.json'),
      baseMeta('https://example.com/a'),
    );

    const outcome = diffPageSlug(1, 2, 'slug-a', snapshotDir, resultDir, {}, urlsRepo);
    expect(outcome.skipped).toBeTruthy();
  });

  it('reports dimension-mismatch instead of a pixel diff when screenshot sizes differ (V44)', () => {
    writePng(path.join(snapshotDir, 'version-1', 'slug-a', 'screenshot.png'), 2, 2, 0);
    writePng(path.join(snapshotDir, 'version-2', 'slug-a', 'screenshot.png'), 3, 3, 0);
    writeMeta(
      path.join(snapshotDir, 'version-1', 'slug-a', 'meta.json'),
      baseMeta('https://example.com/a'),
    );
    writeMeta(
      path.join(snapshotDir, 'version-2', 'slug-a', 'meta.json'),
      baseMeta('https://example.com/a'),
    );

    const outcome = diffPageSlug(1, 2, 'slug-a', snapshotDir, resultDir, {}, urlsRepo);
    expect(outcome.screenshot).toEqual({ kind: 'dimension-mismatch' });
  });

  it('flags changed when the diff pixel fraction exceeds tolerance (V45)', () => {
    writePng(path.join(snapshotDir, 'version-1', 'slug-a', 'screenshot.png'), 4, 4, 0);
    writePng(path.join(snapshotDir, 'version-2', 'slug-a', 'screenshot.png'), 4, 4, 255);
    writeMeta(
      path.join(snapshotDir, 'version-1', 'slug-a', 'meta.json'),
      baseMeta('https://example.com/a'),
    );
    writeMeta(
      path.join(snapshotDir, 'version-2', 'slug-a', 'meta.json'),
      baseMeta('https://example.com/a'),
    );

    const outcome = diffPageSlug(1, 2, 'slug-a', snapshotDir, resultDir, {}, urlsRepo);
    expect(outcome.screenshot).toMatchObject({ kind: 'changed' });
    expect(
      fs.existsSync(path.join(resultDir, 'diff-v1-v2', 'changed', 'slug-a', 'screenshot.png')),
    ).toBe(true);
  });

  it('does not flag changed when the diff pixel fraction is within tolerance (V45)', () => {
    writePng(path.join(snapshotDir, 'version-1', 'slug-a', 'screenshot.png'), 4, 4, 0);
    writePng(path.join(snapshotDir, 'version-2', 'slug-a', 'screenshot.png'), 4, 4, 255);
    writeMeta(
      path.join(snapshotDir, 'version-1', 'slug-a', 'meta.json'),
      baseMeta('https://example.com/a'),
    );
    writeMeta(
      path.join(snapshotDir, 'version-2', 'slug-a', 'meta.json'),
      baseMeta('https://example.com/a'),
    );

    const config: Config = { screenshot: { rules: { diff: { tolerance: { '*': 1 } } } } };
    const outcome = diffPageSlug(1, 2, 'slug-a', snapshotDir, resultDir, config, urlsRepo);
    expect(outcome.screenshot).toMatchObject({ kind: 'match' });
  });

  it('produces a shallow meta.json diff for changed top-level keys, links by full-array-equality (V46)', () => {
    writePng(path.join(snapshotDir, 'version-1', 'slug-a', 'screenshot.png'), 2, 2, 0);
    writePng(path.join(snapshotDir, 'version-2', 'slug-a', 'screenshot.png'), 2, 2, 0);
    const meta1 = { ...baseMeta('https://example.com/a'), title: 'Old' };
    const meta2 = {
      ...baseMeta('https://example.com/a'),
      title: 'New',
      links: [{ href: '/x', text: 'x', internal: true }],
    };
    writeMeta(path.join(snapshotDir, 'version-1', 'slug-a', 'meta.json'), meta1);
    writeMeta(path.join(snapshotDir, 'version-2', 'slug-a', 'meta.json'), meta2);

    const outcome = diffPageSlug(1, 2, 'slug-a', snapshotDir, resultDir, {}, urlsRepo);
    expect(outcome.meta).toEqual({
      title: { old: 'Old', new: 'New' },
      links: { old: meta1.links, new: meta2.links },
    });
  });

  it('writes an empty meta diff object when nothing changed (V46)', () => {
    writePng(path.join(snapshotDir, 'version-1', 'slug-a', 'screenshot.png'), 2, 2, 0);
    writePng(path.join(snapshotDir, 'version-2', 'slug-a', 'screenshot.png'), 2, 2, 0);
    writeMeta(
      path.join(snapshotDir, 'version-1', 'slug-a', 'meta.json'),
      baseMeta('https://example.com/a'),
    );
    writeMeta(
      path.join(snapshotDir, 'version-2', 'slug-a', 'meta.json'),
      baseMeta('https://example.com/a'),
    );

    const outcome = diffPageSlug(1, 2, 'slug-a', snapshotDir, resultDir, {}, urlsRepo);
    expect(outcome.meta).toEqual({});
    const written = JSON.parse(
      fs.readFileSync(path.join(resultDir, 'diff-v1-v2', 'matched', 'slug-a', 'meta.json'), 'utf-8'),
    );
    expect(written).toEqual({});
  });

  it('matches tolerance glob against urls.url (source, DB) as well as meta.json.url (V49)', () => {
    urlsRepo.insert('https://example.com/a');
    const slug = pageSlug('/a', '');

    writePng(path.join(snapshotDir, 'version-1', slug, 'screenshot.png'), 4, 4, 0);
    writePng(path.join(snapshotDir, 'version-2', slug, 'screenshot.png'), 4, 4, 255);
    writeMeta(
      path.join(snapshotDir, 'version-1', slug, 'meta.json'),
      baseMeta('https://cdn.example.com/a'),
    );
    writeMeta(
      path.join(snapshotDir, 'version-2', slug, 'meta.json'),
      baseMeta('https://cdn.example.com/a'),
    );

    const config: Config = {
      screenshot: { rules: { diff: { tolerance: { 'https://example.com/*': 1 } } } },
    };
    const outcome = diffPageSlug(1, 2, slug, snapshotDir, resultDir, config, urlsRepo);
    expect(outcome.screenshot).toMatchObject({ kind: 'match' });
  });

  it('resolves multiple matching tolerance globs to the MIN value, regardless of config.json key order (V55)', () => {
    writePng(path.join(snapshotDir, 'version-1', 'slug-a', 'screenshot.png'), 4, 4, 0);
    writePng(path.join(snapshotDir, 'version-2', 'slug-a', 'screenshot.png'), 4, 4, 255);
    writeMeta(
      path.join(snapshotDir, 'version-1', 'slug-a', 'meta.json'),
      baseMeta('https://example.com/a'),
    );
    writeMeta(
      path.join(snapshotDir, 'version-2', 'slug-a', 'meta.json'),
      baseMeta('https://example.com/a'),
    );

    // Loose glob written first, strict glob written second — a naive
    // first-match implementation would pick the loose value (1) and report
    // "match"; MIN precedence must pick the strict value (0) and flag it.
    const looseFirst: Config = {
      screenshot: { rules: { diff: { tolerance: { '*': 1, 'https://example.com/*': 0 } } } },
    };
    const outcomeLooseFirst = diffPageSlug(1, 2, 'slug-a', snapshotDir, resultDir, looseFirst, urlsRepo);
    expect(outcomeLooseFirst.screenshot).toMatchObject({ kind: 'changed' });

    // Same two globs, reverse key order — result must be identical.
    const strictFirst: Config = {
      screenshot: { rules: { diff: { tolerance: { 'https://example.com/*': 0, '*': 1 } } } },
    };
    const outcomeStrictFirst = diffPageSlug(1, 2, 'slug-a', snapshotDir, resultDir, strictFirst, urlsRepo);
    expect(outcomeStrictFirst.screenshot).toMatchObject({ kind: 'changed' });
  });

  it('routes to matched/ when screenshot=match and meta={} (V56)', () => {
    writePng(path.join(snapshotDir, 'version-1', 'slug-a', 'screenshot.png'), 2, 2, 0);
    writePng(path.join(snapshotDir, 'version-2', 'slug-a', 'screenshot.png'), 2, 2, 0);
    writeMeta(
      path.join(snapshotDir, 'version-1', 'slug-a', 'meta.json'),
      baseMeta('https://example.com/a'),
    );
    writeMeta(
      path.join(snapshotDir, 'version-2', 'slug-a', 'meta.json'),
      baseMeta('https://example.com/a'),
    );

    diffPageSlug(1, 2, 'slug-a', snapshotDir, resultDir, {}, urlsRepo);

    expect(fs.existsSync(path.join(resultDir, 'diff-v1-v2', 'matched', 'slug-a'))).toBe(true);
    expect(fs.existsSync(path.join(resultDir, 'diff-v1-v2', 'changed', 'slug-a'))).toBe(false);
  });

  it('routes to changed/ when screenshot matches but meta differs (V56)', () => {
    writePng(path.join(snapshotDir, 'version-1', 'slug-a', 'screenshot.png'), 2, 2, 0);
    writePng(path.join(snapshotDir, 'version-2', 'slug-a', 'screenshot.png'), 2, 2, 0);
    writeMeta(
      path.join(snapshotDir, 'version-1', 'slug-a', 'meta.json'),
      baseMeta('https://example.com/a'),
    );
    writeMeta(path.join(snapshotDir, 'version-2', 'slug-a', 'meta.json'), {
      ...baseMeta('https://example.com/a'),
      title: 'New',
    });

    const outcome = diffPageSlug(1, 2, 'slug-a', snapshotDir, resultDir, {}, urlsRepo);

    expect(outcome.screenshot).toMatchObject({ kind: 'match' });
    expect(outcome.meta).not.toEqual({});
    expect(fs.existsSync(path.join(resultDir, 'diff-v1-v2', 'changed', 'slug-a'))).toBe(true);
    expect(fs.existsSync(path.join(resultDir, 'diff-v1-v2', 'matched', 'slug-a'))).toBe(false);
  });

  it('routes dimension-mismatch to changed/ without writing a screenshot.png (V56)', () => {
    writePng(path.join(snapshotDir, 'version-1', 'slug-a', 'screenshot.png'), 2, 2, 0);
    writePng(path.join(snapshotDir, 'version-2', 'slug-a', 'screenshot.png'), 3, 3, 0);
    writeMeta(
      path.join(snapshotDir, 'version-1', 'slug-a', 'meta.json'),
      baseMeta('https://example.com/a'),
    );
    writeMeta(
      path.join(snapshotDir, 'version-2', 'slug-a', 'meta.json'),
      baseMeta('https://example.com/a'),
    );

    diffPageSlug(1, 2, 'slug-a', snapshotDir, resultDir, {}, urlsRepo);

    const changedDir = path.join(resultDir, 'diff-v1-v2', 'changed', 'slug-a');
    expect(fs.existsSync(path.join(changedDir, 'meta.json'))).toBe(true);
    expect(fs.existsSync(path.join(changedDir, 'screenshot.png'))).toBe(false);
  });

  it('writes a README.md into matched/ on first entry (V57)', () => {
    writePng(path.join(snapshotDir, 'version-1', 'slug-a', 'screenshot.png'), 2, 2, 0);
    writePng(path.join(snapshotDir, 'version-2', 'slug-a', 'screenshot.png'), 2, 2, 0);
    writeMeta(
      path.join(snapshotDir, 'version-1', 'slug-a', 'meta.json'),
      baseMeta('https://example.com/a'),
    );
    writeMeta(
      path.join(snapshotDir, 'version-2', 'slug-a', 'meta.json'),
      baseMeta('https://example.com/a'),
    );

    diffPageSlug(1, 2, 'slug-a', snapshotDir, resultDir, {}, urlsRepo);

    const readme = fs.readFileSync(
      path.join(resultDir, 'diff-v1-v2', 'matched', 'README.md'),
      'utf-8',
    );
    expect(readme.length).toBeGreaterThan(0);
    expect(readme).toContain('screenshot.png');
    expect(readme).toContain('meta.json');
  });

  it('writes a README.md into changed/ on first entry (V57)', () => {
    writePng(path.join(snapshotDir, 'version-1', 'slug-a', 'screenshot.png'), 4, 4, 0);
    writePng(path.join(snapshotDir, 'version-2', 'slug-a', 'screenshot.png'), 4, 4, 255);
    writeMeta(
      path.join(snapshotDir, 'version-1', 'slug-a', 'meta.json'),
      baseMeta('https://example.com/a'),
    );
    writeMeta(
      path.join(snapshotDir, 'version-2', 'slug-a', 'meta.json'),
      baseMeta('https://example.com/a'),
    );

    diffPageSlug(1, 2, 'slug-a', snapshotDir, resultDir, {}, urlsRepo);

    const readme = fs.readFileSync(
      path.join(resultDir, 'diff-v1-v2', 'changed', 'README.md'),
      'utf-8',
    );
    expect(readme.length).toBeGreaterThan(0);
    expect(readme).toContain('screenshot.png');
    expect(readme).toContain('meta.json');
  });

  it('writes a README.md into skipped/ on first entry, mentioning reason.json (V57)', () => {
    writePng(path.join(snapshotDir, 'version-1', 'slug-a', 'screenshot.png'), 2, 2, 0);
    writeMeta(
      path.join(snapshotDir, 'version-1', 'slug-a', 'meta.json'),
      baseMeta('https://example.com/a'),
    );

    diffPageSlug(1, 2, 'slug-a', snapshotDir, resultDir, {}, urlsRepo);

    const readme = fs.readFileSync(
      path.join(resultDir, 'diff-v1-v2', 'skipped', 'README.md'),
      'utf-8',
    );
    expect(readme.length).toBeGreaterThan(0);
    expect(readme).toContain('reason.json');
  });

  it('does not write a README.md for a bucket that never gets an entry (V57)', () => {
    writePng(path.join(snapshotDir, 'version-1', 'slug-a', 'screenshot.png'), 2, 2, 0);
    writePng(path.join(snapshotDir, 'version-2', 'slug-a', 'screenshot.png'), 2, 2, 0);
    writeMeta(
      path.join(snapshotDir, 'version-1', 'slug-a', 'meta.json'),
      baseMeta('https://example.com/a'),
    );
    writeMeta(
      path.join(snapshotDir, 'version-2', 'slug-a', 'meta.json'),
      baseMeta('https://example.com/a'),
    );

    diffPageSlug(1, 2, 'slug-a', snapshotDir, resultDir, {}, urlsRepo);

    expect(fs.existsSync(path.join(resultDir, 'diff-v1-v2', 'changed'))).toBe(false);
    expect(fs.existsSync(path.join(resultDir, 'diff-v1-v2', 'skipped'))).toBe(false);
  });

  it('re-running diff into an already-existing bucket dir does not throw (idempotent, V57)', () => {
    writePng(path.join(snapshotDir, 'version-1', 'slug-a', 'screenshot.png'), 2, 2, 0);
    writePng(path.join(snapshotDir, 'version-2', 'slug-a', 'screenshot.png'), 2, 2, 0);
    writeMeta(
      path.join(snapshotDir, 'version-1', 'slug-a', 'meta.json'),
      baseMeta('https://example.com/a'),
    );
    writeMeta(
      path.join(snapshotDir, 'version-2', 'slug-a', 'meta.json'),
      baseMeta('https://example.com/a'),
    );

    diffPageSlug(1, 2, 'slug-a', snapshotDir, resultDir, {}, urlsRepo);
    expect(() =>
      diffPageSlug(1, 2, 'slug-a', snapshotDir, resultDir, {}, urlsRepo),
    ).not.toThrow();

    expect(fs.existsSync(path.join(resultDir, 'diff-v1-v2', 'matched', 'README.md'))).toBe(true);
  });

  it('writes skipped/<slug>/reason.json with no screenshot.png or meta.json (V56)', () => {
    writePng(path.join(snapshotDir, 'version-1', 'slug-a', 'screenshot.png'), 2, 2, 0);
    writeMeta(
      path.join(snapshotDir, 'version-1', 'slug-a', 'meta.json'),
      baseMeta('https://example.com/a'),
    );

    const outcome = diffPageSlug(1, 2, 'slug-a', snapshotDir, resultDir, {}, urlsRepo);

    const skippedDir = path.join(resultDir, 'diff-v1-v2', 'skipped', 'slug-a');
    const written = JSON.parse(fs.readFileSync(path.join(skippedDir, 'reason.json'), 'utf-8'));
    expect(written.reason).toBe(outcome.skipped);
    expect(fs.existsSync(path.join(skippedDir, 'screenshot.png'))).toBe(false);
    expect(fs.existsSync(path.join(skippedDir, 'meta.json'))).toBe(false);
  });
});

describe('diffVersions', () => {
  let tmpDir: string;
  let db: Database.Database;
  let runsRepo: RunsRepo;
  let urlsRepo: UrlsRepo;
  let snapshotDir: string;
  let resultDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'voyager-diff-'));
    db = openDb(path.join(tmpDir, 'test.db'));
    migrate(db);
    runsRepo = new DrizzleRunsRepo(toDrizzle(db));
    urlsRepo = new DrizzleUrlsRepo(toDrizzle(db));
    snapshotDir = path.join(tmpDir, 'snapshots');
    resultDir = path.join(tmpDir, 'results');
  });

  afterEach(() => {
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('throws when the run for v1 or v2 is still open (V43)', () => {
    fs.mkdirSync(path.join(snapshotDir, 'version-1'), { recursive: true });
    fs.mkdirSync(path.join(snapshotDir, 'version-2'), { recursive: true });
    db.prepare('INSERT INTO runs (id, version, status) VALUES (?, ?, ?)').run('r1', 1, 'open');

    expect(() =>
      diffVersions(1, 2, undefined, runsRepo, urlsRepo, snapshotDir, resultDir, {}),
    ).toThrow(/open/);
  });

  it('does not false-trip the open guard when no run row exists for a version', () => {
    fs.mkdirSync(path.join(snapshotDir, 'version-1'), { recursive: true });
    fs.mkdirSync(path.join(snapshotDir, 'version-2'), { recursive: true });

    expect(() =>
      diffVersions(1, 2, undefined, runsRepo, urlsRepo, snapshotDir, resultDir, {}),
    ).not.toThrow();
  });

  it('throws when a version-<N> directory is missing entirely, no partial output written (V47)', () => {
    fs.mkdirSync(path.join(snapshotDir, 'version-1'), { recursive: true });

    expect(() =>
      diffVersions(1, 2, undefined, runsRepo, urlsRepo, snapshotDir, resultDir, {}),
    ).toThrow();
    expect(fs.existsSync(resultDir)).toBe(false);
  });

  it('diffs every resolved page_slug when arg is omitted', () => {
    writePng(path.join(snapshotDir, 'version-1', 'slug-a', 'screenshot.png'), 2, 2, 0);
    writePng(path.join(snapshotDir, 'version-2', 'slug-a', 'screenshot.png'), 2, 2, 0);
    writeMeta(
      path.join(snapshotDir, 'version-1', 'slug-a', 'meta.json'),
      baseMeta('https://example.com/a'),
    );
    writeMeta(
      path.join(snapshotDir, 'version-2', 'slug-a', 'meta.json'),
      baseMeta('https://example.com/a'),
    );

    const outcomes = diffVersions(1, 2, undefined, runsRepo, urlsRepo, snapshotDir, resultDir, {});
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0].page_slug).toBe('slug-a');
  });
});
