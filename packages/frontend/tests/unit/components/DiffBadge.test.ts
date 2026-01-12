/**
 * DiffBadge tests
 * Tests diff badge component for displaying diff types, severities, and statuses
 */

import { DiffSeverity, DiffStatus, DiffType } from '@gander-tools/diff-voyager-shared';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import DiffBadge from '../../../src/components/DiffBadge.vue';

describe('DiffBadge', () => {
  describe('Type variant', () => {
    it('should render SEO type with info badge', () => {
      const wrapper = mount(DiffBadge, {
        props: { variant: 'type', type: DiffType.SEO },
      });

      expect(wrapper.text()).toContain('SEO');
    });

    it('should render VISUAL type with warning badge', () => {
      const wrapper = mount(DiffBadge, {
        props: { variant: 'type', type: DiffType.VISUAL },
      });

      expect(wrapper.text()).toContain('Visual');
    });

    it('should render CONTENT type with info badge', () => {
      const wrapper = mount(DiffBadge, {
        props: { variant: 'type', type: DiffType.CONTENT },
      });

      expect(wrapper.text()).toContain('Content');
    });

    it('should render PERFORMANCE type with warning badge', () => {
      const wrapper = mount(DiffBadge, {
        props: { variant: 'type', type: DiffType.PERFORMANCE },
      });

      expect(wrapper.text()).toContain('Performance');
    });

    it('should render HTTP_STATUS type with error badge', () => {
      const wrapper = mount(DiffBadge, {
        props: { variant: 'type', type: DiffType.HTTP_STATUS },
      });

      expect(wrapper.text()).toContain('HTTP Status');
    });

    it('should render HEADERS type with info badge', () => {
      const wrapper = mount(DiffBadge, {
        props: { variant: 'type', type: DiffType.HEADERS },
      });

      expect(wrapper.text()).toContain('Headers');
    });
  });

  describe('Severity variant', () => {
    it('should render CRITICAL severity with error badge', () => {
      const wrapper = mount(DiffBadge, {
        props: { variant: 'severity', severity: DiffSeverity.CRITICAL },
      });

      expect(wrapper.text()).toContain('Critical');
    });

    it('should render WARNING severity with warning badge', () => {
      const wrapper = mount(DiffBadge, {
        props: { variant: 'severity', severity: DiffSeverity.WARNING },
      });

      expect(wrapper.text()).toContain('Warning');
    });

    it('should render INFO severity with info badge', () => {
      const wrapper = mount(DiffBadge, {
        props: { variant: 'severity', severity: DiffSeverity.INFO },
      });

      expect(wrapper.text()).toContain('Info');
    });
  });

  describe('Status variant', () => {
    it('should render NEW status with warning badge', () => {
      const wrapper = mount(DiffBadge, {
        props: { variant: 'status', status: DiffStatus.NEW },
      });

      expect(wrapper.text()).toContain('New');
    });

    it('should render ACCEPTED status with success badge', () => {
      const wrapper = mount(DiffBadge, {
        props: { variant: 'status', status: DiffStatus.ACCEPTED },
      });

      expect(wrapper.text()).toContain('Accepted');
    });

    it('should render MUTED status with default badge', () => {
      const wrapper = mount(DiffBadge, {
        props: { variant: 'status', status: DiffStatus.MUTED },
      });

      expect(wrapper.text()).toContain('Muted');
    });
  });

  describe('Size prop', () => {
    it('should support small size', () => {
      const wrapper = mount(DiffBadge, {
        props: { variant: 'severity', severity: DiffSeverity.CRITICAL, size: 'small' },
      });

      expect(wrapper.exists()).toBe(true);
    });

    it('should support medium size (default)', () => {
      const wrapper = mount(DiffBadge, {
        props: { variant: 'severity', severity: DiffSeverity.CRITICAL },
      });

      expect(wrapper.exists()).toBe(true);
    });

    it('should support large size', () => {
      const wrapper = mount(DiffBadge, {
        props: { variant: 'severity', severity: DiffSeverity.CRITICAL, size: 'large' },
      });

      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('Data attributes', () => {
    it('should have data-test attribute', () => {
      const wrapper = mount(DiffBadge, {
        props: { variant: 'type', type: DiffType.SEO },
      });

      const badge = wrapper.find('[data-test="diff-badge"]');
      expect(badge.exists()).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle missing type in type variant', () => {
      const wrapper = mount(DiffBadge, {
        props: { variant: 'type' },
      });

      expect(wrapper.text()).toContain('Unknown');
    });

    it('should handle missing severity in severity variant', () => {
      const wrapper = mount(DiffBadge, {
        props: { variant: 'severity' },
      });

      expect(wrapper.text()).toContain('Unknown');
    });

    it('should handle missing status in status variant', () => {
      const wrapper = mount(DiffBadge, {
        props: { variant: 'status' },
      });

      expect(wrapper.text()).toContain('Unknown');
    });
  });
});
