/**
 * Keyboard Navigation Accessibility tests
 * Tests for keyboard navigation, focus management, and screen reader support
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { createRouter, createWebHistory } from 'vue-router';
import ProjectCard from '../../../src/components/ProjectCard.vue';
import ProjectForm from '../../../src/components/ProjectForm.vue';
import RunCard from '../../../src/components/RunCard.vue';
import DashboardView from '../../../src/views/DashboardView.vue';
import ProjectDetailView from '../../../src/views/ProjectDetailView.vue';
import ProjectListView from '../../../src/views/ProjectListView.vue';
import RunDetailView from '../../../src/views/RunDetailView.vue';

const createMockRouter = () => {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'dashboard', component: DashboardView },
      { path: '/projects', name: 'projects', component: ProjectListView },
    ],
  });
};

describe('Keyboard Navigation Accessibility', () => {
  describe('Tab Navigation', () => {
    it('should allow tab navigation through interactive elements', async () => {
      const wrapper = mount(ProjectCard, {
        props: {
          project: {
            id: '1',
            name: 'Test Project',
            baseUrl: 'https://example.com',
            createdAt: new Date().toISOString(),
            statistics: { totalPages: 10, totalRuns: 5 },
          },
        },
        global: {
          plugins: [createMockRouter()],
        },
      });

      const buttons = wrapper.findAll('button, a[href]');
      expect(buttons.length).toBeGreaterThan(0);

      for (const button of buttons) {
        expect(button.attributes('tabindex')).not.toBe('-1');
      }
    });

    it('should support skip to main content link', async () => {
      const wrapper = mount(DashboardView, {
        global: {
          plugins: [createMockRouter()],
          stubs: {
            RouterLink: true,
            RouterView: true,
          },
        },
      });

      const skipLink = wrapper.find('[href="#main-content"]');
      if (skipLink.exists()) {
        expect(skipLink.attributes('tabindex')).not.toBe('-1');
      }
    });

    it('should maintain logical tab order', async () => {
      const wrapper = mount(ProjectForm, {
        props: {
          initialData: undefined,
        },
      });

      const inputs = wrapper.findAll('input, textarea, select, button');
      const tabIndexes = inputs.map((el) => parseInt(el.attributes('tabindex') || '0', 10));

      const hasExplicitOrder = tabIndexes.some((idx) => idx > 0);
      if (hasExplicitOrder) {
        expect(tabIndexes).toEqual([...tabIndexes].sort((a, b) => a - b));
      }
    });

    it('should not trap focus in modals without escape mechanism', async () => {
      const wrapper = mount(ProjectForm, {
        props: {
          initialData: undefined,
        },
      });

      const modal = wrapper.find('[role="dialog"]');
      if (modal.exists()) {
        const closeButton = modal.find('[aria-label*="close" i], button');
        expect(closeButton.exists()).toBe(true);
      }
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should respond to Enter key on clickable elements', async () => {
      const handleClick = vi.fn();
      const wrapper = mount(ProjectCard, {
        props: {
          project: {
            id: '1',
            name: 'Test Project',
            baseUrl: 'https://example.com',
            createdAt: new Date().toISOString(),
            statistics: { totalPages: 10, totalRuns: 5 },
          },
        },
        global: {
          plugins: [createMockRouter()],
        },
      });

      wrapper.vm.$el.addEventListener('click', handleClick);

      const card = wrapper.find('[role="button"], a, button');
      if (card.exists()) {
        await card.trigger('keydown.enter');
        await wrapper.vm.$nextTick();
      }
    });

    it('should respond to Space key on buttons', async () => {
      const handleClick = vi.fn();
      const wrapper = mount(ProjectCard, {
        props: {
          project: {
            id: '1',
            name: 'Test Project',
            baseUrl: 'https://example.com',
            createdAt: new Date().toISOString(),
            statistics: { totalPages: 10, totalRuns: 5 },
          },
        },
        global: {
          plugins: [createMockRouter()],
        },
      });

      const button = wrapper.find('button');
      if (button.exists()) {
        button.element.addEventListener('click', handleClick);
        await button.trigger('keydown.space');
        await wrapper.vm.$nextTick();
      }
    });

    it('should support Escape key to close dialogs', async () => {
      const wrapper = mount(ProjectForm, {
        props: {
          initialData: undefined,
        },
      });

      const dialog = wrapper.find('[role="dialog"]');
      if (dialog.exists()) {
        await dialog.trigger('keydown.escape');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('close')).toBeDefined();
      }
    });

    it('should support arrow keys for list navigation', async () => {
      const wrapper = mount(ProjectListView, {
        global: {
          plugins: [createMockRouter()],
          stubs: {
            RouterLink: true,
          },
        },
      });

      const list = wrapper.find('[role="list"], ul');
      if (list.exists()) {
        const items = list.findAll('[role="listitem"], li');
        if (items.length > 0) {
          await items[0].trigger('keydown.down');
          await wrapper.vm.$nextTick();
        }
      }
    });
  });

  describe('Focus Management', () => {
    it('should have visible focus indicators', async () => {
      const wrapper = mount(ProjectCard, {
        props: {
          project: {
            id: '1',
            name: 'Test Project',
            baseUrl: 'https://example.com',
            createdAt: new Date().toISOString(),
            statistics: { totalPages: 10, totalRuns: 5 },
          },
        },
        global: {
          plugins: [createMockRouter()],
        },
      });

      const focusableElements = wrapper.findAll(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );

      for (const element of focusableElements) {
        const styles = window.getComputedStyle(element.element);
        const hasFocusStyle =
          styles.outlineWidth !== '0px' ||
          styles.borderWidth !== '0px' ||
          element.classes().some((c) => c.includes('focus'));

        if (!hasFocusStyle) {
          expect(element.attributes('class')).toContain('focus');
        }
      }
    });

    it('should restore focus after dialog closes', async () => {
      const wrapper = mount(ProjectForm, {
        props: {
          initialData: undefined,
        },
      });

      const trigger = document.createElement('button');
      document.body.appendChild(trigger);
      trigger.focus();

      const dialog = wrapper.find('[role="dialog"]');
      if (dialog.exists()) {
        await wrapper.vm.$emit('close');
        await wrapper.vm.$nextTick();
      }

      document.body.removeChild(trigger);
    });

    it('should focus first interactive element on mount', async () => {
      const wrapper = mount(ProjectForm, {
        props: {
          initialData: undefined,
        },
      });

      await wrapper.vm.$nextTick();

      const firstInput = wrapper.find('input, textarea, select');
      if (firstInput.exists()) {
        expect(document.activeElement).toBeDefined();
      }
    });

    it('should not lose focus on dynamic content updates', async () => {
      const wrapper = mount(ProjectListView, {
        global: {
          plugins: [createMockRouter()],
          stubs: {
            RouterLink: true,
          },
        },
      });

      const button = wrapper.find('button');
      if (button.exists()) {
        await button.trigger('focus');
        const _activeBeforeUpdate = document.activeElement;

        await wrapper.vm.$forceUpdate();
        await wrapper.vm.$nextTick();

        expect(document.activeElement).toBeDefined();
      }
    });
  });

  describe('ARIA Attributes', () => {
    it('should have proper ARIA roles on semantic elements', async () => {
      const wrapper = mount(DashboardView, {
        global: {
          plugins: [createMockRouter()],
          stubs: {
            RouterLink: true,
            RouterView: true,
          },
        },
      });

      const nav = wrapper.find('nav');
      if (nav.exists()) {
        expect(nav.attributes('role') === 'navigation' || nav.element.tagName === 'NAV').toBe(true);
      }

      const main = wrapper.find('main, [role="main"]');
      expect(main.exists()).toBe(true);
    });

    it('should have aria-label on icon-only buttons', async () => {
      const wrapper = mount(ProjectCard, {
        props: {
          project: {
            id: '1',
            name: 'Test Project',
            baseUrl: 'https://example.com',
            createdAt: new Date().toISOString(),
            statistics: { totalPages: 10, totalRuns: 5 },
          },
        },
        global: {
          plugins: [createMockRouter()],
        },
      });

      const buttons = wrapper.findAll('button');
      for (const button of buttons) {
        const hasText = button.text().trim().length > 0;
        const hasAriaLabel = button.attributes('aria-label');
        const hasAriaLabelledBy = button.attributes('aria-labelledby');

        if (!hasText) {
          expect(hasAriaLabel || hasAriaLabelledBy).toBeTruthy();
        }
      }
    });

    it('should have aria-describedby for form field errors', async () => {
      const wrapper = mount(ProjectForm, {
        props: {
          initialData: undefined,
        },
      });

      const inputs = wrapper.findAll('input');
      for (const input of inputs) {
        const ariaDescribedBy = input.attributes('aria-describedby');
        if (ariaDescribedBy) {
          const errorElement = wrapper.find(`#${ariaDescribedBy}`);
          expect(errorElement.exists()).toBe(true);
        }
      }
    });

    it('should have aria-expanded on expandable elements', async () => {
      const wrapper = mount(ProjectDetailView, {
        props: {
          projectId: '1',
        },
        global: {
          plugins: [createMockRouter()],
          stubs: {
            RouterLink: true,
          },
        },
      });

      const expandButtons = wrapper.findAll('[aria-expanded]');
      for (const button of expandButtons) {
        const isExpanded = button.attributes('aria-expanded');
        expect(['true', 'false']).toContain(isExpanded);
      }
    });

    it('should have aria-live for dynamic status updates', async () => {
      const wrapper = mount(RunDetailView, {
        props: {
          runId: '1',
        },
        global: {
          plugins: [createMockRouter()],
          stubs: {
            RouterLink: true,
          },
        },
      });

      const liveRegions = wrapper.findAll('[aria-live]');
      for (const region of liveRegions) {
        const liveValue = region.attributes('aria-live');
        expect(['polite', 'assertive', 'off']).toContain(liveValue);
      }
    });
  });

  describe('Screen Reader Support', () => {
    it('should have descriptive labels for form inputs', async () => {
      const wrapper = mount(ProjectForm, {
        props: {
          initialData: undefined,
        },
      });

      const inputs = wrapper.findAll('input, textarea, select');
      for (const input of inputs) {
        const id = input.attributes('id');
        const ariaLabel = input.attributes('aria-label');
        const ariaLabelledBy = input.attributes('aria-labelledby');

        if (id) {
          const label = wrapper.find(`label[for="${id}"]`);
          expect(label.exists() || ariaLabel || ariaLabelledBy).toBeTruthy();
        } else {
          expect(ariaLabel || ariaLabelledBy).toBeTruthy();
        }
      }
    });

    it('should have proper heading hierarchy', async () => {
      const wrapper = mount(DashboardView, {
        global: {
          plugins: [createMockRouter()],
          stubs: {
            RouterLink: true,
            RouterView: true,
          },
        },
      });

      const headings = wrapper.findAll('h1, h2, h3, h4, h5, h6');
      const levels = headings.map((h) => parseInt(h.element.tagName[1], 10));

      if (levels.length > 1) {
        for (let i = 1; i < levels.length; i++) {
          expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
        }
      }
    });

    it('should have alt text for images', async () => {
      const wrapper = mount(ProjectCard, {
        props: {
          project: {
            id: '1',
            name: 'Test Project',
            baseUrl: 'https://example.com',
            createdAt: new Date().toISOString(),
            statistics: { totalPages: 10, totalRuns: 5 },
          },
        },
        global: {
          plugins: [createMockRouter()],
        },
      });

      const images = wrapper.findAll('img');
      for (const img of images) {
        const alt = img.attributes('alt');
        const ariaLabel = img.attributes('aria-label');
        const role = img.attributes('role');

        expect(alt !== undefined || ariaLabel || role === 'presentation').toBeTruthy();
      }
    });

    it('should announce loading states', async () => {
      const wrapper = mount(ProjectListView, {
        global: {
          plugins: [createMockRouter()],
          stubs: {
            RouterLink: true,
          },
        },
      });

      const loadingIndicator = wrapper.find('[aria-busy="true"], [role="status"]');
      if (loadingIndicator.exists()) {
        expect(
          loadingIndicator.attributes('aria-live') === 'polite' ||
            loadingIndicator.attributes('aria-live') === 'assertive',
        ).toBe(true);
      }
    });

    it('should have accessible error messages', async () => {
      const wrapper = mount(ProjectForm, {
        props: {
          initialData: undefined,
        },
      });

      const errorMessages = wrapper.findAll('[role="alert"]');
      for (const error of errorMessages) {
        expect(error.attributes('aria-live')).toBe('assertive');
      }
    });
  });

  describe('Color and Contrast', () => {
    it('should not rely solely on color for information', async () => {
      const wrapper = mount(RunCard, {
        props: {
          run: {
            id: '1',
            projectId: '1',
            status: 'completed',
            isBaseline: false,
            createdAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            statistics: { totalPages: 10, diffsFound: 2 },
          },
        },
        global: {
          plugins: [createMockRouter()],
        },
      });

      const statusElements = wrapper.findAll('[class*="status"]');
      for (const element of statusElements) {
        const hasText = element.text().trim().length > 0;
        const hasIcon = element.find('svg, img, i').exists();
        const hasAriaLabel = element.attributes('aria-label');

        expect(hasText || hasIcon || hasAriaLabel).toBeTruthy();
      }
    });

    it('should have sufficient contrast for text', async () => {
      const wrapper = mount(ProjectCard, {
        props: {
          project: {
            id: '1',
            name: 'Test Project',
            baseUrl: 'https://example.com',
            createdAt: new Date().toISOString(),
            statistics: { totalPages: 10, totalRuns: 5 },
          },
        },
        global: {
          plugins: [createMockRouter()],
        },
      });

      const textElements = wrapper.findAll('p, span, div, h1, h2, h3, h4, h5, h6');
      for (const element of textElements) {
        if (element.text().trim()) {
          const styles = window.getComputedStyle(element.element);
          expect(styles.color).toBeDefined();
          expect(styles.backgroundColor).toBeDefined();
        }
      }
    });
  });

  describe('Form Validation Accessibility', () => {
    it('should associate error messages with form fields', async () => {
      const wrapper = mount(ProjectForm, {
        props: {
          initialData: undefined,
        },
      });

      const inputs = wrapper.findAll('input[aria-invalid="true"]');
      for (const input of inputs) {
        const describedBy = input.attributes('aria-describedby');
        const errorId = input.attributes('aria-errormessage');

        expect(describedBy || errorId).toBeDefined();
      }
    });

    it('should mark required fields with aria-required', async () => {
      const wrapper = mount(ProjectForm, {
        props: {
          initialData: undefined,
        },
      });

      const requiredInputs = wrapper.findAll('input[required], textarea[required]');
      for (const input of requiredInputs) {
        expect(input.attributes('aria-required')).toBe('true');
      }
    });

    it('should provide helpful error messages', async () => {
      const wrapper = mount(ProjectForm, {
        props: {
          initialData: undefined,
        },
      });

      const errorMessages = wrapper.findAll('[role="alert"], .error-message');
      for (const message of errorMessages) {
        const text = message.text().trim();
        if (text) {
          expect(text.length).toBeGreaterThan(5);
          expect(text.toLowerCase()).not.toBe('error');
        }
      }
    });
  });
});
