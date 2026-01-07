/**
 * Shared constants for Diff Voyager
 */

export const DEFAULT_VIEWPORT = { width: 1920, height: 1080 };
export const DEFAULT_VISUAL_THRESHOLD = 0.01; // 1% pixel difference
export const DEFAULT_PERFORMANCE_THRESHOLD = 0.20; // 20% change
export const DEFAULT_MAX_PAGES = 1000;
export const DEFAULT_MAX_DURATION_SECONDS = 3600; // 1 hour
export const DEFAULT_WAIT_AFTER_LOAD = 1000; // 1 second
export const DEFAULT_CONCURRENCY = 3;
export const DEFAULT_MAX_RETRIES = 3;
export const DEFAULT_PAGE_LIMIT = 100;

export const API_VERSION = 'v1';
export const API_BASE_PATH = `/api/${API_VERSION}`;
