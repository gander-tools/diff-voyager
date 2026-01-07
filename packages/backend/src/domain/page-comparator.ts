/**
 * Full Page Comparator - orchestrates all comparison logic for a page
 */

import { randomUUID } from 'node:crypto';
import type { Change, DiffSummary, PageSnapshot } from '@gander-tools/diff-voyager-shared';
import { DiffSeverity, DiffStatus, DiffType } from '@gander-tools/diff-voyager-shared';
import * as HeaderComparator from './header-comparator.js';
import * as PerformanceComparator from './performance-comparator.js';
import * as SeoComparator from './seo-comparator.js';
import * as VisualComparator from './visual-comparator.js';

/**
 * Unified page change type
 */
export interface PageChange extends Omit<Change, 'id'> {
  id: string;
}

/**
 * Options for page comparison
 */
export interface PageCompareOptions {
  /** Visual diff threshold percentage (default: 0.01) */
  visualThreshold?: number;
  /** Performance change threshold percentage (default: 10) */
  performanceThreshold?: number;
  /** Headers to ignore during comparison */
  ignoreHeaders?: string[];
  /** Whether to generate visual diff image */
  generateDiffImage?: boolean;
}

/**
 * Result of page comparison
 */
export interface PageCompareResult {
  changes: PageChange[];
  summary: DiffSummary;
  visualDiffImage?: Buffer;
}

/**
 * Visual diff info for summary
 */
export interface VisualDiffInfo {
  visualDiffPercentage: number;
  visualDiffPixels: number;
  thresholdExceeded: boolean;
}

/**
 * Compare two page snapshots and return all detected changes
 */
export function compare(
  baseline: PageSnapshot,
  current: PageSnapshot,
  options: PageCompareOptions = {},
): PageCompareResult {
  const changes: PageChange[] = [];

  // Compare HTTP status
  const httpStatusChange = compareHttpStatus(baseline.httpStatus, current.httpStatus);
  if (httpStatusChange) {
    changes.push(httpStatusChange);
  }

  // Compare SEO data
  const seoChanges = SeoComparator.compare(baseline.seoData, current.seoData);
  for (const seoChange of seoChanges) {
    changes.push({
      id: randomUUID(),
      type: DiffType.SEO,
      severity: seoChange.severity,
      status: DiffStatus.NEW,
      description: seoChange.description,
      details: {
        field: seoChange.field,
        oldValue: seoChange.baselineValue,
        newValue: seoChange.currentValue,
      },
    });
  }

  // Compare headers
  const headerChanges = HeaderComparator.compare(baseline.httpHeaders, current.httpHeaders, {
    ignoreHeaders: options.ignoreHeaders,
  });
  for (const headerChange of headerChanges) {
    changes.push({
      id: randomUUID(),
      type: DiffType.HEADERS,
      severity: headerChange.severity,
      status: DiffStatus.NEW,
      description: headerChange.description,
      details: {
        field: headerChange.headerName,
        oldValue: headerChange.baselineValue,
        newValue: headerChange.currentValue,
      },
    });
  }

  // Compare performance data
  if (baseline.performance || current.performance) {
    const perfChanges = PerformanceComparator.compare(baseline.performance, current.performance, {
      threshold: options.performanceThreshold,
    });
    for (const perfChange of perfChanges) {
      changes.push({
        id: randomUUID(),
        type: DiffType.PERFORMANCE,
        severity: perfChange.severity,
        status: DiffStatus.NEW,
        description: perfChange.description,
        details: {
          field: perfChange.metric,
          oldValue: perfChange.baselineValue,
          newValue: perfChange.currentValue,
          metadata: {
            changePercentage: perfChange.changePercentage,
          },
        },
      });
    }
  }

  // Create summary
  const summary = createDiffSummary(changes);

  return {
    changes,
    summary,
  };
}

/**
 * Compare two page snapshots including visual comparison
 */
export async function compareWithVisual(
  baseline: PageSnapshot,
  current: PageSnapshot,
  baselineScreenshot: Buffer,
  currentScreenshot: Buffer,
  options: PageCompareOptions = {},
): Promise<PageCompareResult> {
  // First do the non-visual comparison
  const result = compare(baseline, current, options);

  // Then do visual comparison
  const visualResult = VisualComparator.compare(baselineScreenshot, currentScreenshot, {
    threshold: options.visualThreshold,
    generateDiffImage: options.generateDiffImage,
  });

  // Add visual change if there are differences
  if (visualResult.diffPixels > 0) {
    const visualChange = VisualComparator.createVisualChange(visualResult);
    result.changes.push({
      id: randomUUID(),
      type: DiffType.VISUAL,
      severity: visualChange.severity,
      status: DiffStatus.NEW,
      description: visualChange.description,
      details: {
        metadata: {
          diffPixels: visualResult.diffPixels,
          diffPercentage: visualResult.diffPercentage,
          thresholdExceeded: visualResult.thresholdExceeded,
          width: visualResult.width,
          height: visualResult.height,
        },
      },
    });
  }

  // Update summary with visual diff info
  result.summary = createDiffSummary(result.changes, {
    visualDiffPercentage: visualResult.diffPercentage,
    visualDiffPixels: visualResult.diffPixels,
    thresholdExceeded: visualResult.thresholdExceeded,
  });

  if (visualResult.diffImage) {
    result.visualDiffImage = visualResult.diffImage;
  }

  return result;
}

/**
 * Compare HTTP status codes
 */
export function compareHttpStatus(baseline: number, current: number): PageChange | null {
  if (baseline === current) {
    return null;
  }

  const severity = getHttpStatusSeverity(baseline, current);

  return {
    id: randomUUID(),
    type: DiffType.HTTP_STATUS,
    severity,
    status: DiffStatus.NEW,
    description: `HTTP status changed from ${baseline} to ${current}`,
    details: {
      oldValue: baseline,
      newValue: current,
    },
  };
}

/**
 * Determine severity of HTTP status change
 */
function getHttpStatusSeverity(_baseline: number, current: number): DiffSeverity {
  // Change to error status (4xx or 5xx) is critical
  if (current >= 400) {
    return DiffSeverity.CRITICAL;
  }

  // Change to redirect (3xx) is warning
  if (current >= 300) {
    return DiffSeverity.WARNING;
  }

  // Change within 2xx range is info
  return DiffSeverity.INFO;
}

/**
 * Create a diff summary from changes
 */
export function createDiffSummary(changes: PageChange[], visualInfo?: VisualDiffInfo): DiffSummary {
  const changesByType: Record<DiffType, number> = {
    [DiffType.SEO]: 0,
    [DiffType.VISUAL]: 0,
    [DiffType.CONTENT]: 0,
    [DiffType.PERFORMANCE]: 0,
    [DiffType.HTTP_STATUS]: 0,
    [DiffType.HEADERS]: 0,
  };

  let criticalChanges = 0;
  let acceptedChanges = 0;
  let mutedChanges = 0;

  for (const change of changes) {
    changesByType[change.type]++;

    if (change.severity === DiffSeverity.CRITICAL) {
      criticalChanges++;
    }

    if (change.status === DiffStatus.ACCEPTED) {
      acceptedChanges++;
    }

    if (change.status === DiffStatus.MUTED) {
      mutedChanges++;
    }
  }

  return {
    totalChanges: changes.length,
    criticalChanges,
    acceptedChanges,
    mutedChanges,
    changesByType,
    visualDiffPercentage: visualInfo?.visualDiffPercentage,
    visualDiffPixels: visualInfo?.visualDiffPixels,
    thresholdExceeded: visualInfo?.thresholdExceeded ?? false,
  };
}
