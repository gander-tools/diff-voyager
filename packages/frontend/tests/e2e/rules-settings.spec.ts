/**
 * E2E Tests for Rules and Settings (Issue #243)
 *
 * Tests the complete Rules and Settings workflow:
 * - Rules list view with empty state
 * - Rule creation form with validation
 * - Navigation between views
 * - Settings view with form fields
 * - Settings save and reset
 * - Form validation
 */

import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

// ============================================================================
// Test Data Fixtures
// ============================================================================

const mockSettings = {
  language: 'en',
  dataDirectory: '/path/to/data',
  defaultViewport: {
    width: 1920,
    height: 1080,
  },
  defaultVisualDiffThreshold: 0.01,
  defaultMaxPages: 100,
  defaultCollectHar: false,
  defaultWaitAfterLoad: 1000,
  theme: 'light',
  compactMode: false,
};

// ============================================================================
// Helper Functions
// ============================================================================

async function setupSettingsApiMocks(page: Page, settings = mockSettings) {
  // Settings store uses localStorage
  await page.addInitScript((settingsData) => {
    localStorage.setItem('settings', JSON.stringify(settingsData));
  }, settings);
}

// ============================================================================
// Test Suite: Rules List E2E
// ============================================================================

test.describe('Rules List E2E', () => {
  // ========================================================================
  // Test: Rules List View - Empty State
  // ========================================================================

  test('should display rules list with empty state', async ({ page }) => {
    await page.goto('/rules');

    // Verify page header
    await expect(page.locator('h1')).toHaveText('Mute Rules');
    await expect(page.locator('.subtitle')).toContainText(
      'Manage rules for ignoring specific differences',
    );

    // Verify action buttons
    await expect(page.locator('[data-test="new-rule-btn"]')).toBeVisible();

    // Verify filter exists
    await expect(page.locator('[data-test="scope-filter"]')).toBeVisible();

    // Verify empty state (since store starts empty)
    await expect(page.getByText(/No rules yet/i)).toBeVisible();
  });

  test('should show filter counts in empty state', async ({ page }) => {
    await page.goto('/rules');

    // Verify all filters show (0) in empty state
    await expect(page.locator('[data-test="filter-all"]')).toContainText('All (0)');
  });

  test('should navigate to create rule form', async ({ page }) => {
    await page.goto('/rules');

    // Click "New Rule" button
    await page.locator('[data-test="new-rule-btn"]').click();

    // Verify navigation
    await expect(page).toHaveURL('/rules/new');
    await expect(page.locator('h1')).toContainText('Create New Rule');
  });

  // ========================================================================
  // Test: Create Rule Form
  // ========================================================================

  test('should render rule creation form with all fields', async ({ page }) => {
    await page.goto('/rules/new');

    // Verify form header
    await expect(page.locator('h1')).toContainText('Create New Rule');
    await expect(page.getByText(/Define conditions to mute or accept differences/i)).toBeVisible();

    // Verify form fields exist
    await expect(page.locator('[data-test="name-input"]')).toBeVisible();
    await expect(page.locator('[data-test="description-input"]')).toBeVisible();
    await expect(page.locator('[data-test="scope-select"]')).toBeVisible();
    await expect(page.locator('[data-test="active-switch"]')).toBeVisible();

    // Verify condition builder exists
    await expect(page.locator('[data-test="cssSelector-input-0"]')).toBeVisible();

    // Verify action buttons
    await expect(page.locator('[data-test="submit-button"]')).toBeVisible();
    await expect(page.locator('[data-test="cancel-button"]')).toBeVisible();
    await expect(page.locator('[data-test="back-button"]')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/rules/new');

    // Clear name field and submit
    await page.locator('[data-test="name-input"]').clear();
    await page.locator('[data-test="submit-button"]').click();

    // Verify validation error appears
    await expect(page.getByText(/required/i)).toBeVisible();
  });

  test('should allow filling form with valid data', async ({ page }) => {
    await page.goto('/rules/new');

    // Fill in form
    await page.locator('[data-test="name-input"]').fill('Test Rule');
    await page.locator('[data-test="description-input"]').fill('Test description');

    // Select scope
    await page.locator('[data-test="scope-select"]').click();
    await page.getByText('Global', { exact: true }).click();

    // Fill in CSS selector
    await page.locator('[data-test="cssSelector-input-0"]').fill('.test-class');

    // Verify no validation errors
    await expect(page.getByText(/required/i)).not.toBeVisible();

    // Verify submit button is enabled
    await expect(page.locator('[data-test="submit-button"]')).toBeEnabled();
  });

  test('should cancel rule creation and return to list', async ({ page }) => {
    await page.goto('/rules/new');

    // Fill in some data
    await page.locator('[data-test="name-input"]').fill('Test Rule');

    // Click cancel button
    await page.locator('[data-test="cancel-button"]').click();

    // Verify returned to rules list
    await expect(page).toHaveURL('/rules');
    await expect(page.locator('h1')).toHaveText('Mute Rules');
  });

  test('should use back button to return to list', async ({ page }) => {
    await page.goto('/rules/new');

    // Click back button (in header)
    await page.locator('[data-test="back-button"]').click();

    // Verify returned to rules list
    await expect(page).toHaveURL('/rules');
  });

  // ========================================================================
  // Test: Complete Workflow
  // ========================================================================

  test('should complete full workflow: list → create → submit → back to list', async ({ page }) => {
    // Start at rules list
    await page.goto('/rules');
    await expect(page.locator('h1')).toHaveText('Mute Rules');

    // Navigate to create form
    await page.locator('[data-test="new-rule-btn"]').click();
    await expect(page).toHaveURL('/rules/new');

    // Fill and submit form
    await page.locator('[data-test="name-input"]').fill('E2E Test Rule');
    await page.locator('[data-test="description-input"]').fill('Created by E2E test');
    await page.locator('[data-test="scope-select"]').click();
    await page.getByText('Global', { exact: true }).click();
    await page.locator('[data-test="cssSelector-input-0"]').fill('.e2e-test');
    await page.locator('[data-test="submit-button"]').click();

    // Verify back at list
    await expect(page).toHaveURL('/rules');
    await expect(page.locator('h1')).toHaveText('Mute Rules');
  });
});

// ============================================================================
// Test Suite: Settings E2E
// ============================================================================

test.describe('Settings E2E', () => {
  // ========================================================================
  // Test: Settings View
  // ========================================================================

  test('should display settings form with all sections', async ({ page }) => {
    await setupSettingsApiMocks(page);
    await page.goto('/settings');

    // Verify page header
    await expect(page.locator('h1')).toHaveText(/Settings/i);

    // Verify sections exist
    await expect(page.getByText('General')).toBeVisible();
    await expect(page.getByText(/Default Scan Settings/i)).toBeVisible();
    await expect(page.getByText('Appearance')).toBeVisible();
  });

  test('should display all form fields', async ({ page }) => {
    await setupSettingsApiMocks(page);
    await page.goto('/settings');

    // Verify all form fields are visible
    await expect(page.locator('[data-test="language-select"]')).toBeVisible();
    await expect(page.locator('[data-test="data-directory-input"]')).toBeVisible();
    await expect(page.locator('[data-test="viewport-width-input"]')).toBeVisible();
    await expect(page.locator('[data-test="viewport-height-input"]')).toBeVisible();
    await expect(page.locator('[data-test="visual-threshold-input"]')).toBeVisible();
    await expect(page.locator('[data-test="max-pages-input"]')).toBeVisible();
    await expect(page.locator('[data-test="collect-har-switch"]')).toBeVisible();
    await expect(page.locator('[data-test="wait-after-load-input"]')).toBeVisible();
    await expect(page.locator('[data-test="theme-select"]')).toBeVisible();
    await expect(page.locator('[data-test="compact-mode-switch"]')).toBeVisible();

    // Verify action buttons
    await expect(page.locator('[data-test="save-button"]')).toBeVisible();
    await expect(page.locator('[data-test="reset-button"]')).toBeVisible();
  });

  test('should load saved settings from localStorage', async ({ page }) => {
    await setupSettingsApiMocks(page);
    await page.goto('/settings');

    // Wait for settings to load
    await page.waitForTimeout(500);

    // Verify viewport width has saved value
    const widthInput = page.locator('[data-test="viewport-width-input"]');
    await expect(widthInput).toHaveValue('1920');

    // Verify viewport height has saved value
    const heightInput = page.locator('[data-test="viewport-height-input"]');
    await expect(heightInput).toHaveValue('1080');
  });

  test('should change viewport using preset selector', async ({ page }) => {
    await setupSettingsApiMocks(page);
    await page.goto('/settings');

    // Wait for initial load
    await page.waitForTimeout(500);

    // Select a different viewport preset
    await page.locator('[data-test="viewport-preset-select"]').click();
    await page.getByText('Laptop (1366x768)').click();

    // Verify width and height updated
    await expect(page.locator('[data-test="viewport-width-input"]')).toHaveValue('1366');
    await expect(page.locator('[data-test="viewport-height-input"]')).toHaveValue('768');
  });

  test('should validate viewport width minimum value', async ({ page }) => {
    await setupSettingsApiMocks(page);
    await page.goto('/settings');

    // Wait for settings to load
    await page.waitForTimeout(500);

    // Enter invalid value (too small)
    await page.locator('[data-test="viewport-width-input"]').clear();
    await page.locator('[data-test="viewport-width-input"]').fill('100');
    await page.locator('[data-test="viewport-width-input"]').blur();

    // Verify validation error
    await expect(page.getByText(/at least 320/i)).toBeVisible();
  });

  test('should validate viewport width required', async ({ page }) => {
    await setupSettingsApiMocks(page);
    await page.goto('/settings');

    // Wait for settings to load
    await page.waitForTimeout(500);

    // Clear viewport width
    await page.locator('[data-test="viewport-width-input"]').clear();
    await page.locator('[data-test="viewport-width-input"]').blur();

    // Verify validation error
    await expect(page.getByText(/required/i)).toBeVisible();
  });

  test('should save settings successfully', async ({ page }) => {
    await setupSettingsApiMocks(page);
    await page.goto('/settings');

    // Wait for settings to load
    await page.waitForTimeout(500);

    // Change a setting
    await page.locator('[data-test="viewport-width-input"]').clear();
    await page.locator('[data-test="viewport-width-input"]').fill('1280');

    // Click save
    await page.locator('[data-test="save-button"]').click();

    // Verify success message appears
    await expect(page.getByText(/saved/i)).toBeVisible();
  });

  test('should reset settings to defaults', async ({ page }) => {
    await setupSettingsApiMocks(page, {
      ...mockSettings,
      defaultViewport: { width: 1280, height: 720 },
    });
    await page.goto('/settings');

    // Wait for settings to load with custom values
    await page.waitForTimeout(500);

    // Verify custom value
    await expect(page.locator('[data-test="viewport-width-input"]')).toHaveValue('1280');

    // Click reset
    await page.locator('[data-test="reset-button"]').click();

    // Verify reset to defaults (1920x1080)
    await expect(page.locator('[data-test="viewport-width-input"]')).toHaveValue('1920');
    await expect(page.locator('[data-test="viewport-height-input"]')).toHaveValue('1080');

    // Verify success message
    await expect(page.getByText(/saved/i)).toBeVisible();
  });

  test('should toggle theme setting', async ({ page }) => {
    await setupSettingsApiMocks(page);
    await page.goto('/settings');

    // Wait for initial load
    await page.waitForTimeout(500);

    // Click theme select
    await page.locator('[data-test="theme-select"]').click();

    // Select dark theme
    await page.getByText('Dark', { exact: true }).click();

    // Save settings
    await page.locator('[data-test="save-button"]').click();

    // Verify success
    await expect(page.getByText(/saved/i)).toBeVisible();
  });

  test('should toggle compact mode switch', async ({ page }) => {
    await setupSettingsApiMocks(page);
    await page.goto('/settings');

    // Wait for initial load
    await page.waitForTimeout(500);

    // Find and click compact mode switch
    const compactSwitch = page.locator('[data-test="compact-mode-switch"]');
    await compactSwitch.click();

    // Save settings
    await page.locator('[data-test="save-button"]').click();

    // Verify success
    await expect(page.getByText(/saved/i)).toBeVisible();
  });

  test('should toggle collect HAR setting', async ({ page }) => {
    await setupSettingsApiMocks(page);
    await page.goto('/settings');

    // Wait for initial load
    await page.waitForTimeout(500);

    // Find and click HAR switch
    const harSwitch = page.locator('[data-test="collect-har-switch"]');
    await harSwitch.click();

    // Save settings
    await page.locator('[data-test="save-button"]').click();

    // Verify success
    await expect(page.getByText(/saved/i)).toBeVisible();
  });
});

// ============================================================================
// Test Suite: Navigation E2E
// ============================================================================

test.describe('Navigation E2E', () => {
  test('should support direct URL access to rules list', async ({ page }) => {
    await page.goto('/rules');

    await expect(page.locator('h1')).toHaveText('Mute Rules');
  });

  test('should support direct URL access to create rule', async ({ page }) => {
    await page.goto('/rules/new');

    await expect(page.locator('h1')).toContainText('Create New Rule');
  });

  test('should support direct URL access to settings', async ({ page }) => {
    await setupSettingsApiMocks(page);
    await page.goto('/settings');

    await expect(page.locator('h1')).toHaveText(/Settings/i);
  });

  test('should support browser back button from create to list', async ({ page }) => {
    // Start at rules list
    await page.goto('/rules');

    // Navigate to create form
    await page.locator('[data-test="new-rule-btn"]').click();
    await expect(page).toHaveURL('/rules/new');

    // Use browser back button
    await page.goBack();

    // Verify returned to rules list
    await expect(page).toHaveURL('/rules');
    await expect(page.locator('h1')).toHaveText('Mute Rules');
  });
});

// ============================================================================
// Test Suite: Error Handling E2E
// ============================================================================

test.describe('Error Handling E2E', () => {
  test('should handle empty rules list gracefully', async ({ page }) => {
    await page.goto('/rules');

    // Should show empty state, not error
    await expect(page.getByText(/No rules yet/i)).toBeVisible();
    await expect(page.getByText(/error/i)).not.toBeVisible();
  });

  test('should handle rule creation validation errors', async ({ page }) => {
    await page.goto('/rules/new');

    // Clear name and try to submit
    await page.locator('[data-test="name-input"]').clear();
    await page.locator('[data-test="submit-button"]').click();

    // Should show validation errors
    await expect(page.getByText(/required/i)).toBeVisible();

    // Form should still be visible (not crash)
    await expect(page.locator('[data-test="name-input"]')).toBeVisible();
  });

  test('should handle settings validation errors gracefully', async ({ page }) => {
    await setupSettingsApiMocks(page);
    await page.goto('/settings');

    // Wait for initial load
    await page.waitForTimeout(500);

    // Enter invalid viewport width
    await page.locator('[data-test="viewport-width-input"]').clear();
    await page.locator('[data-test="viewport-width-input"]').fill('50');
    await page.locator('[data-test="viewport-width-input"]').blur();

    // Should show validation error
    await expect(page.getByText(/at least 320/i)).toBeVisible();

    // Save button should still be visible
    await expect(page.locator('[data-test="save-button"]')).toBeVisible();
  });

  test('should handle missing settings data gracefully', async ({ page }) => {
    // Don't set up settings mocks
    await page.goto('/settings');

    // Page should still load with default values
    await expect(page.locator('h1')).toHaveText(/Settings/i);
    await expect(page.locator('[data-test="save-button"]')).toBeVisible();
  });
});
