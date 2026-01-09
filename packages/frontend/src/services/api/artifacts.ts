import { apiClient } from './client';

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
  // biome-ignore lint/suspicious/noExplicitAny: ofetch responseType compatibility for blob responses
  return apiClient<Blob>(`/artifacts/${pageId}/screenshot`, {
    responseType: 'blob',
  } as any);
}

/**
 * Get baseline screenshot (PNG)
 * GET /artifacts/:pageId/baseline-screenshot
 */
export function getBaselineScreenshot(pageId: string): Promise<Blob> {
  // biome-ignore lint/suspicious/noExplicitAny: ofetch responseType compatibility for blob responses
  return apiClient<Blob>(`/artifacts/${pageId}/baseline-screenshot`, {
    responseType: 'blob',
  } as any);
}

/**
 * Get visual diff image (PNG)
 * GET /artifacts/:pageId/diff
 */
export function getDiffImage(pageId: string): Promise<Blob> {
  // biome-ignore lint/suspicious/noExplicitAny: ofetch responseType compatibility for blob responses
  return apiClient<Blob>(`/artifacts/${pageId}/diff`, {
    responseType: 'blob',
  } as any);
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
  // biome-ignore lint/suspicious/noExplicitAny: ofetch responseType compatibility for text responses
  return apiClient<string>(`/artifacts/${pageId}/html`, {
    responseType: 'text',
  } as any);
}
