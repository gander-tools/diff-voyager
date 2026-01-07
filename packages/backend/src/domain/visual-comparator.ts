/**
 * Visual Comparator - compares screenshots using pixel-by-pixel diff
 */

import { DiffSeverity, DiffType } from '@gander-tools/diff-voyager-shared';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

/**
 * Options for visual comparison
 */
export interface VisualCompareOptions {
  /** Percentage threshold for considering images different (default: 0.01) */
  threshold?: number;
  /** Whether to generate a diff image (default: false) */
  generateDiffImage?: boolean;
  /** Pixelmatch threshold for color comparison (0-1, default: 0.1) */
  colorThreshold?: number;
}

/**
 * Result of visual comparison
 */
export interface VisualCompareResult {
  /** Number of different pixels */
  diffPixels: number;
  /** Percentage of different pixels (0-100) */
  diffPercentage: number;
  /** Whether the difference exceeds the threshold */
  thresholdExceeded: boolean;
  /** Image width */
  width: number;
  /** Image height */
  height: number;
  /** Generated diff image as PNG buffer (if requested) */
  diffImage?: Buffer;
  /** Error message if comparison failed */
  error?: string;
}

/**
 * Visual change detected during comparison
 */
export interface VisualChange {
  type: DiffType.VISUAL;
  severity: DiffSeverity;
  description: string;
  diffPixels: number;
  diffPercentage: number;
  thresholdExceeded: boolean;
}

/**
 * Default threshold percentage for visual diff
 */
const DEFAULT_THRESHOLD = 0.01;

/**
 * Default pixelmatch color threshold
 */
const DEFAULT_COLOR_THRESHOLD = 0.1;

/**
 * Compare two screenshots and return the visual diff result
 */
export function compare(
  baselineImage: Buffer,
  currentImage: Buffer,
  options: VisualCompareOptions = {},
): VisualCompareResult {
  const {
    threshold = DEFAULT_THRESHOLD,
    generateDiffImage = false,
    colorThreshold = DEFAULT_COLOR_THRESHOLD,
  } = options;

  try {
    // Parse PNG images
    const baseline = PNG.sync.read(baselineImage);
    const current = PNG.sync.read(currentImage);

    // Check if images have the same dimensions
    if (baseline.width !== current.width || baseline.height !== current.height) {
      return {
        diffPixels: 0,
        diffPercentage: 0,
        thresholdExceeded: true,
        width: baseline.width,
        height: baseline.height,
        error: `Image size mismatch: baseline (${baseline.width}x${baseline.height}) vs current (${current.width}x${current.height})`,
      };
    }

    const { width, height } = baseline;
    const totalPixels = width * height;

    // Create diff image buffer if requested
    let diffOutput: PNG | undefined;
    if (generateDiffImage) {
      diffOutput = new PNG({ width, height });
    }

    // Perform pixel-by-pixel comparison
    const diffPixels = pixelmatch(
      baseline.data,
      current.data,
      diffOutput?.data ?? null,
      width,
      height,
      {
        threshold: colorThreshold,
        includeAA: true,
      },
    );

    // Calculate percentage
    const diffPercentage = totalPixels > 0 ? (diffPixels / totalPixels) * 100 : 0;

    // Check if threshold is exceeded
    const thresholdExceeded = diffPercentage > threshold;

    const result: VisualCompareResult = {
      diffPixels,
      diffPercentage,
      thresholdExceeded,
      width,
      height,
    };

    // Include diff image if generated
    if (generateDiffImage && diffOutput) {
      result.diffImage = PNG.sync.write(diffOutput);
    }

    return result;
  } catch (error) {
    return {
      diffPixels: 0,
      diffPercentage: 0,
      thresholdExceeded: true,
      width: 0,
      height: 0,
      error: error instanceof Error ? error.message : 'Unknown error during visual comparison',
    };
  }
}

/**
 * Create a visual change object from comparison result
 */
export function createVisualChange(result: VisualCompareResult): VisualChange {
  let severity: DiffSeverity;
  let description: string;

  if (result.diffPixels === 0) {
    severity = DiffSeverity.INFO;
    description = 'No visual differences detected';
  } else if (result.thresholdExceeded) {
    severity = DiffSeverity.CRITICAL;
    description = `Visual difference: ${result.diffPercentage.toFixed(2)}% (${result.diffPixels} pixels) exceeds threshold`;
  } else {
    severity = DiffSeverity.WARNING;
    description = `Minor visual difference: ${result.diffPercentage.toFixed(2)}% (${result.diffPixels} pixels)`;
  }

  return {
    type: DiffType.VISUAL,
    severity,
    description,
    diffPixels: result.diffPixels,
    diffPercentage: result.diffPercentage,
    thresholdExceeded: result.thresholdExceeded,
  };
}

/**
 * Compare screenshots from file paths
 */
export async function compareFromPaths(
  baselinePath: string,
  currentPath: string,
  options: VisualCompareOptions = {},
): Promise<VisualCompareResult> {
  const { readFile } = await import('node:fs/promises');

  const [baselineImage, currentImage] = await Promise.all([
    readFile(baselinePath),
    readFile(currentPath),
  ]);

  return compare(baselineImage, currentImage, options);
}
