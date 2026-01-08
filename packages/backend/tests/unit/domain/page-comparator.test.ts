/**
 * Full Page Comparator unit tests
 */

import { randomUUID } from 'node:crypto';
import type { PageSnapshot } from '@gander-tools/diff-voyager-shared';
import { DiffSeverity, DiffStatus, DiffType, PageStatus } from '@gander-tools/diff-voyager-shared';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import * as PageComparator from '../../../src/domain/page-comparator.js';
import { createSeoData } from '../../helpers/factories.js';

// Helper to create a test PNG buffer
function createTestImage(
  width: number,
  height: number,
  color: [number, number, number, number],
): Buffer {
  const png = new PNG({ width, height });
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2;
      png.data[idx] = color[0]; // R
      png.data[idx + 1] = color[1]; // G
      png.data[idx + 2] = color[2]; // B
      png.data[idx + 3] = color[3]; // A
    }
  }
  return PNG.sync.write(png);
}

// Helper to create an image with a colored region
function createImageWithRegion(
  width: number,
  height: number,
  bgColor: [number, number, number, number],
  regionX: number,
  regionY: number,
  regionW: number,
  regionH: number,
  regionColor: [number, number, number, number],
): Buffer {
  const png = new PNG({ width, height });
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2;
      if (x >= regionX && x < regionX + regionW && y >= regionY && y < regionY + regionH) {
        png.data[idx] = regionColor[0];
        png.data[idx + 1] = regionColor[1];
        png.data[idx + 2] = regionColor[2];
        png.data[idx + 3] = regionColor[3];
      } else {
        png.data[idx] = bgColor[0];
        png.data[idx + 1] = bgColor[1];
        png.data[idx + 2] = bgColor[2];
        png.data[idx + 3] = bgColor[3];
      }
    }
  }
  return PNG.sync.write(png);
}

function createSnapshot(overrides: Partial<PageSnapshot> = {}): PageSnapshot {
  return {
    id: randomUUID(),
    pageId: randomUUID(),
    runId: randomUUID(),
    status: PageStatus.COMPLETED,
    capturedAt: new Date(),
    httpStatus: 200,
    html: '<html><body>Test</body></html>',
    htmlHash: 'abc123',
    httpHeaders: { 'content-type': 'text/html' },
    seoData: createSeoData(),
    artifacts: {},
    ...overrides,
  };
}

