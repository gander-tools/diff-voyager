/**
 * Performance Comparator - detects changes in performance metrics between baseline and current snapshots
 */

import type { PerformanceData } from '@gander-tools/diff-voyager-shared';
import { DiffSeverity, DiffType } from '@gander-tools/diff-voyager-shared';

/**
 * Performance change detected during comparison
 */
export interface PerformanceChange {
  type: DiffType.PERFORMANCE;
  severity: DiffSeverity;
  metric: string;
  baselineValue: number;
  currentValue: number;
  changePercentage: number;
  description: string;
}

/**
 * Options for performance comparison
 */
export interface PerformanceCompareOptions {
  /** Minimum percentage change to report (default: 10) */
  threshold?: number;
}

/**
 * Default threshold for reporting performance changes (10%)
 */
const DEFAULT_THRESHOLD = 10;

/**
 * Metric display names
 */
const METRIC_LABELS: Record<string, string> = {
  loadTimeMs: 'Load time',
  requestCount: 'Request count',
  totalSizeBytes: 'Total size',
};

/**
 * Compare two performance data objects and return detected changes
 */
export function compare(
  baseline: PerformanceData | undefined,
  current: PerformanceData | undefined,
  options: PerformanceCompareOptions = {},
): PerformanceChange[] {
  const { threshold = DEFAULT_THRESHOLD } = options;
  const changes: PerformanceChange[] = [];

  // Handle undefined cases
  if (!baseline && !current) {
    return [];
  }

  // Define metrics to compare
  const metrics: (keyof PerformanceData)[] = ['loadTimeMs', 'requestCount', 'totalSizeBytes'];

  for (const metric of metrics) {
    // Skip resourceTimings array comparison
    if (metric === 'resourceTimings') {
      continue;
    }

    const baselineValue = baseline?.[metric] as number | undefined;
    const currentValue = current?.[metric] as number | undefined;

    // Handle missing values
    if (baselineValue === undefined && currentValue === undefined) {
      continue;
    }

    if (baselineValue === undefined && currentValue !== undefined) {
      // Metric added
      changes.push({
        type: DiffType.PERFORMANCE,
        severity: DiffSeverity.INFO,
        metric,
        baselineValue: 0,
        currentValue,
        changePercentage: 100,
        description: createDescription(metric, 0, currentValue, 100),
      });
      continue;
    }

    if (baselineValue !== undefined && currentValue === undefined) {
      // Metric removed
      changes.push({
        type: DiffType.PERFORMANCE,
        severity: DiffSeverity.WARNING,
        metric,
        baselineValue,
        currentValue: 0,
        changePercentage: -100,
        description: createDescription(metric, baselineValue, 0, -100),
      });
      continue;
    }

    // Both values present
    const bv = baselineValue!;
    const cv = currentValue!;

    // Calculate percentage change
    const changePercentage = calculateChangePercentage(bv, cv);

    // Only report if change exceeds threshold
    if (Math.abs(changePercentage) >= threshold) {
      changes.push({
        type: DiffType.PERFORMANCE,
        severity: getSeverity(metric, changePercentage),
        metric,
        baselineValue: bv,
        currentValue: cv,
        changePercentage,
        description: createDescription(metric, bv, cv, changePercentage),
      });
    }
  }

  return changes;
}

/**
 * Calculate percentage change between two values
 */
function calculateChangePercentage(baseline: number, current: number): number {
  if (baseline === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - baseline) / baseline) * 100;
}

/**
 * Determine the severity of a performance change
 */
export function getSeverity(metric: string, changePercentage: number): DiffSeverity {
  // Improvements (decreases) are informational
  if (changePercentage < 0) {
    return DiffSeverity.INFO;
  }

  // Load time thresholds
  if (metric === 'loadTimeMs') {
    if (changePercentage >= 100) {
      return DiffSeverity.CRITICAL;
    }
    if (changePercentage >= 25) {
      return DiffSeverity.WARNING;
    }
  }

  // Request count thresholds
  if (metric === 'requestCount') {
    if (changePercentage >= 100) {
      return DiffSeverity.CRITICAL;
    }
    if (changePercentage >= 50) {
      return DiffSeverity.WARNING;
    }
  }

  // Total size thresholds
  if (metric === 'totalSizeBytes') {
    if (changePercentage >= 100) {
      return DiffSeverity.CRITICAL;
    }
    if (changePercentage >= 50) {
      return DiffSeverity.WARNING;
    }
  }

  return DiffSeverity.INFO;
}

/**
 * Format a metric value for display
 */
export function formatMetricValue(metric: string, value: number): string {
  if (metric === 'loadTimeMs') {
    return `${(value / 1000).toFixed(2)}s`;
  }

  if (metric === 'totalSizeBytes') {
    return formatBytes(value);
  }

  return String(value);
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Create a human-readable description for a performance change
 */
export function createDescription(
  metric: string,
  baselineValue: number,
  currentValue: number,
  changePercentage: number,
): string {
  const label = METRIC_LABELS[metric] || metric;
  const direction = changePercentage >= 0 ? 'increased' : 'decreased';
  const absPercentage = Math.abs(changePercentage).toFixed(0);

  return `${label} ${direction} by ${absPercentage}% (${formatMetricValue(metric, baselineValue)} → ${formatMetricValue(metric, currentValue)})`;
}
