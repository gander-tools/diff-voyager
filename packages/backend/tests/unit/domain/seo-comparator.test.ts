/**
 * SEO Comparator unit tests
 */

import { DiffSeverity, DiffType } from '@gander-tools/diff-voyager-shared';
import { describe, expect, it } from 'vitest';
import * as SeoComparator from '../../../src/domain/seo-comparator.js';
import { createSeoData } from '../../helpers/factories.js';

describe('SeoComparator', () => {
  describe('compare', () => {
    it('should return empty array when SEO data is identical', () => {
      const baseline = createSeoData();
      const current = createSeoData();

      const changes = SeoComparator.compare(baseline, current);

      expect(changes).toEqual([]);
    });

    it('should detect title change', () => {
      const baseline = createSeoData({ title: 'Original Title' });
      const current = createSeoData({ title: 'Changed Title' });

      const changes = SeoComparator.compare(baseline, current);

      expect(changes).toHaveLength(1);
      expect(changes[0]).toMatchObject({
        type: DiffType.SEO,
        severity: DiffSeverity.CRITICAL,
        field: 'title',
        baselineValue: 'Original Title',
        currentValue: 'Changed Title',
      });
    });

    it('should detect title removed', () => {
      const baseline = createSeoData({ title: 'Original Title' });
      const current = createSeoData({ title: undefined });

      const changes = SeoComparator.compare(baseline, current);

      expect(changes).toHaveLength(1);
      expect(changes[0]).toMatchObject({
        type: DiffType.SEO,
        severity: DiffSeverity.CRITICAL,
        field: 'title',
        baselineValue: 'Original Title',
        currentValue: null,
      });
    });

    it('should detect title added', () => {
      const baseline = createSeoData({ title: undefined });
      const current = createSeoData({ title: 'New Title' });

      const changes = SeoComparator.compare(baseline, current);

      expect(changes).toHaveLength(1);
      expect(changes[0]).toMatchObject({
        type: DiffType.SEO,
        severity: DiffSeverity.INFO,
        field: 'title',
        baselineValue: null,
        currentValue: 'New Title',
      });
    });

    it('should detect meta description change', () => {
      const baseline = createSeoData({ metaDescription: 'Original description' });
      const current = createSeoData({ metaDescription: 'Changed description' });

      const changes = SeoComparator.compare(baseline, current);

      expect(changes).toHaveLength(1);
      expect(changes[0]).toMatchObject({
        type: DiffType.SEO,
        severity: DiffSeverity.WARNING,
        field: 'metaDescription',
        baselineValue: 'Original description',
        currentValue: 'Changed description',
      });
    });

    it('should detect canonical URL change', () => {
      const baseline = createSeoData({ canonical: 'https://example.com/page' });
      const current = createSeoData({ canonical: 'https://example.com/new-page' });

      const changes = SeoComparator.compare(baseline, current);

      expect(changes).toHaveLength(1);
      expect(changes[0]).toMatchObject({
        type: DiffType.SEO,
        severity: DiffSeverity.CRITICAL,
        field: 'canonical',
        baselineValue: 'https://example.com/page',
        currentValue: 'https://example.com/new-page',
      });
    });

    it('should detect robots directive change', () => {
      const baseline = createSeoData({ robots: 'index, follow' });
      const current = createSeoData({ robots: 'noindex, nofollow' });

      const changes = SeoComparator.compare(baseline, current);

      expect(changes).toHaveLength(1);
      expect(changes[0]).toMatchObject({
        type: DiffType.SEO,
        severity: DiffSeverity.CRITICAL,
        field: 'robots',
        baselineValue: 'index, follow',
        currentValue: 'noindex, nofollow',
      });
    });

    it('should detect H1 change', () => {
      const baseline = createSeoData({ h1: ['Original Heading'] });
      const current = createSeoData({ h1: ['Changed Heading'] });

      const changes = SeoComparator.compare(baseline, current);

      expect(changes).toHaveLength(1);
      expect(changes[0]).toMatchObject({
        type: DiffType.SEO,
        severity: DiffSeverity.WARNING,
        field: 'h1',
        baselineValue: ['Original Heading'],
        currentValue: ['Changed Heading'],
      });
    });

    it('should detect H1 removed', () => {
      const baseline = createSeoData({ h1: ['Main Heading'] });
      const current = createSeoData({ h1: [] });

      const changes = SeoComparator.compare(baseline, current);

      expect(changes).toHaveLength(1);
      expect(changes[0]).toMatchObject({
        type: DiffType.SEO,
        severity: DiffSeverity.CRITICAL,
        field: 'h1',
        baselineValue: ['Main Heading'],
        currentValue: [],
      });
    });

    it('should detect multiple H1 added', () => {
      const baseline = createSeoData({ h1: ['Single Heading'] });
      const current = createSeoData({ h1: ['First Heading', 'Second Heading'] });

      const changes = SeoComparator.compare(baseline, current);

      expect(changes).toHaveLength(1);
      expect(changes[0]).toMatchObject({
        type: DiffType.SEO,
        severity: DiffSeverity.WARNING,
        field: 'h1',
      });
    });

    it('should detect lang attribute change', () => {
      const baseline = createSeoData({ lang: 'en' });
      const current = createSeoData({ lang: 'de' });

      const changes = SeoComparator.compare(baseline, current);

      expect(changes).toHaveLength(1);
      expect(changes[0]).toMatchObject({
        type: DiffType.SEO,
        severity: DiffSeverity.WARNING,
        field: 'lang',
        baselineValue: 'en',
        currentValue: 'de',
      });
    });

    it('should detect multiple changes at once', () => {
      const baseline = createSeoData({
        title: 'Original Title',
        metaDescription: 'Original description',
        robots: 'index, follow',
      });
      const current = createSeoData({
        title: 'Changed Title',
        metaDescription: 'Changed description',
        robots: 'noindex',
      });

      const changes = SeoComparator.compare(baseline, current);

      expect(changes).toHaveLength(3);
      expect(changes.map((c) => c.field)).toContain('title');
      expect(changes.map((c) => c.field)).toContain('metaDescription');
      expect(changes.map((c) => c.field)).toContain('robots');
    });

    it('should handle undefined baseline SEO data', () => {
      const current = createSeoData({ title: 'New Page' });

      const changes = SeoComparator.compare(undefined, current);

      expect(changes.length).toBeGreaterThan(0);
    });

    it('should handle undefined current SEO data', () => {
      const baseline = createSeoData({ title: 'Original Page' });

      const changes = SeoComparator.compare(baseline, undefined);

      expect(changes.length).toBeGreaterThan(0);
    });

    it('should handle both undefined', () => {
      const changes = SeoComparator.compare(undefined, undefined);

      expect(changes).toEqual([]);
    });
  });

  describe('getSeverity', () => {
    it('should return CRITICAL for title', () => {
      expect(SeoComparator.getSeverity('title', 'Old', 'New')).toBe(DiffSeverity.CRITICAL);
    });

    it('should return CRITICAL for canonical', () => {
      expect(SeoComparator.getSeverity('canonical', 'old-url', 'new-url')).toBe(
        DiffSeverity.CRITICAL,
      );
    });

    it('should return CRITICAL for robots with noindex', () => {
      expect(SeoComparator.getSeverity('robots', 'index, follow', 'noindex')).toBe(
        DiffSeverity.CRITICAL,
      );
    });

    it('should return WARNING for meta description', () => {
      expect(SeoComparator.getSeverity('metaDescription', 'old', 'new')).toBe(DiffSeverity.WARNING);
    });

    it('should return WARNING for h1 change', () => {
      expect(SeoComparator.getSeverity('h1', ['old'], ['new'])).toBe(DiffSeverity.WARNING);
    });

    it('should return CRITICAL for h1 removal', () => {
      expect(SeoComparator.getSeverity('h1', ['heading'], [])).toBe(DiffSeverity.CRITICAL);
    });

    it('should return INFO for unknown fields', () => {
      expect(SeoComparator.getSeverity('unknown', 'old', 'new')).toBe(DiffSeverity.INFO);
    });
  });

  describe('createDescription', () => {
    it('should create description for changed value', () => {
      const desc = SeoComparator.createDescription('title', 'Old Title', 'New Title');
      expect(desc).toBe('Title changed from "Old Title" to "New Title"');
    });

    it('should create description for removed value', () => {
      const desc = SeoComparator.createDescription('title', 'Old Title', null);
      expect(desc).toBe('Title removed (was "Old Title")');
    });

    it('should create description for added value', () => {
      const desc = SeoComparator.createDescription('title', null, 'New Title');
      expect(desc).toBe('Title added: "New Title"');
    });

    it('should create description for H1 array change', () => {
      const desc = SeoComparator.createDescription('h1', ['Old'], ['New1', 'New2']);
      expect(desc).toContain('H1');
    });
  });
});
