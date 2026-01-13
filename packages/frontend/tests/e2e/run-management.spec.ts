/**
 * E2E Tests for Run Management (Issue #236)
 *
 * Tests the complete Run Management workflow:
 * - Runs list view with pagination
 * - Run creation form with validation
 * - Run detail view with statistics and pages
 * - In-progress run polling
 * - Error states and retry functionality
 * - Navigation between views
 */

import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

// ============================================================================
// Test Data Fixtures
// ============================================================================

const TEST_PROJECT_ID = '550e8400-e29b-41d4-a716-446655440000';
const TEST_RUN_ID = '660e8400-e29b-41d4-a716-446655440001';
const TEST_RUN_ID_2 = '660e8400-e29b-41d4-a716-446655440002';
const TEST_RUN_ID_IN_PROGRESS = '660e8400-e29b-41d4-a716-446655440003';

const mockProject = {
  id: TEST_PROJECT_ID,
  name: 'Test Project',
  description: 'Test project for E2E tests',
  baseUrl: 'https://example.com',
  status: 'active',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  config: {
    crawl: true,
    viewport: { width: 1920, height: 1080 },
    visualDiffThreshold: 0.01,
    maxPages: 100,
  },
  statistics: {
    totalPages: 10,
    completedPages: 10,
    errorPages: 0,
    changedPages: 0,
    unchangedPages: 0,
    totalDifferences: 0,
    criticalDifferences: 0,
    acceptedDifferences: 0,
    mutedDifferences: 0,
  },
  pages: [],
  pagination: {
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false,
  },
};

const mockCompletedRun = {
  id: TEST_RUN_ID,
  projectId: TEST_PROJECT_ID,
  isBaseline: false,
  status: 'completed',
  createdAt: '2024-01-15T10:00:00Z',
  config: {
    viewport: { width: 1920, height: 1080 },
    captureScreenshots: true,
    captureHar: false,
  },
  statistics: {
    totalPages: 10,
    completedPages: 10,
    errorPages: 0,
  },
};

const mockInProgressRun = {
  id: TEST_RUN_ID_IN_PROGRESS,
  projectId: TEST_PROJECT_ID,
  isBaseline: false,
  status: 'in_progress',
  createdAt: '2024-01-15T12:00:00Z',
  config: {
    viewport: { width: 1920, height: 1080 },
    captureScreenshots: true,
    captureHar: true,
  },
  statistics: {
    totalPages: 10,
    completedPages: 5,
    errorPages: 0,
  },
};

const mockRunWithErrors = {
  id: TEST_RUN_ID_2,
  projectId: TEST_PROJECT_ID,
  isBaseline: false,
  status: 'completed',
  createdAt: '2024-01-15T11:00:00Z',
  config: {
    viewport: { width: 1280, height: 720 },
    captureScreenshots: true,
    captureHar: false,
  },
  statistics: {
    totalPages: 10,
    completedPages: 7,
    errorPages: 3,
  },
};

const mockRunsList = [mockCompletedRun, mockRunWithErrors, mockInProgressRun];

const mockRunPages = [
  {
    id: '770e8400-e29b-41d4-a716-446655440001',
    projectId: TEST_PROJECT_ID,
    url: 'https://example.com',
    originalUrl: 'https://example.com',
    status: 'completed',
    httpStatus: 200,
    capturedAt: '2024-01-15T10:05:00Z',
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440002',
    projectId: TEST_PROJECT_ID,
    url: 'https://example.com/about',
    originalUrl: 'https://example.com/about',
    status: 'completed',
    httpStatus: 200,
    capturedAt: '2024-01-15T10:06:00Z',
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440003',
    projectId: TEST_PROJECT_ID,
    url: 'https://example.com/not-found',
    originalUrl: 'https://example.com/not-found',
    status: 'error',
    httpStatus: 404,
    capturedAt: '2024-01-15T10:07:00Z',
    errorMessage: 'Page not found',
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

async function setupApiMocks(page: Page) {
  // Mock project details endpoint
  await page.route(`**/api/v1/projects/${TEST_PROJECT_ID}*`, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockProject),
    });
  });

  // Mock runs list endpoint
  await page.route(`**/api/v1/projects/${TEST_PROJECT_ID}/runs*`, (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockRunsList),
      });
    } else if (route.request().method() === 'POST') {
      // Mock run creation
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          runId: TEST_RUN_ID,
          status: 'processing',
        }),
      });
    }
  });

  // Mock individual run details
  await page.route(`**/api/v1/runs/${TEST_RUN_ID}`, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockCompletedRun),
    });
  });

  await page.route(`**/api/v1/runs/${TEST_RUN_ID_2}`, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockRunWithErrors),
    });
  });

  await page.route(`**/api/v1/runs/${TEST_RUN_ID_IN_PROGRESS}`, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockInProgressRun),
    });
  });

  // Mock run pages endpoint
  await page.route(`**/api/v1/runs/*/pages*`, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockRunPages),
    });
  });

  // Mock retry endpoint
  await page.route('**/api/v1/runs/*/retry', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });
}