describe('PageComparator', () => {
  describe('compare', () => {
    it('should return empty changes for identical snapshots', () => {
      const seoData = createSeoData();
      const baseline = createSnapshot({ seoData });
      const current = createSnapshot({ seoData });

      const result = PageComparator.compare(baseline, current);

      expect(result.changes).toEqual([]);
      expect(result.summary.totalChanges).toBe(0);
    });

    it('should detect SEO changes', () => {
      const baseline = createSnapshot({
        seoData: createSeoData({ title: 'Original Title' }),
      });
      const current = createSnapshot({
        seoData: createSeoData({ title: 'Changed Title' }),
      });

      const result = PageComparator.compare(baseline, current);

      expect(result.changes.length).toBeGreaterThan(0);
      expect(result.changes.some((c) => c.type === DiffType.SEO)).toBe(true);
      expect(result.summary.changesByType[DiffType.SEO]).toBeGreaterThan(0);
    });

    it('should detect header changes', () => {
      const baseline = createSnapshot({
        httpHeaders: { 'content-type': 'text/html' },
      });
      const current = createSnapshot({
        httpHeaders: { 'content-type': 'application/json' },
      });

      const result = PageComparator.compare(baseline, current);

      expect(result.changes.some((c) => c.type === DiffType.HEADERS)).toBe(true);
    });

    it('should detect performance changes', () => {
      const baseline = createSnapshot({
        performance: { loadTimeMs: 1000, requestCount: 50, totalSizeBytes: 500000 },
      });
      const current = createSnapshot({
        performance: { loadTimeMs: 3000, requestCount: 100, totalSizeBytes: 1500000 },
      });

      const result = PageComparator.compare(baseline, current);

      expect(result.changes.some((c) => c.type === DiffType.PERFORMANCE)).toBe(true);
    });

    it('should detect HTTP status change', () => {
      const baseline = createSnapshot({ httpStatus: 200 });
      const current = createSnapshot({ httpStatus: 404 });

      const result = PageComparator.compare(baseline, current);

      expect(result.changes.some((c) => c.type === DiffType.HTTP_STATUS)).toBe(true);
      // Status code change to error should be critical
      expect(result.changes.find((c) => c.type === DiffType.HTTP_STATUS)?.severity).toBe(
        DiffSeverity.CRITICAL,
      );
    });

    it('should calculate summary correctly', () => {
      const baseline = createSnapshot({
        seoData: createSeoData({ title: 'Original', metaDescription: 'Original desc' }),
        httpStatus: 200,
      });
      const current = createSnapshot({
        seoData: createSeoData({ title: 'Changed', metaDescription: 'Changed desc' }),
        httpStatus: 500,
      });

      const result = PageComparator.compare(baseline, current);

      expect(result.summary.totalChanges).toBe(result.changes.length);
      expect(result.summary.criticalChanges).toBeGreaterThan(0);
    });

    it('should include all change types in summary', () => {
      const baseline = createSnapshot();
      const current = createSnapshot();

      const result = PageComparator.compare(baseline, current);

      // Summary should have all diff types
      expect(result.summary.changesByType).toHaveProperty(DiffType.SEO);
      expect(result.summary.changesByType).toHaveProperty(DiffType.HEADERS);
      expect(result.summary.changesByType).toHaveProperty(DiffType.PERFORMANCE);
      expect(result.summary.changesByType).toHaveProperty(DiffType.HTTP_STATUS);
      expect(result.summary.changesByType).toHaveProperty(DiffType.VISUAL);
    });

    it('should set all changes to NEW status', () => {
      const baseline = createSnapshot({
        seoData: createSeoData({ title: 'Original' }),
      });
      const current = createSnapshot({
        seoData: createSeoData({ title: 'Changed' }),
      });

      const result = PageComparator.compare(baseline, current);

      for (const change of result.changes) {
        expect(change.status).toBe(DiffStatus.NEW);
      }
    });
  });

  describe('compareHttpStatus', () => {
    it('should return null for same status', () => {
      const change = PageComparator.compareHttpStatus(200, 200);
      expect(change).toBeNull();
    });

    it('should detect status change', () => {
      const change = PageComparator.compareHttpStatus(200, 301);

      expect(change).not.toBeNull();
      expect(change?.type).toBe(DiffType.HTTP_STATUS);
      expect(change?.details.oldValue).toBe(200);
      expect(change?.details.newValue).toBe(301);
    });

    it('should return CRITICAL for change to error status', () => {
      expect(PageComparator.compareHttpStatus(200, 404)?.severity).toBe(DiffSeverity.CRITICAL);
      expect(PageComparator.compareHttpStatus(200, 500)?.severity).toBe(DiffSeverity.CRITICAL);
    });

    it('should return WARNING for redirect changes', () => {
      expect(PageComparator.compareHttpStatus(200, 301)?.severity).toBe(DiffSeverity.WARNING);
      expect(PageComparator.compareHttpStatus(200, 302)?.severity).toBe(DiffSeverity.WARNING);
    });

    it('should return INFO for 200 to 200-range changes', () => {
      expect(PageComparator.compareHttpStatus(200, 201)?.severity).toBe(DiffSeverity.INFO);
    });
  });

  describe('createDiffSummary', () => {
    it('should count changes correctly', () => {
      const changes = [
        { type: DiffType.SEO, severity: DiffSeverity.CRITICAL, status: DiffStatus.NEW },
        { type: DiffType.SEO, severity: DiffSeverity.WARNING, status: DiffStatus.NEW },
        { type: DiffType.HEADERS, severity: DiffSeverity.INFO, status: DiffStatus.NEW },
        { type: DiffType.HTTP_STATUS, severity: DiffSeverity.CRITICAL, status: DiffStatus.MUTED },
      ] as PageComparator.PageChange[];

      const summary = PageComparator.createDiffSummary(changes);

      expect(summary.totalChanges).toBe(4);
      expect(summary.criticalChanges).toBe(2);
      expect(summary.mutedChanges).toBe(1);
      expect(summary.changesByType[DiffType.SEO]).toBe(2);
      expect(summary.changesByType[DiffType.HEADERS]).toBe(1);
    });

    it('should set thresholdExceeded based on visual diff', () => {
      const summary = PageComparator.createDiffSummary([], {
        visualDiffPercentage: 5,
        visualDiffPixels: 1000,
        thresholdExceeded: true,
      });

      expect(summary.thresholdExceeded).toBe(true);
      expect(summary.visualDiffPercentage).toBe(5);
      expect(summary.visualDiffPixels).toBe(1000);
    });

    it('should count accepted changes correctly', () => {
      const changes = [
        { type: DiffType.SEO, severity: DiffSeverity.CRITICAL, status: DiffStatus.ACCEPTED },
        { type: DiffType.SEO, severity: DiffSeverity.WARNING, status: DiffStatus.ACCEPTED },
        { type: DiffType.HEADERS, severity: DiffSeverity.INFO, status: DiffStatus.NEW },
        { type: DiffType.HTTP_STATUS, severity: DiffSeverity.CRITICAL, status: DiffStatus.MUTED },
      ] as PageComparator.PageChange[];

      const summary = PageComparator.createDiffSummary(changes);

      expect(summary.totalChanges).toBe(4);
      expect(summary.acceptedChanges).toBe(2);
      expect(summary.mutedChanges).toBe(1);
    });

    it('should set thresholdExceeded to false when no visual info provided', () => {
      const changes = [
        { type: DiffType.SEO, severity: DiffSeverity.INFO, status: DiffStatus.NEW },
      ] as PageComparator.PageChange[];

      const summary = PageComparator.createDiffSummary(changes);

      expect(summary.thresholdExceeded).toBe(false);
      expect(summary.visualDiffPercentage).toBeUndefined();
      expect(summary.visualDiffPixels).toBeUndefined();
    });
  });

  describe('compareWithVisual', () => {
    it('should combine non-visual and visual comparison results', async () => {
      const seoData = createSeoData({ title: 'Original Title' });
      const baseline = createSnapshot({ seoData });
      const current = createSnapshot({
        seoData: createSeoData({ title: 'Changed Title' }),
      });

      // Create identical screenshots
      const screenshot = createTestImage(100, 100, [255, 255, 255, 255]);

      const result = await PageComparator.compareWithVisual(
        baseline,
        current,
        screenshot,
        screenshot,
      );

      // Should detect SEO change but no visual change
      expect(result.changes.some((c) => c.type === DiffType.SEO)).toBe(true);
      expect(result.changes.some((c) => c.type === DiffType.VISUAL)).toBe(false);
    });

    it('should detect visual differences and add visual change', async () => {
      const seoData = createSeoData();
      const baseline = createSnapshot({ seoData });
      const current = createSnapshot({ seoData });

      // Create different screenshots
      const baselineScreenshot = createTestImage(100, 100, [255, 255, 255, 255]);
      const currentScreenshot = createTestImage(100, 100, [0, 0, 0, 255]);

      const result = await PageComparator.compareWithVisual(
        baseline,
        current,
        baselineScreenshot,
        currentScreenshot,
      );

      // Should detect visual change
      const visualChange = result.changes.find((c) => c.type === DiffType.VISUAL);
      expect(visualChange).toBeDefined();
      expect(visualChange?.severity).toBe(DiffSeverity.CRITICAL);
      expect(result.summary.visualDiffPercentage).toBe(100);
      expect(result.summary.visualDiffPixels).toBe(10000);
      expect(result.summary.thresholdExceeded).toBe(true);
    });

    it('should generate diff image when requested', async () => {
      const seoData = createSeoData();
      const baseline = createSnapshot({ seoData });
      const current = createSnapshot({ seoData });

      const baselineScreenshot = createTestImage(50, 50, [255, 255, 255, 255]);
      const currentScreenshot = createTestImage(50, 50, [0, 0, 0, 255]);

      const result = await PageComparator.compareWithVisual(
        baseline,
        current,
        baselineScreenshot,
        currentScreenshot,
        { generateDiffImage: true },
      );

      expect(result.visualDiffImage).toBeDefined();
      expect(result.visualDiffImage).toBeInstanceOf(Buffer);
    });

    it('should not generate diff image by default', async () => {
      const seoData = createSeoData();
      const baseline = createSnapshot({ seoData });
      const current = createSnapshot({ seoData });

      const baselineScreenshot = createTestImage(50, 50, [255, 255, 255, 255]);
      const currentScreenshot = createTestImage(50, 50, [0, 0, 0, 255]);

      const result = await PageComparator.compareWithVisual(
        baseline,
        current,
        baselineScreenshot,
        currentScreenshot,
      );

      expect(result.visualDiffImage).toBeUndefined();
    });

    it('should update summary with visual diff info', async () => {
      const seoData = createSeoData();
      const baseline = createSnapshot({ seoData });
      const current = createSnapshot({ seoData });

      // Create screenshots with small difference
      const baselineScreenshot = createTestImage(100, 100, [255, 255, 255, 255]);
      const currentScreenshot = createImageWithRegion(
        100,
        100,
        [255, 255, 255, 255],
        0,
        0,
        10,
        10,
        [0, 0, 0, 255],
      );

      const result = await PageComparator.compareWithVisual(
        baseline,
        current,
        baselineScreenshot,
        currentScreenshot,
      );

      expect(result.summary.visualDiffPercentage).toBe(1);
      expect(result.summary.visualDiffPixels).toBe(100);
    });

    it('should respect custom visual threshold', async () => {
      const seoData = createSeoData();
      const baseline = createSnapshot({ seoData });
      const current = createSnapshot({ seoData });

      // Create screenshots with 1% difference
      const baselineScreenshot = createTestImage(100, 100, [255, 255, 255, 255]);
      const currentScreenshot = createImageWithRegion(
        100,
        100,
        [255, 255, 255, 255],
        0,
        0,
        10,
        10,
        [0, 0, 0, 255],
      );

      // With 2% threshold, 1% diff should not exceed
      const result = await PageComparator.compareWithVisual(
        baseline,
        current,
        baselineScreenshot,
        currentScreenshot,
        { visualThreshold: 2 },
      );

      expect(result.summary.thresholdExceeded).toBe(false);
      const visualChange = result.changes.find((c) => c.type === DiffType.VISUAL);
      expect(visualChange?.severity).toBe(DiffSeverity.WARNING);
    });

    it('should include visual change metadata', async () => {
      const seoData = createSeoData();
      const baseline = createSnapshot({ seoData });
      const current = createSnapshot({ seoData });

      const baselineScreenshot = createTestImage(100, 100, [255, 255, 255, 255]);
      const currentScreenshot = createTestImage(100, 100, [0, 0, 0, 255]);

      const result = await PageComparator.compareWithVisual(
        baseline,
        current,
        baselineScreenshot,
        currentScreenshot,
      );

      const visualChange = result.changes.find((c) => c.type === DiffType.VISUAL);
      expect(visualChange?.details?.metadata).toMatchObject({
        diffPixels: 10000,
        diffPercentage: 100,
        thresholdExceeded: true,
        width: 100,
        height: 100,
      });
    });
  });
});
