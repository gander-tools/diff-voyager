/**
 * Header Comparator unit tests
 */

import { DiffSeverity, DiffType } from '@gander-tools/diff-voyager-shared';
import { describe, expect, it } from 'vitest';
import * as HeaderComparator from '../../../src/domain/header-comparator.js';

describe('HeaderComparator', () => {
  describe('compare', () => {
    it('should return empty array for identical headers', () => {
      const baseline = { 'content-type': 'text/html', 'cache-control': 'max-age=3600' };
      const current = { 'content-type': 'text/html', 'cache-control': 'max-age=3600' };

      const changes = HeaderComparator.compare(baseline, current);

      expect(changes).toEqual([]);
    });

    it('should detect header value change', () => {
      const baseline = { 'content-type': 'text/html' };
      const current = { 'content-type': 'application/json' };

      const changes = HeaderComparator.compare(baseline, current);

      expect(changes).toHaveLength(1);
      expect(changes[0]).toMatchObject({
        type: DiffType.HEADERS,
        headerName: 'content-type',
        baselineValue: 'text/html',
        currentValue: 'application/json',
      });
    });

    it('should detect header removed', () => {
      const baseline = { 'content-type': 'text/html', 'x-custom': 'value' };
      const current = { 'content-type': 'text/html' };

      const changes = HeaderComparator.compare(baseline, current);

      expect(changes).toHaveLength(1);
      expect(changes[0]).toMatchObject({
        type: DiffType.HEADERS,
        headerName: 'x-custom',
        baselineValue: 'value',
        currentValue: null,
      });
    });

    it('should detect header added', () => {
      const baseline = { 'content-type': 'text/html' };
      const current = { 'content-type': 'text/html', 'x-new-header': 'new-value' };

      const changes = HeaderComparator.compare(baseline, current);

      expect(changes).toHaveLength(1);
      expect(changes[0]).toMatchObject({
        type: DiffType.HEADERS,
        headerName: 'x-new-header',
        baselineValue: null,
        currentValue: 'new-value',
      });
    });

    it('should detect multiple changes', () => {
      const baseline = {
        'content-type': 'text/html',
        'x-removed': 'old',
        'x-changed': 'old-value',
      };
      const current = {
        'content-type': 'text/html',
        'x-added': 'new',
        'x-changed': 'new-value',
      };

      const changes = HeaderComparator.compare(baseline, current);

      expect(changes).toHaveLength(3);
      expect(changes.map((c) => c.headerName)).toContain('x-removed');
      expect(changes.map((c) => c.headerName)).toContain('x-added');
      expect(changes.map((c) => c.headerName)).toContain('x-changed');
    });

    it('should be case-insensitive for header names', () => {
      const baseline = { 'Content-Type': 'text/html' };
      const current = { 'content-type': 'text/html' };

      const changes = HeaderComparator.compare(baseline, current);

      expect(changes).toEqual([]);
    });

    it('should handle empty baseline headers', () => {
      const baseline = {};
      const current = { 'content-type': 'text/html' };

      const changes = HeaderComparator.compare(baseline, current);

      expect(changes).toHaveLength(1);
      expect(changes[0].headerName).toBe('content-type');
    });

    it('should handle empty current headers', () => {
      const baseline = { 'content-type': 'text/html' };
      const current = {};

      const changes = HeaderComparator.compare(baseline, current);

      expect(changes).toHaveLength(1);
      expect(changes[0].headerName).toBe('content-type');
    });

    it('should handle both empty', () => {
      const changes = HeaderComparator.compare({}, {});

      expect(changes).toEqual([]);
    });

    it('should ignore specified headers', () => {
      const baseline = { date: '2024-01-01', 'content-type': 'text/html' };
      const current = { date: '2024-01-02', 'content-type': 'text/html' };

      const changes = HeaderComparator.compare(baseline, current, { ignoreHeaders: ['date'] });

      expect(changes).toEqual([]);
    });

    it('should ignore common volatile headers by default', () => {
      const baseline = {
        date: 'Mon, 01 Jan 2024 00:00:00 GMT',
        'x-request-id': 'abc123',
        'content-type': 'text/html',
      };
      const current = {
        date: 'Tue, 02 Jan 2024 00:00:00 GMT',
        'x-request-id': 'xyz789',
        'content-type': 'text/html',
      };

      const changes = HeaderComparator.compare(baseline, current);

      expect(changes).toEqual([]);
    });
  });

  describe('getSeverity', () => {
    it('should return CRITICAL for security headers removed', () => {
      expect(HeaderComparator.getSeverity('x-frame-options', 'DENY', null)).toBe(
        DiffSeverity.CRITICAL,
      );
      expect(HeaderComparator.getSeverity('content-security-policy', 'default-src', null)).toBe(
        DiffSeverity.CRITICAL,
      );
      expect(HeaderComparator.getSeverity('strict-transport-security', 'max-age=123', null)).toBe(
        DiffSeverity.CRITICAL,
      );
    });

    it('should return WARNING for content-type changes', () => {
      expect(HeaderComparator.getSeverity('content-type', 'text/html', 'application/json')).toBe(
        DiffSeverity.WARNING,
      );
    });

    it('should return WARNING for cache control changes', () => {
      expect(HeaderComparator.getSeverity('cache-control', 'max-age=3600', 'no-cache')).toBe(
        DiffSeverity.WARNING,
      );
    });

    it('should return INFO for custom header changes', () => {
      expect(HeaderComparator.getSeverity('x-custom', 'old', 'new')).toBe(DiffSeverity.INFO);
    });
  });

  describe('createDescription', () => {
    it('should create description for changed header', () => {
      const desc = HeaderComparator.createDescription('content-type', 'text/html', 'text/plain');
      expect(desc).toContain('content-type');
      expect(desc).toContain('changed');
    });

    it('should create description for removed header', () => {
      const desc = HeaderComparator.createDescription('x-custom', 'value', null);
      expect(desc).toContain('x-custom');
      expect(desc).toContain('removed');
    });

    it('should create description for added header', () => {
      const desc = HeaderComparator.createDescription('x-custom', null, 'value');
      expect(desc).toContain('x-custom');
      expect(desc).toContain('added');
    });
  });
});
