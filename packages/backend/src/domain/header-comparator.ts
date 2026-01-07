/**
 * Header Comparator - detects changes in HTTP headers between baseline and current snapshots
 */

import { DiffSeverity, DiffType } from '@gander-tools/diff-voyager-shared';

/**
 * Header change detected during comparison
 */
export interface HeaderChange {
  type: DiffType.HEADERS;
  severity: DiffSeverity;
  headerName: string;
  baselineValue: string | null;
  currentValue: string | null;
  description: string;
}

/**
 * Options for header comparison
 */
export interface HeaderCompareOptions {
  /** Headers to ignore during comparison */
  ignoreHeaders?: string[];
}

/**
 * Headers that are commonly volatile and should be ignored by default
 */
const DEFAULT_IGNORED_HEADERS = [
  'date',
  'age',
  'x-request-id',
  'x-correlation-id',
  'x-trace-id',
  'x-amzn-requestid',
  'cf-ray',
  'set-cookie',
  'etag',
  'last-modified',
  'expires',
];

/**
 * Security-related headers that are critical when removed
 */
const SECURITY_HEADERS = [
  'x-frame-options',
  'x-content-type-options',
  'x-xss-protection',
  'content-security-policy',
  'strict-transport-security',
  'referrer-policy',
  'permissions-policy',
];

/**
 * Headers that are important for caching and content
 */
const IMPORTANT_HEADERS = ['content-type', 'cache-control', 'vary', 'content-encoding'];

/**
 * Normalize header name to lowercase for comparison
 */
function normalizeHeaderName(name: string): string {
  return name.toLowerCase();
}

/**
 * Compare two sets of HTTP headers and return detected changes
 */
export function compare(
  baseline: Record<string, string>,
  current: Record<string, string>,
  options: HeaderCompareOptions = {},
): HeaderChange[] {
  const changes: HeaderChange[] = [];
  const ignoreHeaders = new Set(
    [...DEFAULT_IGNORED_HEADERS, ...(options.ignoreHeaders ?? [])].map(normalizeHeaderName),
  );

  // Normalize headers to lowercase keys
  const baselineNormalized = normalizeHeaders(baseline);
  const currentNormalized = normalizeHeaders(current);

  // Get all unique header names
  const allHeaders = new Set([
    ...Object.keys(baselineNormalized),
    ...Object.keys(currentNormalized),
  ]);

  for (const headerName of allHeaders) {
    // Skip ignored headers
    if (ignoreHeaders.has(headerName)) {
      continue;
    }

    const baselineValue = baselineNormalized[headerName] ?? null;
    const currentValue = currentNormalized[headerName] ?? null;

    // Check if values are different
    if (baselineValue !== currentValue) {
      changes.push({
        type: DiffType.HEADERS,
        severity: getSeverity(headerName, baselineValue, currentValue),
        headerName,
        baselineValue,
        currentValue,
        description: createDescription(headerName, baselineValue, currentValue),
      });
    }
  }

  return changes;
}

/**
 * Normalize headers to lowercase keys
 */
function normalizeHeaders(headers: Record<string, string>): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    normalized[normalizeHeaderName(key)] = value;
  }
  return normalized;
}

/**
 * Determine the severity of a header change
 */
export function getSeverity(
  headerName: string,
  _baselineValue: string | null,
  currentValue: string | null,
): DiffSeverity {
  const normalizedName = normalizeHeaderName(headerName);

  // Security header removed is critical
  if (SECURITY_HEADERS.includes(normalizedName) && currentValue === null) {
    return DiffSeverity.CRITICAL;
  }

  // Security header changed is warning
  if (SECURITY_HEADERS.includes(normalizedName)) {
    return DiffSeverity.WARNING;
  }

  // Important header changes are warnings
  if (IMPORTANT_HEADERS.includes(normalizedName)) {
    return DiffSeverity.WARNING;
  }

  // Other header changes are informational
  return DiffSeverity.INFO;
}

/**
 * Create a human-readable description for a header change
 */
export function createDescription(
  headerName: string,
  baselineValue: string | null,
  currentValue: string | null,
): string {
  if (baselineValue === null && currentValue !== null) {
    return `Header "${headerName}" added with value "${truncate(currentValue)}"`;
  }

  if (baselineValue !== null && currentValue === null) {
    return `Header "${headerName}" removed (was "${truncate(baselineValue)}")`;
  }

  return `Header "${headerName}" changed from "${truncate(baselineValue)}" to "${truncate(currentValue)}"`;
}

/**
 * Truncate long values for display
 */
function truncate(value: string | null, maxLength = 50): string {
  if (value === null) {
    return 'null';
  }
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.substring(0, maxLength)}...`;
}
