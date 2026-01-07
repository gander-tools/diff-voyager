/**
 * Full Page Comparator unit tests
 */

import { randomUUID } from 'node:crypto';
import type { PageSnapshot } from '@gander-tools/diff-voyager-shared';
import { DiffSeverity, DiffStatus, DiffType, PageStatus } from '@gander-tools/diff-voyager-shared';
import { describe, expect, it } from 'vitest';
import * as PageComparator from '../../../src/domain/page-comparator.js';
import { createSeoData } from '../../helpers/factories.js';

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
  });
});
