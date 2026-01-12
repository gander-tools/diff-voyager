import { apiClient } from './client';
import { fetchAs } from './types';

/**
 * Get artifact URL for a page
 */
export function getArtifactUrl(
  pageId: string,
  artifactType: 'screenshot' | 'baseline-screenshot' | 'diff' | 'har' | 'html',
): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
  return `${baseUrl}/artifacts/${pageId}/${artifactType}`;
}

/**
 * Get page screenshot (PNG)
 * GET /artifacts/:pageId/screenshot
 */
export function getScreenshot(pageId: string): Promise<Blob> {
  return fetchAs('blob', apiClient(`/artifacts/${pageId}/screenshot`, { responseType: 'blob' }));
}

/**
 * Get baseline screenshot (PNG)
 * GET /artifacts/:pageId/baseline-screenshot
 */
export function getBaselineScreenshot(pageId: string): Promise<Blob> {
  return fetchAs(
    'blob',
    apiClient(`/artifacts/${pageId}/baseline-screenshot`, { responseType: 'blob' }),
  );
}

/**
 * Get visual diff image (PNG)
 * GET /artifacts/:pageId/diff
 */
export function getDiffImage(pageId: string): Promise<Blob> {
  return fetchAs('blob', apiClient(`/artifacts/${pageId}/diff`, { responseType: 'blob' }));
}

/**
 * Get HAR file (JSON)
 * GET /artifacts/:pageId/har
 */
export function getHarFile(pageId: string): Promise<unknown> {
  return apiClient<unknown>(`/artifacts/${pageId}/har`);
}

/**
 * Get captured HTML
 * GET /artifacts/:pageId/html
 */
export function getHtml(pageId: string): Promise<string> {
  return fetchAs('text', apiClient(`/artifacts/${pageId}/html`, { responseType: 'text' }));
}
