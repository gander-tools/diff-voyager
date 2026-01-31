/**
 * SeoDiffView tests
 * Tests SEO diff view component for displaying SEO changes
 */

import type { SeoChangeResponse } from '@gander-tools/diff-voyager-shared';
import { DiffSeverity } from '@gander-tools/diff-voyager-shared';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import SeoDiffView from '../../../src/components/SeoDiffView.vue';

describe('SeoDiffView', () => {
  const mockSeoChanges: SeoChangeResponse[] = [
    {
      field: 'title',
      severity: DiffSeverity.CRITICAL,
      baselineValue: 'Old Title',
      currentValue: 'New Title',
    },
    {
      field: 'metaDescription',
      severity: DiffSeverity.WARNING,
      baselineValue: 'Old description',
      currentValue: 'New description',
    },
    {
      field: 'canonical',
      severity: DiffSeverity.INFO,
      baselineValue: null,
      currentValue: 'https://example.com/page',
    },
  ];

  it('should render empty state when no changes', () => {
    const wrapper = mount(SeoDiffView, {
      props: { seoChanges: [] },
    });

    expect(wrapper.text()).toContain('No SEO changes detected');
  });

  it('should render SEO changes with card title by default', () => {
    const wrapper = mount(SeoDiffView, {
      props: { seoChanges: mockSeoChanges },
    });

    expect(wrapper.text()).toContain('SEO Changes');
    expect(wrapper.findAll('[data-test^="seo-change-"]')).toHaveLength(3);
  });

  it('should render SEO changes without card title when showTitle is false', () => {
    const wrapper = mount(SeoDiffView, {
      props: { seoChanges: mockSeoChanges, showTitle: false },
    });

    expect(wrapper.text()).not.toContain('SEO Changes');
    expect(wrapper.findAll('[data-test^="seo-change-"]')).toHaveLength(3);
  });

  it('should display field labels correctly', () => {
    const wrapper = mount(SeoDiffView, {
      props: { seoChanges: mockSeoChanges },
    });

    expect(wrapper.text()).toContain('Page Title');
    expect(wrapper.text()).toContain('Meta Description');
    expect(wrapper.text()).toContain('Canonical URL');
  });

  it('should display severity badges correctly', () => {
    const wrapper = mount(SeoDiffView, {
      props: { seoChanges: mockSeoChanges },
    });

    const severityBadges = wrapper.findAll('[data-test="severity-badge"]');
    expect(severityBadges).toHaveLength(3);
    expect(wrapper.text()).toContain('Critical');
    expect(wrapper.text()).toContain('Warning');
    expect(wrapper.text()).toContain('Info');
  });

  it('should display baseline and current values', () => {
    const wrapper = mount(SeoDiffView, {
      props: { seoChanges: mockSeoChanges },
    });

    expect(wrapper.text()).toContain('Old Title');
    expect(wrapper.text()).toContain('New Title');
    expect(wrapper.text()).toContain('Old description');
    expect(wrapper.text()).toContain('New description');
  });

  it('should format null values as "(not set)"', () => {
    const wrapper = mount(SeoDiffView, {
      props: { seoChanges: mockSeoChanges },
    });

    const baselineValues = wrapper.findAll('[data-test="baseline-value"]');
    const canonicalBaseline = baselineValues[2]; // Third change has null baseline
    if (canonicalBaseline) {
      expect(canonicalBaseline.text()).toContain('(not set)');
    }
  });

  it('should format empty string values as "(empty)"', () => {
    const changes: SeoChangeResponse[] = [
      {
        field: 'title',
        severity: DiffSeverity.INFO,
        baselineValue: '',
        currentValue: 'New Title',
      },
    ];

    const wrapper = mount(SeoDiffView, {
      props: { seoChanges: changes },
    });

    expect(wrapper.text()).toContain('(empty)');
  });

  it('should truncate long values', () => {
    const longValue = 'A'.repeat(150);
    const changes: SeoChangeResponse[] = [
      {
        field: 'metaDescription',
        severity: DiffSeverity.INFO,
        baselineValue: longValue,
        currentValue: 'Short',
      },
    ];

    const wrapper = mount(SeoDiffView, {
      props: { seoChanges: changes },
    });

    const baselineValue = wrapper.find('[data-test="baseline-value"]');
    expect(baselineValue.text()).toContain('...');
    expect(baselineValue.text().length).toBeLessThan(longValue.length);
  });

  it('should have data-test attribute', () => {
    const wrapper = mount(SeoDiffView, {
      props: { seoChanges: mockSeoChanges },
    });

    const component = wrapper.find('[data-test="seo-diff-view"]');
    expect(component.exists()).toBe(true);
  });

  it('should render Open Graph field labels correctly', () => {
    const changes: SeoChangeResponse[] = [
      {
        field: 'openGraph.title',
        severity: DiffSeverity.INFO,
        baselineValue: 'OG Old',
        currentValue: 'OG New',
      },
    ];

    const wrapper = mount(SeoDiffView, {
      props: { seoChanges: changes },
    });

    expect(wrapper.text()).toContain('OG: Title');
  });

  it('should render Twitter Card field labels correctly', () => {
    const changes: SeoChangeResponse[] = [
      {
        field: 'twitterCard.card',
        severity: DiffSeverity.INFO,
        baselineValue: 'summary',
        currentValue: 'summary_large_image',
      },
    ];

    const wrapper = mount(SeoDiffView, {
      props: { seoChanges: changes },
    });

    expect(wrapper.text()).toContain('Twitter: Card Type');
  });

  it('should handle unknown field names gracefully', () => {
    const changes: SeoChangeResponse[] = [
      {
        field: 'unknownField',
        severity: DiffSeverity.INFO,
        baselineValue: 'old',
        currentValue: 'new',
      },
    ];

    const wrapper = mount(SeoDiffView, {
      props: { seoChanges: changes },
    });

    expect(wrapper.text()).toContain('unknownField');
  });
});