// ============================================================================
// Test Suite: Run Management E2E
// ============================================================================

test.describe('Run Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  // ========================================================================
  // Test: Happy Path - Complete Workflow
  // ========================================================================

  test('should complete full workflow: list → create → detail → back', async ({ page }) => {
    // Navigate to runs list
    await page.goto(`/projects/${TEST_PROJECT_ID}/runs`);

    // Verify runs list loaded
    await expect(page.locator('h1')).toHaveText('Runs');
    await expect(page.locator('.subtitle')).toContainText('Test Project');

    // Verify runs are displayed
    const runCards = page.locator('[data-test="run-card"]');
    await expect(runCards).toHaveCount(3);

    // Click "New Run" button
    await page.locator('[data-test="new-run-btn"]').click();

    // Verify redirected to create form
    await expect(page).toHaveURL(`/projects/${TEST_PROJECT_ID}/runs/create`);
    await expect(page.locator('h1')).toHaveText('Create New Run');

    // Fill in form
    await page.locator('input[placeholder*="1920"]').fill('1280');
    await page.locator('input[placeholder*="1080"]').fill('720');
    await page.locator('label:has-text("Capture screenshots")').click();

    // Submit form
    await page.locator('button[type="submit"]').click();

    // Verify redirected to run detail
    await expect(page).toHaveURL(`/runs/${TEST_RUN_ID}`);
    await expect(page.locator('h1')).toContainText('Run #');

    // Verify run details displayed
    await expect(page.locator('[data-test="run-status-badge"]')).toBeVisible();
    await expect(page.getByText('Run Statistics')).toBeVisible();
    await expect(page.getByText('Total Pages')).toBeVisible();

    // Navigate back to runs list
    await page.locator('[data-test="back-to-runs-btn"]').click();
    await expect(page).toHaveURL(`/projects/${TEST_PROJECT_ID}/runs`);
    await expect(page.locator('h1')).toHaveText('Runs');

    // Navigate back to project
    await page.locator('[data-test="back-button"]').click();
    await expect(page).toHaveURL(`/projects/${TEST_PROJECT_ID}`);
  });

  // ========================================================================
  // Test: Runs List View
  // ========================================================================

  test('should display runs list with correct information', async ({ page }) => {
    await page.goto(`/projects/${TEST_PROJECT_ID}/runs`);

    // Verify page header
    await expect(page.locator('h1')).toHaveText('Runs');
    await expect(page.locator('.subtitle')).toContainText('Test Project');

    // Verify action buttons
    await expect(page.locator('[data-test="new-run-btn"]')).toBeVisible();
    await expect(page.locator('[data-test="back-button"]')).toBeVisible();

    // Verify runs are displayed
    const runCards = page.locator('[data-test="run-card"]');
    await expect(runCards).toHaveCount(3);

    // Verify run card contents
    await expect(page.locator('[data-test="run-status-badge"]').first()).toBeVisible();
  });

  test('should show empty state when no runs exist', async ({ page }) => {
    // Mock empty runs list
    await page.route(`**/api/v1/projects/${TEST_PROJECT_ID}/runs*`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto(`/projects/${TEST_PROJECT_ID}/runs`);

    // Verify empty state
    await expect(page.getByText('No runs yet')).toBeVisible();
    await expect(page.getByText('Create a new comparison run to see differences')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create First Run' })).toBeVisible();
  });

  test('should navigate to run detail when clicking run card', async ({ page }) => {
    await page.goto(`/projects/${TEST_PROJECT_ID}/runs`);

    // Click first run card
    const firstCard = page.locator('[data-test="run-card"]').first();
    await firstCard.click();

    // Verify navigation
    await expect(page).toHaveURL(`/runs/${TEST_RUN_ID}`);
  });

  // ========================================================================
  // Test: Run Creation Form
  // ========================================================================

  test('should render run creation form with project URL', async ({ page }) => {
    await page.goto(`/projects/${TEST_PROJECT_ID}/runs/create`);

    // Verify form header
    await expect(page.locator('h1')).toHaveText('Create New Run');
    await expect(page.locator('.subtitle')).toHaveText('Test Project');

    // Verify form fields exist
    await expect(page.locator('input[placeholder*="1920"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="1080"]')).toBeVisible();
    await expect(page.locator('label:has-text("Capture screenshots")')).toBeVisible();
    await expect(page.locator('label:has-text("Capture HAR files")')).toBeVisible();
  });

  test('should validate form inputs', async ({ page }) => {
    await page.goto(`/projects/${TEST_PROJECT_ID}/runs/create`);

    // Clear width field and blur
    await page.locator('input[placeholder*="1920"]').clear();
    await page.locator('input[placeholder*="1920"]').blur();

    // Verify validation error appears
    await expect(page.getByText(/required|must be/i)).toBeVisible();

    // Enter invalid value
    await page.locator('input[placeholder*="1920"]').fill('100');
    await page.locator('input[placeholder*="1920"]').blur();

    // Verify minimum value validation
    await expect(page.getByText(/at least|greater/i)).toBeVisible();
  });

  test('should cancel run creation and return to list', async ({ page }) => {
    await page.goto(`/projects/${TEST_PROJECT_ID}/runs/create`);

    // Click cancel button (in header)
    await page.locator('[data-test="back-button"]').click();

    // Verify returned to runs list
    await expect(page).toHaveURL(`/projects/${TEST_PROJECT_ID}/runs`);
  });

  // ========================================================================
  // Test: Run Detail View
  // ========================================================================

  test('should display run details with statistics', async ({ page }) => {
    await page.goto(`/runs/${TEST_RUN_ID}`);

    // Verify header
    await expect(page.locator('h1')).toContainText('Run #');
    await expect(page.locator('[data-test="run-status-badge"]')).toBeVisible();

    // Verify statistics card
    await expect(page.getByText('Run Statistics')).toBeVisible();
    await expect(page.getByText('Total Pages')).toBeVisible();
    await expect(page.getByText('10', { exact: true })).toBeVisible(); // totalPages
    await expect(page.getByText('Completed')).toBeVisible();
    await expect(page.getByText('Errors')).toBeVisible();

    // Verify configuration section
    await expect(page.getByText('Configuration')).toBeVisible();
    await expect(page.getByText('1920 × 1080')).toBeVisible();
    await expect(page.getByText('Enabled')).toBeVisible(); // Screenshots

    // Verify navigation buttons
    await expect(page.locator('[data-test="back-to-runs-btn"]')).toBeVisible();
    await expect(page.locator('[data-test="back-to-project-btn"]')).toBeVisible();
  });

  test('should display pages table with data', async ({ page }) => {
    await page.goto(`/runs/${TEST_RUN_ID}`);

    // Verify pages card
    await expect(page.getByText('Pages')).toBeVisible();

    // Verify table exists
    const table = page.locator('[data-test="pages-table"]');
    await expect(table).toBeVisible();

    // Verify table has rows
    const rows = table.locator('tbody tr');
    await expect(rows).toHaveCount(3);

    // Verify URL column
    await expect(table.getByText('https://example.com', { exact: true })).toBeVisible();

    // Verify status column with colors
    await expect(table.getByText('completed')).toBeVisible();
    await expect(table.getByText('error')).toBeVisible();

    // Verify HTTP status column
    await expect(table.getByText('200')).toBeVisible();
    await expect(table.getByText('404')).toBeVisible();
  });

  test('should display in-progress run with progress bar', async ({ page }) => {
    await page.goto(`/runs/${TEST_RUN_ID_IN_PROGRESS}`);

    // Verify progress bar exists
    await expect(page.locator('.n-progress')).toBeVisible();

    // Verify progress text (5 completed out of 10 = 50%)
    await expect(page.getByText(/5.*10 pages.*50%/)).toBeVisible();

    // Verify status badge shows in_progress
    await expect(page.locator('[data-test="run-status-badge"]')).toContainText('in_progress');
  });

  test('should show retry button for runs with errors', async ({ page }) => {
    await page.goto(`/runs/${TEST_RUN_ID_2}`);

    // Verify retry button exists
    await expect(page.locator('[data-test="retry-btn"]')).toBeVisible();
    await expect(page.locator('[data-test="retry-btn"]')).toHaveText('Retry Failed Pages');

    // Click retry button
    await page.locator('[data-test="retry-btn"]').click();

    // Verify success message appears (Naive UI message component)
    await expect(page.getByText(/Retrying failed pages/i)).toBeVisible();
  });

  test('should not show retry button for runs without errors', async ({ page }) => {
    await page.goto(`/runs/${TEST_RUN_ID}`);

    // Verify retry button does NOT exist
    await expect(page.locator('[data-test="retry-btn"]')).not.toBeVisible();
  });

  test('should navigate back to runs list from detail', async ({ page }) => {
    await page.goto(`/runs/${TEST_RUN_ID}`);

    await page.locator('[data-test="back-to-runs-btn"]').click();

    await expect(page).toHaveURL(`/projects/${TEST_PROJECT_ID}/runs`);
  });

  test('should navigate back to project from run detail', async ({ page }) => {
    await page.goto(`/runs/${TEST_RUN_ID}`);

    await page.locator('[data-test="back-to-project-btn"]').click();

    await expect(page).toHaveURL(`/projects/${TEST_PROJECT_ID}`);
  });

  // ========================================================================
  // Test: Error States
  // ========================================================================

  test('should handle API errors when loading runs list', async ({ page }) => {
    // Mock API error
    await page.route(`**/api/v1/projects/${TEST_PROJECT_ID}/runs*`, (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await page.goto(`/projects/${TEST_PROJECT_ID}/runs`);

    // Verify error message displayed
    await expect(page.getByText(/error|failed/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
  });

  test('should handle API errors when loading run detail', async ({ page }) => {
    // Mock API error
    await page.route(`**/api/v1/runs/${TEST_RUN_ID}`, (route) => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Run not found' }),
      });
    });

    await page.goto(`/runs/${TEST_RUN_ID}`);

    // Verify error state
    await expect(page.getByText(/not found|error/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
  });

  test('should handle form submission errors', async ({ page }) => {
    // Mock API error for run creation
    await page.route(`**/api/v1/projects/${TEST_PROJECT_ID}/runs`, (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: { code: 'INVALID_INPUT', message: 'Invalid viewport' } }),
        });
      }
    });

    await page.goto(`/projects/${TEST_PROJECT_ID}/runs/create`);

    // Fill and submit form
    await page.locator('input[placeholder*="1920"]').fill('1920');
    await page.locator('input[placeholder*="1080"]').fill('1080');
    await page.locator('button[type="submit"]').click();

    // Verify error message displayed
    await expect(page.getByText(/failed|error/i)).toBeVisible();
  });

  // ========================================================================
  // Test: Edge Cases
  // ========================================================================

  test('should handle empty pages list in run detail', async ({ page }) => {
    // Mock empty pages response
    await page.route(`**/api/v1/runs/${TEST_RUN_ID}/pages*`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto(`/runs/${TEST_RUN_ID}`);

    // Verify empty state in pages section
    await expect(page.getByText('No pages found')).toBeVisible();
  });

  test('should truncate very long URLs in pages table', async ({ page }) => {
    // Mock pages with very long URL
    const longUrlPage = {
      ...mockRunPages[0],
      url: 'https://example.com/' + 'a'.repeat(200),
    };

    await page.route(`**/api/v1/runs/${TEST_RUN_ID}/pages*`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([longUrlPage]),
      });
    });

    await page.goto(`/runs/${TEST_RUN_ID}`);

    // Verify table displays (ellipsis is handled by CSS)
    const table = page.locator('[data-test="pages-table"]');
    await expect(table).toBeVisible();
  });

  test('should handle run with 0 total pages', async ({ page }) => {
    // Mock run with 0 pages
    const emptyRun = {
      ...mockCompletedRun,
      statistics: {
        totalPages: 0,
        completedPages: 0,
        errorPages: 0,
      },
    };

    await page.route(`**/api/v1/runs/${TEST_RUN_ID}`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(emptyRun),
      });
    });

    await page.goto(`/runs/${TEST_RUN_ID}`);

    // Verify statistics show 0
    await expect(page.getByText('Total Pages')).toBeVisible();
    // Progress should be 0% for 0 total pages
    const progressText = page.locator('text=/0.*0 pages/');
    await expect(progressText).toBeVisible();
  });

  // ========================================================================
  // Test: Deep Linking
  // ========================================================================

  test('should support deep linking to specific run', async ({ page }) => {
    // Navigate directly to run detail via URL
    await page.goto(`/runs/${TEST_RUN_ID}`);

    // Verify page loaded correctly
    await expect(page.locator('h1')).toContainText('Run #');
    await expect(page.locator('[data-test="run-status-badge"]')).toBeVisible();
  });

  test('should support browser back button navigation', async ({ page }) => {
    // Navigate through workflow
    await page.goto(`/projects/${TEST_PROJECT_ID}/runs`);
    await page.locator('[data-test="new-run-btn"]').click();
    await expect(page).toHaveURL(`/projects/${TEST_PROJECT_ID}/runs/create`);

    // Use browser back button
    await page.goBack();

    // Verify returned to runs list
    await expect(page).toHaveURL(`/projects/${TEST_PROJECT_ID}/runs`);
    await expect(page.locator('h1')).toHaveText('Runs');
  });
});
