import type { Page } from '@gander-tools/diff-voyager-shared';
import { randomUUID } from 'node:crypto';

/**
 * Input parameters for creating a new page
 */
export interface CreatePageInput {
  projectId: string;
  url: string;
  ignoreParams?: string[];
}

/**
 * PageModel - Domain model for managing pages within a project
 *
 * Encapsulates business logic for:
 * - URL normalization (trailing slash, query params, fragments)
 * - Page identification and comparison
 * - Serialization/deserialization
 */
export class PageModel {
  /**
   * Create a new page with normalized URL
   */
  static create(input: CreatePageInput): Page {
    if (!this.isValidUrl(input.url)) {
      throw new Error('Invalid URL');
    }

    const normalizedUrl = this.normalizeUrl(input.url, input.ignoreParams);

    const page: Page = {
      id: randomUUID(),
      projectId: input.projectId,
      normalizedUrl,
      originalUrl: input.url,
      createdAt: new Date(),
    };

    return page;
  }

  /**
   * Check if two pages represent the same page (same normalized URL)
   */
  static isSamePage(page1: Page, page2: Page): boolean {
    return page1.normalizedUrl === page2.normalizedUrl;
  }

  /**
   * Serialize page to JSON
   */
  static toJSON(page: Page): Record<string, unknown> {
    return {
      id: page.id,
      projectId: page.projectId,
      normalizedUrl: page.normalizedUrl,
      originalUrl: page.originalUrl,
      createdAt: page.createdAt.toISOString(),
    };
  }

  /**
   * Deserialize page from JSON
   */
  static fromJSON(json: Record<string, unknown>): Page {
    return {
      id: json.id as string,
      projectId: json.projectId as string,
      normalizedUrl: json.normalizedUrl as string,
      originalUrl: json.originalUrl as string,
      createdAt: new Date(json.createdAt as string),
    };
  }

  /**
   * Normalize URL for consistent comparison
   *
   * Normalization rules:
   * 1. Remove fragment (#section)
   * 2. Remove trailing slash from path
   * 3. Remove ignored query parameters
   * 4. Sort remaining query parameters alphabetically
   */
  private static normalizeUrl(
    url: string,
    ignoreParams: string[] = []
  ): string {
    const parsed = new URL(url);

    // Remove fragment
    parsed.hash = '';

    // Remove trailing slash from pathname (but keep it for root path)
    if (parsed.pathname !== '/' && parsed.pathname.endsWith('/')) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }

    // Filter and sort query parameters
    const params = new URLSearchParams(parsed.search);
    const sortedParams = new URLSearchParams();

    // Collect non-ignored params
    const paramEntries: Array<[string, string]> = [];
    for (const [key, value] of params) {
      if (!ignoreParams.includes(key)) {
        paramEntries.push([key, value]);
      }
    }

    // Sort alphabetically by key
    paramEntries.sort((a, b) => a[0].localeCompare(b[0]));

    // Build sorted query string
    for (const [key, value] of paramEntries) {
      sortedParams.append(key, value);
    }

    parsed.search = sortedParams.toString();

    return parsed.toString();
  }

  /**
   * Validate URL format
   */
  private static isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }
}
