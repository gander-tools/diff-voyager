/**
 * Test fixtures for Zod schema tests
 * Reusable test data for common patterns
 */

// ============================================================================
// Valid UUID fixtures
// ============================================================================

export const validUUIDs = [
  '550e8400-e29b-41d4-a716-446655440000',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  'a1234567-89ab-cdef-0123-456789abcdef',
];

export const invalidUUIDs = [
  'not-a-uuid',
  '12345',
  '',
  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  '550e8400-e29b-41d4-a716', // Too short
  '550e8400-e29b-41d4-a716-446655440000-extra', // Too long
  '550e8400e29b41d4a716446655440000', // Missing hyphens
];

// ============================================================================
// Valid URL fixtures
// ============================================================================

export const validURLs = [
  'https://example.com',
  'http://example.com',
  'https://example.com/path',
  'https://example.com/path?query=value',
  'https://example.com/path?query=value&other=test',
  'https://subdomain.example.com',
  'https://example.com:8080',
  'https://example.com/path#fragment',
];

export const invalidURLs = [
  'not-a-url',
  '/relative/path',
  'example.com',
  '//example.com', // Protocol-relative
  '',
  'http://',
  'https://',
];

// ============================================================================
// Valid timestamp fixtures (ISO 8601)
// ============================================================================

export const validTimestamps = [
  '2024-01-01T00:00:00.000Z',
  '2024-12-31T23:59:59.999Z',
  '2024-06-15T12:30:45.123Z',
  '2026-01-09T10:00:00Z',
];

export const invalidTimestamps = [
  'not-a-date',
  '2024-01-01', // Missing time
  '01/01/2024', // Wrong format
  '2024-13-01T00:00:00Z', // Invalid month
  '2024-01-32T00:00:00Z', // Invalid day
  '',
];

// ============================================================================
// Viewport fixtures
// ============================================================================

export const validViewport = {
  width: 1920,
  height: 1080,
};

export const validViewports = [
  { width: 1920, height: 1080 },
  { width: 1366, height: 768 },
  { width: 320, height: 240 }, // Minimum values
  { width: 3840, height: 2160 }, // 4K
];

export const invalidViewports = [
  { width: 100, height: 1080 }, // Width too small (min 320)
  { width: 1920, height: 100 }, // Height too small (min 240)
  { width: -1920, height: 1080 }, // Negative width
  { width: 1920, height: -1080 }, // Negative height
  { width: 1920.5, height: 1080 }, // Float width (not int)
  { width: 1920, height: 1080.5 }, // Float height (not int)
];

// ============================================================================
// Project config fixtures
// ============================================================================

export const validProjectConfig = {
  crawl: true,
  viewport: validViewport,
  visualDiffThreshold: 0.01,
  maxPages: 100,
};

export const validProjectConfigs = [
  {
    crawl: true,
    viewport: { width: 1920, height: 1080 },
    visualDiffThreshold: 0.01,
    maxPages: 100,
  },
  {
    crawl: false,
    viewport: { width: 1366, height: 768 },
    visualDiffThreshold: 0.5,
  }, // maxPages is optional
  {
    crawl: true,
    viewport: { width: 320, height: 240 },
    visualDiffThreshold: 0, // Min value
  },
  {
    crawl: false,
    viewport: { width: 1920, height: 1080 },
    visualDiffThreshold: 1, // Max value
  },
];

// ============================================================================
// Statistics fixtures
// ============================================================================

export const validStatistics = {
  totalPages: 100,
  completedPages: 95,
  errorPages: 5,
  changedPages: 10,
  unchangedPages: 85,
  totalDifferences: 25,
  criticalDifferences: 3,
  acceptedDifferences: 10,
  mutedDifferences: 5,
};

export const zeroStatistics = {
  totalPages: 0,
  completedPages: 0,
  errorPages: 0,
  changedPages: 0,
  unchangedPages: 0,
  totalDifferences: 0,
  criticalDifferences: 0,
  acceptedDifferences: 0,
  mutedDifferences: 0,
};

// ============================================================================
// Run config fixtures
// ============================================================================

export const validRunConfig = {
  viewport: validViewport,
  captureScreenshots: true,
  captureHar: true,
};

export const validRunConfigs = [
  {
    viewport: { width: 1920, height: 1080 },
    captureScreenshots: true,
    captureHar: true,
  },
  {
    viewport: { width: 1366, height: 768 },
    captureScreenshots: false,
    captureHar: false,
  },
];

// ============================================================================
// Run statistics fixtures
// ============================================================================

export const validRunStatistics = {
  totalPages: 50,
  completedPages: 48,
  errorPages: 2,
};

export const zeroRunStatistics = {
  totalPages: 0,
  completedPages: 0,
  errorPages: 0,
};

// ============================================================================
// Pagination fixtures
// ============================================================================

export const validPagination = {
  total: 100,
  limit: 50,
  offset: 0,
  hasMore: true,
};

export const validPaginations = [
  {
    total: 100,
    limit: 50,
    offset: 0,
    hasMore: true,
  },
  {
    total: 10,
    limit: 50,
    offset: 0,
    hasMore: false,
  },
  {
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false,
  },
];
