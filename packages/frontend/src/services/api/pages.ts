import type { PerformanceData, SeoData } from '@gander-tools/diff-voyager-shared';
import { get } from './client';

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
 */
export function getPage(pageId: string): Promise<PageDetailsResponse> {
  return get<PageDetailsResponse>(`/pages/${pageId}`);
}

/**
 * Get page diff details
 * GET /pages/:pageId/diff
 */
export function getPageDiff(pageId: string): Promise<PageDiffResponse> {
  return get<PageDiffResponse>(`/pages/${pageId}/diff`);
}
