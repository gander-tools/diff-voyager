/**
 * Performance Comparator unit tests
 */

import type { PerformanceData } from '@gander-tools/diff-voyager-shared';
import { DiffSeverity, DiffType } from '@gander-tools/diff-voyager-shared';
import { describe, expect, it } from 'vitest';
import * as PerformanceComparator from '../../../src/domain/performance-comparator.js';

function createPerformanceData(overrides: Partial<PerformanceData> = {}): PerformanceData {
  return {
    loadTimeMs: 1000,
    requestCount: 50,
    totalSizeBytes: 500000,
    ...overrides,
  };
}

describe('PerformanceComparator', () => {
  describe('compare', () => {
    it('should return empty array for identical performance data', () => {
      const baseline = createPerformanceData();
      const current = createPerformanceData();

      const changes = PerformanceComparator.compare(baseline, current);

      expect(changes).toEqual([]);
    });

    it('should detect load time increase', () => {
      const baseline = createPerformanceData({ loadTimeMs: 1000 });
      const current = createPerformanceData({ loadTimeMs: 2000 });

      const changes = PerformanceComparator.compare(baseline, current);

      expect(changes).toHaveLength(1);
      expect(changes[0]).toMatchObject({
        type: DiffType.PERFORMANCE,
        metric: 'loadTimeMs',
        baselineValue: 1000,
        currentValue: 2000,
        changePercentage: 100,
      });
    });

    it('should detect load time decrease', () => {
      const baseline = createPerformanceData({ loadTimeMs: 2000 });
      const current = createPerformanceData({ loadTimeMs: 1000 });

      const changes = PerformanceComparator.compare(baseline, current);

      expect(changes).toHaveLength(1);
      expect(changes[0]).toMatchObject({
        metric: 'loadTimeMs',
        changePercentage: -50,
      });
    });

    it('should detect request count change', () => {
      const baseline = createPerformanceData({ requestCount: 50 });
      const current = createPerformanceData({ requestCount: 100 });

      const changes = PerformanceComparator.compare(baseline, current);

      expect(changes).toHaveLength(1);
      expect(changes[0]).toMatchObject({
        metric: 'requestCount',
        baselineValue: 50,
        currentValue: 100,
        changePercentage: 100,
      });
    });

    it('should detect total size change', () => {
      const baseline = createPerformanceData({ totalSizeBytes: 500000 });
      const current = createPerformanceData({ totalSizeBytes: 750000 });

      const changes = PerformanceComparator.compare(baseline, current);

      expect(changes).toHaveLength(1);
      expect(changes[0]).toMatchObject({
        metric: 'totalSizeBytes',
        baselineValue: 500000,
        currentValue: 750000,
        changePercentage: 50,
      });
    });

    it('should detect multiple metric changes', () => {
      const baseline = createPerformanceData({
        loadTimeMs: 1000,
        requestCount: 50,
        totalSizeBytes: 500000,
      });
      const current = createPerformanceData({
        loadTimeMs: 2000,
        requestCount: 75,
        totalSizeBytes: 750000,
      });

      const changes = PerformanceComparator.compare(baseline, current);

      expect(changes).toHaveLength(3);
      expect(changes.map((c) => c.metric)).toContain('loadTimeMs');
      expect(changes.map((c) => c.metric)).toContain('requestCount');
      expect(changes.map((c) => c.metric)).toContain('totalSizeBytes');
    });

    it('should ignore small changes below threshold', () => {
      const baseline = createPerformanceData({ loadTimeMs: 1000 });
      // 5% change - below default 10% threshold
      const current = createPerformanceData({ loadTimeMs: 1050 });

      const changes = PerformanceComparator.compare(baseline, current);

      expect(changes).toEqual([]);
    });

    it('should respect custom threshold', () => {
      const baseline = createPerformanceData({ loadTimeMs: 1000 });
      const current = createPerformanceData({ loadTimeMs: 1050 }); // 5% change

      // With 3% threshold, 5% should trigger
      const changes = PerformanceComparator.compare(baseline, current, { threshold: 3 });

      expect(changes).toHaveLength(1);
    });

    it('should handle zero baseline value', () => {
      const baseline = createPerformanceData({ requestCount: 0 });
      const current = createPerformanceData({ requestCount: 10 });

      const changes = PerformanceComparator.compare(baseline, current);

      expect(changes).toHaveLength(1);
      expect(changes[0].changePercentage).toBeGreaterThan(0);
    });

    it('should handle undefined baseline', () => {
      const current = createPerformanceData();

      const changes = PerformanceComparator.compare(undefined, current);

      // All metrics should be reported as added
      expect(changes.length).toBeGreaterThan(0);
    });

    it('should handle undefined current', () => {
      const baseline = createPerformanceData();

      const changes = PerformanceComparator.compare(baseline, undefined);

      // All metrics should be reported as removed
      expect(changes.length).toBeGreaterThan(0);
    });

    it('should handle both undefined', () => {
      const changes = PerformanceComparator.compare(undefined, undefined);

      expect(changes).toEqual([]);
    });
  });

  describe('getSeverity', () => {
    it('should return CRITICAL for large load time increase', () => {
      // 200% increase
      expect(PerformanceComparator.getSeverity('loadTimeMs', 200)).toBe(DiffSeverity.CRITICAL);
    });

    it('should return WARNING for moderate load time increase', () => {
      // 50% increase
      expect(PerformanceComparator.getSeverity('loadTimeMs', 50)).toBe(DiffSeverity.WARNING);
    });

    it('should return INFO for load time decrease', () => {
      // 50% decrease (improvement)
      expect(PerformanceComparator.getSeverity('loadTimeMs', -50)).toBe(DiffSeverity.INFO);
    });

    it('should return WARNING for significant size increase', () => {
      expect(PerformanceComparator.getSeverity('totalSizeBytes', 75)).toBe(DiffSeverity.WARNING);
    });

    it('should return INFO for small size increase', () => {
      expect(PerformanceComparator.getSeverity('totalSizeBytes', 15)).toBe(DiffSeverity.INFO);
    });
  });

  describe('formatMetricValue', () => {
    it('should format load time as seconds', () => {
      expect(PerformanceComparator.formatMetricValue('loadTimeMs', 1500)).toBe('1.50s');
    });

    it('should format size as human readable', () => {
      expect(PerformanceComparator.formatMetricValue('totalSizeBytes', 1048576)).toBe('1.00 MB');
      expect(PerformanceComparator.formatMetricValue('totalSizeBytes', 1024)).toBe('1.00 KB');
    });

    it('should format request count as number', () => {
      expect(PerformanceComparator.formatMetricValue('requestCount', 42)).toBe('42');
    });
  });

  describe('createDescription', () => {
    it('should create description for increased metric', () => {
      const desc = PerformanceComparator.createDescription('loadTimeMs', 1000, 2000, 100);
      expect(desc).toContain('Load time');
      expect(desc).toContain('increased');
      expect(desc).toContain('100%');
    });

    it('should create description for decreased metric', () => {
      const desc = PerformanceComparator.createDescription('loadTimeMs', 2000, 1000, -50);
      expect(desc).toContain('decreased');
      expect(desc).toContain('50%');
    });
  });
});
