/**
 * SEO Comparator - detects changes in SEO metadata between baseline and current snapshots
 */

import type { SeoData } from '@gander-tools/diff-voyager-shared';
import { DiffSeverity, DiffType } from '@gander-tools/diff-voyager-shared';

/**
 * SEO change detected during comparison
 */
export interface SeoChange {
  type: DiffType.SEO;
  severity: DiffSeverity;
  field: string;
  baselineValue: string | string[] | null;
  currentValue: string | string[] | null;
  description: string;
}

/**
 * Fields that are considered important but not critical
 */
const WARNING_FIELDS = ['metaDescription', 'h1', 'lang'];

/**
 * Human-readable field names for descriptions
 */
const FIELD_LABELS: Record<string, string> = {
  title: 'Title',
  metaDescription: 'Meta description',
  canonical: 'Canonical URL',
  robots: 'Robots directive',
  h1: 'H1 heading',
  h2: 'H2 headings',
  lang: 'Language attribute',
  openGraph: 'Open Graph',
  twitterCard: 'Twitter Card',
};

/**
 * Compare two SEO data objects and return detected changes
 */
export function compare(baseline: SeoData | undefined, current: SeoData | undefined): SeoChange[] {
  const changes: SeoChange[] = [];

  // Handle undefined cases
  const baselineData = baseline ?? {};
  const currentData = current ?? {};

  // If both are empty, no changes
  if (Object.keys(baselineData).length === 0 && Object.keys(currentData).length === 0) {
    return [];
  }

  // Compare string fields
  const stringFields: (keyof SeoData)[] = [
    'title',
    'metaDescription',
    'canonical',
    'robots',
    'lang',
  ];

  for (const field of stringFields) {
    const baselineValue = baselineData[field] as string | undefined;
    const currentValue = currentData[field] as string | undefined;

    if (baselineValue !== currentValue) {
      const normalizedBaseline = baselineValue ?? null;
      const normalizedCurrent = currentValue ?? null;

      changes.push({
        type: DiffType.SEO,
        severity: getSeverity(field, normalizedBaseline, normalizedCurrent),
        field,
        baselineValue: normalizedBaseline,
        currentValue: normalizedCurrent,
        description: createDescription(field, normalizedBaseline, normalizedCurrent),
      });
    }
  }

  // Compare array fields (h1, h2)
  const arrayFields: (keyof SeoData)[] = ['h1', 'h2'];

  for (const field of arrayFields) {
    const baselineValue = (baselineData[field] as string[] | undefined) ?? [];
    const currentValue = (currentData[field] as string[] | undefined) ?? [];

    if (!arraysEqual(baselineValue, currentValue)) {
      // Keep empty arrays as-is for better clarity in diffs
      const normalizedBaseline = baselineValue.length > 0 ? baselineValue : [];
      const normalizedCurrent = currentValue.length > 0 ? currentValue : [];

      changes.push({
        type: DiffType.SEO,
        severity: getSeverity(field, normalizedBaseline, normalizedCurrent),
        field,
        baselineValue: normalizedBaseline,
        currentValue: normalizedCurrent,
        description: createDescription(
          field,
          normalizedBaseline.length > 0 ? normalizedBaseline : null,
          normalizedCurrent.length > 0 ? normalizedCurrent : null,
        ),
      });
    }
  }

  return changes;
}

/**
 * Determine the severity of a SEO change
 */
export function getSeverity(
  field: string,
  baselineValue: string | string[] | null,
  currentValue: string | string[] | null,
): DiffSeverity {
  // Title changes
  if (field === 'title') {
    // Adding a title is good (INFO)
    if (baselineValue === null && currentValue !== null) {
      return DiffSeverity.INFO;
    }
    // Removing or changing title is critical
    return DiffSeverity.CRITICAL;
  }

  // Canonical change is always critical
  if (field === 'canonical') {
    return DiffSeverity.CRITICAL;
  }

  // Robots changes are critical if they introduce noindex
  if (field === 'robots') {
    if (typeof currentValue === 'string' && currentValue.toLowerCase().includes('noindex')) {
      return DiffSeverity.CRITICAL;
    }
    return DiffSeverity.WARNING;
  }

  // H1 removal is critical, other H1 changes are warnings
  if (field === 'h1') {
    // Empty array or null means H1 was removed - critical
    if (currentValue === null || (Array.isArray(currentValue) && currentValue.length === 0)) {
      return DiffSeverity.CRITICAL;
    }
    return DiffSeverity.WARNING;
  }

  // Other warning fields
  if (WARNING_FIELDS.includes(field)) {
    return DiffSeverity.WARNING;
  }

  // Default to INFO for unknown fields
  return DiffSeverity.INFO;
}

/**
 * Create a human-readable description for a SEO change
 */
export function createDescription(
  field: string,
  baselineValue: string | string[] | null,
  currentValue: string | string[] | null,
): string {
  const label = FIELD_LABELS[field] || field;

  // Format value for display
  const formatValue = (value: string | string[] | null): string => {
    if (value === null) {
      return 'empty';
    }
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return 'empty';
      }
      if (value.length === 1) {
        return `"${value[0]}"`;
      }
      return `[${value.map((v) => `"${v}"`).join(', ')}]`;
    }
    return `"${value}"`;
  };

  if (baselineValue === null && currentValue !== null) {
    return `${label} added: ${formatValue(currentValue)}`;
  }

  if (baselineValue !== null && currentValue === null) {
    return `${label} removed (was ${formatValue(baselineValue)})`;
  }

  if (Array.isArray(baselineValue) && baselineValue.length === 0 && currentValue !== null) {
    return `${label} added: ${formatValue(currentValue)}`;
  }

  if (Array.isArray(currentValue) && currentValue.length === 0 && baselineValue !== null) {
    return `${label} removed (was ${formatValue(baselineValue)})`;
  }

  return `${label} changed from ${formatValue(baselineValue)} to ${formatValue(currentValue)}`;
}

/**
 * Compare two arrays for equality
 */
function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}
