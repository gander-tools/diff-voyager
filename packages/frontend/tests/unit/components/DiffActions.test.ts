/**
 * DiffActions tests
 * Tests diff action buttons for accept, mute, create rule, and undo operations
 */

import { DiffStatus } from '@gander-tools/diff-voyager-shared';
import { mount } from '@vue/test-utils';
import { NNotificationProvider } from 'naive-ui';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import DiffActions from '../../../src/components/diff/DiffActions.vue';

describe('DiffActions', () => {
  const mockChangeId = 'change-123';

  /**
   * Helper to mount component with required Naive UI providers
   */
  const mountWithProviders = (props: {
    changeId: string;
    currentStatus: DiffStatus;
    disabled?: boolean;
  }) => {
    return mount({
      setup() {
        return () =>
          h(NNotificationProvider, null, {
            default: () => h(DiffActions, props),
          });
      },
    });
  };

  describe('NEW status', () => {
    it('should render accept, mute, and create rule buttons', () => {
      const wrapper = mountWithProviders({
        changeId: mockChangeId,
        currentStatus: DiffStatus.NEW,
      });

      expect(wrapper.find('[data-test="accept-button"]').exists()).toBe(true);
      expect(wrapper.find('[data-test="mute-button"]').exists()).toBe(true);
      expect(wrapper.find('[data-test="create-rule-button"]').exists()).toBe(true);
      expect(wrapper.find('[data-test="undo-button"]').exists()).toBe(false);
    });

    it('should display button labels', () => {
      const wrapper = mountWithProviders({
        changeId: mockChangeId,
        currentStatus: DiffStatus.NEW,
      });

      expect(wrapper.text()).toContain('Accept');
      expect(wrapper.text()).toContain('Mute');
      expect(wrapper.text()).toContain('Create Rule');
    });
  });

  describe('ACCEPTED status', () => {
    it('should render only undo button', () => {
      const wrapper = mountWithProviders({
        changeId: mockChangeId,
        currentStatus: DiffStatus.ACCEPTED,
      });

      expect(wrapper.find('[data-test="accept-button"]').exists()).toBe(false);
      expect(wrapper.find('[data-test="mute-button"]').exists()).toBe(false);
      expect(wrapper.find('[data-test="create-rule-button"]').exists()).toBe(false);
      expect(wrapper.find('[data-test="undo-button"]').exists()).toBe(true);
    });

    it('should display undo button label', () => {
      const wrapper = mountWithProviders({
        changeId: mockChangeId,
        currentStatus: DiffStatus.ACCEPTED,
      });

      expect(wrapper.text()).toContain('Undo');
    });
  });

  describe('MUTED status', () => {
    it('should render only undo button', () => {
      const wrapper = mountWithProviders({
        changeId: mockChangeId,
        currentStatus: DiffStatus.MUTED,
      });

      expect(wrapper.find('[data-test="accept-button"]').exists()).toBe(false);
      expect(wrapper.find('[data-test="mute-button"]').exists()).toBe(false);
      expect(wrapper.find('[data-test="create-rule-button"]').exists()).toBe(false);
      expect(wrapper.find('[data-test="undo-button"]').exists()).toBe(true);
    });

    it('should display undo button for muted status', () => {
      const wrapper = mountWithProviders({
        changeId: mockChangeId,
        currentStatus: DiffStatus.MUTED,
      });

      expect(wrapper.text()).toContain('Undo');
    });
  });

  describe('Disabled state', () => {
    it('should disable all buttons when disabled prop is true', () => {
      const wrapper = mountWithProviders({
        changeId: mockChangeId,
        currentStatus: DiffStatus.NEW,
        disabled: true,
      });

      const acceptButton = wrapper.find('[data-test="accept-button"]');
      const muteButton = wrapper.find('[data-test="mute-button"]');
      const createRuleButton = wrapper.find('[data-test="create-rule-button"]');

      expect(acceptButton.attributes('disabled')).toBeDefined();
      expect(muteButton.attributes('disabled')).toBeDefined();
      expect(createRuleButton.attributes('disabled')).toBeDefined();
    });

    it('should not disable buttons when disabled prop is false', () => {
      const wrapper = mountWithProviders({
        changeId: mockChangeId,
        currentStatus: DiffStatus.NEW,
        disabled: false,
      });

      const acceptButton = wrapper.find('[data-test="accept-button"]');
      const muteButton = wrapper.find('[data-test="mute-button"]');
      const createRuleButton = wrapper.find('[data-test="create-rule-button"]');

      expect(acceptButton.attributes('disabled')).toBeUndefined();
      expect(muteButton.attributes('disabled')).toBeUndefined();
      expect(createRuleButton.attributes('disabled')).toBeUndefined();
    });

    it('should disable undo button when disabled prop is true for accepted status', () => {
      const wrapper = mountWithProviders({
        changeId: mockChangeId,
        currentStatus: DiffStatus.ACCEPTED,
        disabled: true,
      });

      const undoButton = wrapper.find('[data-test="undo-button"]');
      expect(undoButton.attributes('disabled')).toBeDefined();
    });
  });

  describe('Data attributes', () => {
    it('should have data-test attribute on container', () => {
      const wrapper = mountWithProviders({
        changeId: mockChangeId,
        currentStatus: DiffStatus.NEW,
      });

      const container = wrapper.find('[data-test="diff-actions"]');
      expect(container.exists()).toBe(true);
    });

    it('should have data-test attributes on all buttons for NEW status', () => {
      const wrapper = mountWithProviders({
        changeId: mockChangeId,
        currentStatus: DiffStatus.NEW,
      });

      expect(wrapper.find('[data-test="accept-button"]').exists()).toBe(true);
      expect(wrapper.find('[data-test="mute-button"]').exists()).toBe(true);
      expect(wrapper.find('[data-test="create-rule-button"]').exists()).toBe(true);
    });

    it('should have data-test attribute on undo button for ACCEPTED status', () => {
      const wrapper = mountWithProviders({
        changeId: mockChangeId,
        currentStatus: DiffStatus.ACCEPTED,
      });

      expect(wrapper.find('[data-test="undo-button"]').exists()).toBe(true);
    });
  });

  describe('Button visibility based on status', () => {
    it('should only show action buttons for NEW status', () => {
      const wrapper = mountWithProviders({
        changeId: mockChangeId,
        currentStatus: DiffStatus.NEW,
      });

      const html = wrapper.html();
      expect(html).toContain('Accept');
      expect(html).toContain('Mute');
      expect(html).toContain('Create Rule');
      expect(wrapper.find('[data-test="undo-button"]').exists()).toBe(false);
    });

    it('should only show undo button for ACCEPTED status', () => {
      const wrapper = mountWithProviders({
        changeId: mockChangeId,
        currentStatus: DiffStatus.ACCEPTED,
      });

      const html = wrapper.html();
      expect(html).toContain('Undo');
      expect(wrapper.find('[data-test="accept-button"]').exists()).toBe(false);
      expect(wrapper.find('[data-test="mute-button"]').exists()).toBe(false);
      expect(wrapper.find('[data-test="create-rule-button"]').exists()).toBe(false);
    });

    it('should only show undo button for MUTED status', () => {
      const wrapper = mountWithProviders({
        changeId: mockChangeId,
        currentStatus: DiffStatus.MUTED,
      });

      const html = wrapper.html();
      expect(html).toContain('Undo');
      expect(wrapper.find('[data-test="accept-button"]').exists()).toBe(false);
      expect(wrapper.find('[data-test="mute-button"]').exists()).toBe(false);
      expect(wrapper.find('[data-test="create-rule-button"]').exists()).toBe(false);
    });
  });
});
