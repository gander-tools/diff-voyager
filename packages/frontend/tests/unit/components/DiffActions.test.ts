/**
 * DiffActions tests
 * Tests diff action buttons for accept, mute, create rule, and undo operations
 */

import { DiffStatus } from '@gander-tools/diff-voyager-shared';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import DiffActions from '../../../src/components/diff/DiffActions.vue';

describe('DiffActions', () => {
  const mockChangeId = 'change-123';

  describe('NEW status', () => {
    it('should render accept, mute, and create rule buttons', () => {
      const wrapper = mount(DiffActions, {
        props: {
          changeId: mockChangeId,
          currentStatus: DiffStatus.NEW,
        },
      });

      expect(wrapper.find('[data-test="accept-button"]').exists()).toBe(true);
      expect(wrapper.find('[data-test="mute-button"]').exists()).toBe(true);
      expect(wrapper.find('[data-test="create-rule-button"]').exists()).toBe(true);
      expect(wrapper.find('[data-test="undo-button"]').exists()).toBe(false);
    });

    it('should display button labels', () => {
      const wrapper = mount(DiffActions, {
        props: {
          changeId: mockChangeId,
          currentStatus: DiffStatus.NEW,
        },
      });

      expect(wrapper.text()).toContain('Accept');
      expect(wrapper.text()).toContain('Mute');
      expect(wrapper.text()).toContain('Create Rule');
    });
  });

  describe('ACCEPTED status', () => {
    it('should render only undo button', () => {
      const wrapper = mount(DiffActions, {
        props: {
          changeId: mockChangeId,
          currentStatus: DiffStatus.ACCEPTED,
        },
      });

      expect(wrapper.find('[data-test="accept-button"]').exists()).toBe(false);
      expect(wrapper.find('[data-test="mute-button"]').exists()).toBe(false);
      expect(wrapper.find('[data-test="create-rule-button"]').exists()).toBe(false);
      expect(wrapper.find('[data-test="undo-button"]').exists()).toBe(true);
    });

    it('should display undo button label', () => {
      const wrapper = mount(DiffActions, {
        props: {
          changeId: mockChangeId,
          currentStatus: DiffStatus.ACCEPTED,
        },
      });

      expect(wrapper.text()).toContain('Undo');
    });
  });

  describe('MUTED status', () => {
    it('should render only undo button', () => {
      const wrapper = mount(DiffActions, {
        props: {
          changeId: mockChangeId,
          currentStatus: DiffStatus.MUTED,
        },
      });

      expect(wrapper.find('[data-test="accept-button"]').exists()).toBe(false);
      expect(wrapper.find('[data-test="mute-button"]').exists()).toBe(false);
      expect(wrapper.find('[data-test="create-rule-button"]').exists()).toBe(false);
      expect(wrapper.find('[data-test="undo-button"]').exists()).toBe(true);
    });
  });

  describe('Event emissions', () => {
    it('should emit accept event when accept is confirmed', async () => {
      const wrapper = mount(DiffActions, {
        props: {
          changeId: mockChangeId,
          currentStatus: DiffStatus.NEW,
        },
      });

      // Find the NPopconfirm component and trigger positive click
      const popconfirm = wrapper.findComponent({ name: 'NPopconfirm' });
      await popconfirm.vm.$emit('positive-click');

      expect(wrapper.emitted('accept')).toBeTruthy();
      expect(wrapper.emitted('accept')?.[0]).toEqual([mockChangeId]);
    });

    it('should emit mute event when mute is confirmed', async () => {
      const wrapper = mount(DiffActions, {
        props: {
          changeId: mockChangeId,
          currentStatus: DiffStatus.NEW,
        },
      });

      // Find the second NPopconfirm (mute button)
      const popconfirms = wrapper.findAllComponents({ name: 'NPopconfirm' });
      await popconfirms[1].vm.$emit('positive-click');

      expect(wrapper.emitted('mute')).toBeTruthy();
      expect(wrapper.emitted('mute')?.[0]).toEqual([mockChangeId]);
    });

    it('should emit createMuteRule event when create rule is confirmed', async () => {
      const wrapper = mount(DiffActions, {
        props: {
          changeId: mockChangeId,
          currentStatus: DiffStatus.NEW,
        },
      });

      // Find the third NPopconfirm (create rule button)
      const popconfirms = wrapper.findAllComponents({ name: 'NPopconfirm' });
      await popconfirms[2].vm.$emit('positive-click');

      expect(wrapper.emitted('createMuteRule')).toBeTruthy();
      expect(wrapper.emitted('createMuteRule')?.[0]).toEqual([mockChangeId]);
    });

    it('should emit undo event when undo is confirmed', async () => {
      const wrapper = mount(DiffActions, {
        props: {
          changeId: mockChangeId,
          currentStatus: DiffStatus.ACCEPTED,
        },
      });

      // Find the NPopconfirm for undo button
      const popconfirm = wrapper.findComponent({ name: 'NPopconfirm' });
      await popconfirm.vm.$emit('positive-click');

      expect(wrapper.emitted('undo')).toBeTruthy();
      expect(wrapper.emitted('undo')?.[0]).toEqual([mockChangeId]);
    });
  });

  describe('Disabled state', () => {
    it('should disable all buttons when disabled prop is true', () => {
      const wrapper = mount(DiffActions, {
        props: {
          changeId: mockChangeId,
          currentStatus: DiffStatus.NEW,
          disabled: true,
        },
      });

      const acceptButton = wrapper.find('[data-test="accept-button"]');
      const muteButton = wrapper.find('[data-test="mute-button"]');
      const createRuleButton = wrapper.find('[data-test="create-rule-button"]');

      expect(acceptButton.attributes('disabled')).toBeDefined();
      expect(muteButton.attributes('disabled')).toBeDefined();
      expect(createRuleButton.attributes('disabled')).toBeDefined();
    });

    it('should not disable buttons when disabled prop is false', () => {
      const wrapper = mount(DiffActions, {
        props: {
          changeId: mockChangeId,
          currentStatus: DiffStatus.NEW,
          disabled: false,
        },
      });

      const acceptButton = wrapper.find('[data-test="accept-button"]');
      const muteButton = wrapper.find('[data-test="mute-button"]');
      const createRuleButton = wrapper.find('[data-test="create-rule-button"]');

      expect(acceptButton.attributes('disabled')).toBeUndefined();
      expect(muteButton.attributes('disabled')).toBeUndefined();
      expect(createRuleButton.attributes('disabled')).toBeUndefined();
    });
  });

  describe('Data attributes', () => {
    it('should have data-test attribute on container', () => {
      const wrapper = mount(DiffActions, {
        props: {
          changeId: mockChangeId,
          currentStatus: DiffStatus.NEW,
        },
      });

      const container = wrapper.find('[data-test="diff-actions"]');
      expect(container.exists()).toBe(true);
    });
  });

  describe('Button types', () => {
    it('should render accept button with success type', () => {
      const wrapper = mount(DiffActions, {
        props: {
          changeId: mockChangeId,
          currentStatus: DiffStatus.NEW,
        },
      });

      const acceptButton = wrapper.find('[data-test="accept-button"]');
      expect(acceptButton.attributes('type')).toBe('success');
    });

    it('should render mute button with warning type', () => {
      const wrapper = mount(DiffActions, {
        props: {
          changeId: mockChangeId,
          currentStatus: DiffStatus.NEW,
        },
      });

      const muteButton = wrapper.find('[data-test="mute-button"]');
      expect(muteButton.attributes('type')).toBe('warning');
    });

    it('should render create rule button with primary type', () => {
      const wrapper = mount(DiffActions, {
        props: {
          changeId: mockChangeId,
          currentStatus: DiffStatus.NEW,
        },
      });

      const createRuleButton = wrapper.find('[data-test="create-rule-button"]');
      expect(createRuleButton.attributes('type')).toBe('primary');
    });

    it('should render undo button with default type', () => {
      const wrapper = mount(DiffActions, {
        props: {
          changeId: mockChangeId,
          currentStatus: DiffStatus.ACCEPTED,
        },
      });

      const undoButton = wrapper.find('[data-test="undo-button"]');
      expect(undoButton.attributes('type')).toBe('default');
    });
  });

  describe('Button sizes', () => {
    it('should render all buttons with small size', () => {
      const wrapper = mount(DiffActions, {
        props: {
          changeId: mockChangeId,
          currentStatus: DiffStatus.NEW,
        },
      });

      const acceptButton = wrapper.find('[data-test="accept-button"]');
      const muteButton = wrapper.find('[data-test="mute-button"]');
      const createRuleButton = wrapper.find('[data-test="create-rule-button"]');

      expect(acceptButton.attributes('size')).toBe('small');
      expect(muteButton.attributes('size')).toBe('small');
      expect(createRuleButton.attributes('size')).toBe('small');
    });
  });
});
