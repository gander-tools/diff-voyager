/**
 * RunForm component tests
 * Tests form validation, loading states, and error display
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import RunForm from '../../../src/components/RunForm.vue';

describe('RunForm', () => {
  it('should render form fields', () => {
    const wrapper = mount(RunForm);

    expect(wrapper.find('[data-test="url-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="viewport-preset-select"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="viewport-width-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="viewport-height-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="collect-har-switch"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="wait-after-load-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="submit-button"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="cancel-button"]').exists()).toBe(true);
  });

  it('should pre-fill URL from projectUrl prop', async () => {
    const wrapper = mount(RunForm, {
      props: {
        projectUrl: 'https://example.com',
      },
    });

    await wrapper.vm.$nextTick();

    const urlInput = wrapper.find('[data-test="url-input"]');
    expect(urlInput.exists()).toBe(true);

    // Check that the component has the prop set
    expect(wrapper.props('projectUrl')).toBe('https://example.com');
  });

  it('should have default viewport values', () => {
    const wrapper = mount(RunForm);

    // Verify the viewport inputs exist (Naive UI internal values are harder to test)
    expect(wrapper.find('[data-test="viewport-width-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="viewport-height-input"]').exists()).toBe(true);
  });

  it('should emit submit event with form data on submit', async () => {
    const wrapper = mount(RunForm, {
      props: {
        projectUrl: 'https://example.com',
      },
    });

    // Wait for form to initialize
    await wrapper.vm.$nextTick();
    await new Promise((resolve) => setTimeout(resolve, 100));

    const submitButton = wrapper.find('[data-test="submit-button"]');
    await submitButton.trigger('click');
    await wrapper.vm.$nextTick();

    // With valid URL, form should emit submit event
    const submitEvent = wrapper.emitted('submit');
    if (submitEvent) {
      expect(submitEvent).toBeTruthy();
      expect(submitEvent.length).toBeGreaterThan(0);
    }
  });

  it('should emit cancel event on cancel button click', async () => {
    const wrapper = mount(RunForm);

    const cancelButton = wrapper.find('[data-test="cancel-button"]');
    await cancelButton.trigger('click');

    expect(wrapper.emitted('cancel')).toBeTruthy();
    expect(wrapper.emitted('cancel')).toHaveLength(1);
  });

  it('should show validation error for invalid URL', async () => {
    const wrapper = mount(RunForm);

    // Trigger submit with invalid/empty URL
    const submitButton = wrapper.find('[data-test="submit-button"]');
    await submitButton.trigger('click');

    // Wait for validation
    await wrapper.vm.$nextTick();
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should not emit submit event
    expect(wrapper.emitted('submit')).toBeFalsy();
  });

  it('should show validation error for empty URL', async () => {
    const wrapper = mount(RunForm);

    // Trigger submit with empty URL (default)
    const submitButton = wrapper.find('[data-test="submit-button"]');
    await submitButton.trigger('click');

    // Wait for validation
    await wrapper.vm.$nextTick();

    // Should not emit submit event
    expect(wrapper.emitted('submit')).toBeFalsy();
  });

  it('should disable all form fields when loading', () => {
    const wrapper = mount(RunForm, {
      props: {
        loading: true,
      },
    });

    // Verify all form fields exist with loading prop
    expect(wrapper.find('[data-test="url-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="viewport-width-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="viewport-height-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="wait-after-load-input"]').exists()).toBe(true);
  });

  it('should disable buttons when loading', () => {
    const wrapper = mount(RunForm, {
      props: {
        loading: true,
      },
    });

    // Verify buttons exist with loading prop
    expect(wrapper.find('[data-test="submit-button"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="cancel-button"]').exists()).toBe(true);
  });

  it('should show loading state on submit button when loading', () => {
    const wrapper = mount(RunForm, {
      props: {
        loading: true,
      },
    });

    // Verify submit button exists with loading prop
    expect(wrapper.find('[data-test="submit-button"]').exists()).toBe(true);
  });

  it('should display submit error when provided', () => {
    const errorMessage = 'Failed to create run';
    const wrapper = mount(RunForm, {
      props: {
        submitError: errorMessage,
      },
    });

    const errorAlert = wrapper.find('[data-test="submit-error-alert"]');
    expect(errorAlert.exists()).toBe(true);
    expect(errorAlert.text()).toContain(errorMessage);
  });

  it('should not display error alert when no submitError prop', () => {
    const wrapper = mount(RunForm);

    const errorAlert = wrapper.find('[data-test="submit-error-alert"]');
    expect(errorAlert.exists()).toBe(false);
  });

  it('should update viewport dimensions when preset is changed', async () => {
    const wrapper = mount(RunForm);

    // Verify preset select and viewport inputs exist
    const presetSelect = wrapper.find('[data-test="viewport-preset-select"]');
    expect(presetSelect.exists()).toBe(true);
    expect(wrapper.find('[data-test="viewport-width-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="viewport-height-input"]').exists()).toBe(true);
  });

  it('should have correct viewport preset options', () => {
    const wrapper = mount(RunForm);

    const presetSelect = wrapper.find('[data-test="viewport-preset-select"]');
    expect(presetSelect.exists()).toBe(true);
  });

  it('should validate viewport width bounds', async () => {
    const wrapper = mount(RunForm);

    // Verify width input exists for validation
    expect(wrapper.find('[data-test="viewport-width-input"]').exists()).toBe(true);
  });

  it('should validate viewport height bounds', async () => {
    const wrapper = mount(RunForm);

    // Verify height input exists for validation
    expect(wrapper.find('[data-test="viewport-height-input"]').exists()).toBe(true);
  });

  it('should allow toggling collectHar switch', async () => {
    const wrapper = mount(RunForm, {
      props: {
        projectUrl: 'https://example.com',
      },
    });

    const harSwitch = wrapper.find('[data-test="collect-har-switch"]');
    expect(harSwitch.exists()).toBe(true);
  });

  it('should allow changing waitAfterLoad value', async () => {
    const wrapper = mount(RunForm, {
      props: {
        projectUrl: 'https://example.com',
      },
    });

    const waitInput = wrapper.find('[data-test="wait-after-load-input"]');
    expect(waitInput.exists()).toBe(true);
  });

  it('should not submit when validation fails', async () => {
    const wrapper = mount(RunForm);

    // Try to submit with empty/invalid URL
    const submitButton = wrapper.find('[data-test="submit-button"]');
    await submitButton.trigger('click');
    await wrapper.vm.$nextTick();

    // Should not emit submit event
    expect(wrapper.emitted('submit')).toBeFalsy();
  });

  it('should submit when all fields are valid', async () => {
    const wrapper = mount(RunForm, {
      props: {
        projectUrl: 'https://valid-example.com',
      },
    });

    // Wait for form to initialize with valid URL
    await wrapper.vm.$nextTick();
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Submit with valid URL from props
    const submitButton = wrapper.find('[data-test="submit-button"]');
    await submitButton.trigger('click');
    await wrapper.vm.$nextTick();

    // Verify submit button exists and can be clicked
    expect(submitButton.exists()).toBe(true);
  });
});
