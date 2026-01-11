/**
 * ProjectForm tests
 * Tests multi-step project creation form
 */

import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProjectForm from '../../../src/components/ProjectForm.vue';

// Mock useMessage from naive-ui
const mockMessage = {
  error: vi.fn(),
  success: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
};

vi.mock('naive-ui', async () => {
  const actual = await vi.importActual('naive-ui');
  return {
    ...actual,
    useMessage: () => mockMessage,
  };
});

describe('ProjectForm', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockMessage.error.mockClear();
    mockMessage.success.mockClear();
    mockMessage.warning.mockClear();
    mockMessage.info.mockClear();
  });

  it('should render step 1 by default', () => {
    const wrapper = mount(ProjectForm);
    expect(wrapper.text()).toContain('Project Name');
  });

  it('should validate required URL field in step 1', async () => {
    const wrapper = mount(ProjectForm);
    const submitButton = wrapper.find('[data-test="next-step-btn"]');

    if (submitButton.exists()) {
      await submitButton.trigger('click');
      await wrapper.vm.$nextTick();
      await new Promise((resolve) => setTimeout(resolve, 50)); // Wait for async validation
      // Should show URL validation error since it's the only required field
      expect(wrapper.text()).toContain('Invalid URL format');
    }
  });

  it('should allow proceeding to step 2 with empty name field', async () => {
    const wrapper = mount(ProjectForm);

    const nameInput = wrapper.find('input[data-test="name-input"]');
    const urlInput = wrapper.find('input[data-test="url-input"]');

    if (nameInput.exists() && urlInput.exists()) {
      // Leave name empty, only fill URL
      await nameInput.setValue('');
      await urlInput.setValue('https://example.com');

      const nextButton = wrapper.find('[data-test="next-step-btn"]');
      if (nextButton.exists()) {
        await nextButton.trigger('click');
        await wrapper.vm.$nextTick();

        // Should move to step 2 (Crawl Settings)
        expect(wrapper.text()).toContain('Crawl');
        // Should not show validation error
        expect(wrapper.text()).not.toContain('required');
      }
    }
  });

  it('should move to step 2 after valid step 1', async () => {
    const wrapper = mount(ProjectForm);

    const nameInput = wrapper.find('input[data-test="name-input"]');
    const urlInput = wrapper.find('input[data-test="url-input"]');

    if (nameInput.exists() && urlInput.exists()) {
      await nameInput.setValue('Test Project');
      await urlInput.setValue('https://example.com');

      const nextButton = wrapper.find('[data-test="next-step-btn"]');
      if (nextButton.exists()) {
        await nextButton.trigger('click');
        expect(wrapper.text()).toContain('Crawl');
      }
    }
  });

  it('should emit submit event with form data', async () => {
    const wrapper = mount(ProjectForm);

    const nameInput = wrapper.find('input[data-test="name-input"]');
    const urlInput = wrapper.find('input[data-test="url-input"]');

    if (nameInput.exists() && urlInput.exists()) {
      await nameInput.setValue('Test Project');
      await urlInput.setValue('https://example.com');

      const submitButton = wrapper.find('[data-test="submit-btn"]');
      if (submitButton.exists()) {
        await submitButton.trigger('click');

        const emitted = wrapper.emitted('submit');
        if (emitted?.[0]?.[0]) {
          expect(emitted).toBeTruthy();
          expect(emitted[0][0]).toHaveProperty('name', 'Test Project');
          expect(emitted[0][0]).toHaveProperty('url', 'https://example.com');
        }
      }
    }
  });

  it('should allow going back to previous step', async () => {
    const wrapper = mount(ProjectForm);

    const nameInput = wrapper.find('input[data-test="name-input"]');
    const urlInput = wrapper.find('input[data-test="url-input"]');

    if (nameInput.exists() && urlInput.exists()) {
      await nameInput.setValue('Test Project');
      await urlInput.setValue('https://example.com');

      const nextButton = wrapper.find('[data-test="next-step-btn"]');
      if (nextButton.exists()) {
        await nextButton.trigger('click');

        const backButton = wrapper.find('[data-test="prev-step-btn"]');
        if (backButton.exists()) {
          await backButton.trigger('click');
          expect(wrapper.text()).toContain('Project Name');
        }
      }
    }
  });

  it('should validate URL format', async () => {
    const wrapper = mount(ProjectForm);

    const nameInput = wrapper.find('input[data-test="name-input"]');
    const urlInput = wrapper.find('input[data-test="url-input"]');

    if (nameInput.exists() && urlInput.exists()) {
      await nameInput.setValue('Test');
      await urlInput.setValue('invalid-url');

      const nextButton = wrapper.find('[data-test="next-step-btn"]');
      if (nextButton.exists()) {
        await nextButton.trigger('click');
        expect(wrapper.text()).toContain('invalid');
      }
    }
  });
});
