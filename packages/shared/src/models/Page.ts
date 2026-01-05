import { randomUUID } from 'node:crypto';
import type { Page } from '../types/index.js';

/**
 * Domain model for Page with validation and business logic
 */
export class PageModel {
  /**
   * Creates a new page with validation
   */
  static create(data: {
    projectId: string;
    originalUrl: string;
    normalizedUrl: string;
  }): Page {
    // Validate projectId
    if (!data.projectId || data.projectId.trim().length === 0) {
      throw new Error('Project ID cannot be empty');
    }

    // Validate originalUrl
    if (!data.originalUrl || data.originalUrl.trim().length === 0) {
      throw new Error('Original URL cannot be empty');
    }

    this.validateUrl(data.originalUrl, 'Original URL');

    // Validate normalizedUrl
    if (!data.normalizedUrl || data.normalizedUrl.trim().length === 0) {
      throw new Error('Normalized URL cannot be empty');
    }

    this.validateUrl(data.normalizedUrl, 'Normalized URL');

    return {
      id: randomUUID(),
      projectId: data.projectId,
      originalUrl: data.originalUrl,
      normalizedUrl: data.normalizedUrl,
      createdAt: new Date(),
    };
  }

  /**
   * Normalizes a URL by removing query params, fragments, and trailing slashes
   */
  static normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url);

      // Remove query params and fragment
      parsed.search = '';
      parsed.hash = '';

      // Convert to string and remove trailing slash
      let normalized = parsed.toString();
      if (normalized.endsWith('/') && parsed.pathname === '/') {
        // Remove trailing slash from root URLs
        normalized = normalized.slice(0, -1);
      } else if (normalized.endsWith('/')) {
        normalized = normalized.slice(0, -1);
      }

      // Convert to lowercase
      return normalized.toLowerCase();
    } catch {
      throw new Error('Invalid URL');
    }
  }

  /**
   * Serializes page to JSON-compatible format
   */
  static toJSON(page: Page): Record<string, unknown> {
    return {
      id: page.id,
      projectId: page.projectId,
      originalUrl: page.originalUrl,
      normalizedUrl: page.normalizedUrl,
      createdAt: page.createdAt.toISOString(),
    };
  }

  /**
   * Deserializes page from JSON
   */
  static fromJSON(data: {
    id: string;
    projectId: string;
    originalUrl: string;
    normalizedUrl: string;
    createdAt: string;
  }): Page {
    return {
      id: data.id,
      projectId: data.projectId,
      originalUrl: data.originalUrl,
      normalizedUrl: data.normalizedUrl,
      createdAt: new Date(data.createdAt),
    };
  }

  /**
   * Validates URL format
   */
  private static validateUrl(url: string, fieldName: string): void {
    try {
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error(`${fieldName} must be a valid URL`);
      }
    } catch {
      throw new Error(`${fieldName} must be a valid URL`);
    }
  }
}
