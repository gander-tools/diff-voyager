import type { PerformanceData, SeoData } from '@gander-tools/diff-voyager-shared';
import { tsRestClient } from './client';

/**
 * Page details response
 */
export interface PageDetailsResponse {
  id: string;
  projectId: string;
  url: string;
  originalUrl: string;
  status: string;
  httpStatus?: number;
  capturedAt?: string;
  seoData?: SeoData;
  httpHeaders?: Record<string, string>;
  performanceData?: PerformanceData;
  artifacts: {
    screenshotUrl?: string;
    baselineScreenshotUrl?: string;
    diffImageUrl?: string;
    harUrl?: string;
    htmlUrl?: string;
  };
}

/**
 * SEO change response
 */
export interface SeoChangeResponse {
  field: string;
  severity: string;
  baselineValue?: string;
  currentValue?: string;
}

/**
 * Header change response
 */
export interface HeaderChangeResponse {
  headerName: string;
  severity: string;
  baselineValue?: string;
  currentValue?: string;
}

/**
 * Performance change response
 */
export interface PerformanceChangeResponse {
  metric: string;
  severity: string;
  baselineValue: number;
  currentValue: number;
  percentageChange: number;
}

/**
 * Visual diff response
 */
export interface VisualDiffResponse {
  diffPercentage: number;
  diffPixels: number;
  thresholdExceeded: boolean;
}

/**
 * Page diff response
 */
export interface PageDiffResponse {
  summary: {
    totalChanges: number;
    criticalChanges: number;
    warningChanges: number;
    infoChanges: number;
  };
  seoChanges: SeoChangeResponse[];
  headerChanges: HeaderChangeResponse[];
  performanceChanges: PerformanceChangeResponse[];
  visualDiff?: VisualDiffResponse;
}

/**
 * Get page details by ID
 * GET /pages/:pageId
 *
 * Uses @ts-rest client for type-safe API calls
 */
export async function getPage(pageId: string): Promise<PageDetailsResponse> {
  const result = await tsRestClient.getPageDetails({
    params: { pageId },
  });

  if (result.status === 200) {
    return result.body as PageDetailsResponse;
  }

  const errorBody = result.body as { message?: string };
  throw new Error(errorBody.message || 'Failed to get page');
}

/**
 * Get page diff details
 * GET /pages/:pageId/diff
 *
 * Uses @ts-rest client for type-safe API calls
 */
export async function getPageDiff(pageId: string): Promise<PageDiffResponse> {
  const result = await tsRestClient.getPageDiff({
    params: { pageId },
  });

  if (result.status === 200) {
    return result.body as PageDiffResponse;
  }

  const errorBody = result.body as { message?: string };
  throw new Error(errorBody.message || 'Failed to get page diff');
}
