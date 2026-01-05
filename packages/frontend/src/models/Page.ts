import type { Page } from '@gander-tools/diff-voyager-shared';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface CreatePageParams {
  projectId: string;
  normalizedUrl: string;
  originalUrl?: string;
}

export class PageModel implements Page {
  id: string;
  projectId: string;
  normalizedUrl: string;
  originalUrl: string;
  createdAt: Date;

  constructor(data: Page) {
    this.id = data.id;
    this.projectId = data.projectId;
    this.normalizedUrl = data.normalizedUrl;
    this.originalUrl = data.originalUrl;
    this.createdAt = data.createdAt;
  }

  /**
   * Creates a new page
   */
  static create(params: CreatePageParams): PageModel {
    const page: Page = {
      id: PageModel.generateId(),
      projectId: params.projectId,
      normalizedUrl: params.normalizedUrl,
      originalUrl: params.originalUrl || params.normalizedUrl,
      createdAt: new Date(),
    };

    return new PageModel(page);
  }

  /**
   * Generates a unique ID for a new page
   */
  private static generateId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 9);
    return `page-${timestamp}-${random}`;
  }

  /**
   * Normalizes a URL by removing query parameters, hash, and trailing slash
   */
  static normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url);

      // Build normalized URL: protocol + hostname + port (if non-standard) + pathname
      let normalized = `${parsed.protocol}//${parsed.hostname}`;

      // Add port if it's not the default for the protocol
      if (
        (parsed.protocol === 'http:' && parsed.port && parsed.port !== '80') ||
        (parsed.protocol === 'https:' && parsed.port && parsed.port !== '443')
      ) {
        normalized += `:${parsed.port}`;
      } else if (
        parsed.protocol !== 'http:' &&
        parsed.protocol !== 'https:' &&
        parsed.port
      ) {
        normalized += `:${parsed.port}`;
      }

      // Add pathname, removing trailing slash (except for root)
      let pathname = parsed.pathname;
      if (pathname !== '/' && pathname.endsWith('/')) {
        pathname = pathname.slice(0, -1);
      }

      // Don't add '/' for root path
      if (pathname === '/') {
        // normalized already has protocol://hostname
      } else {
        normalized += pathname;
      }

      return normalized;
    } catch {
      // If URL parsing fails, return the original URL
      return url;
    }
  }

  /**
   * Validates the page data
   */
  validate(): ValidationResult {
    const errors: string[] = [];

    // Validate projectId
    if (!this.projectId || this.projectId.trim().length === 0) {
      errors.push('Project ID is required');
    }

    // Validate normalizedUrl
    if (!this.normalizedUrl || this.normalizedUrl.trim().length === 0) {
      errors.push('Normalized URL is required');
    } else if (!this.isValidUrl(this.normalizedUrl)) {
      errors.push('Normalized URL must be a valid URL');
    }

    // Validate originalUrl
    if (!this.originalUrl || this.originalUrl.trim().length === 0) {
      errors.push('Original URL is required');
    } else if (!this.isValidUrl(this.originalUrl)) {
      errors.push('Original URL must be a valid URL');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Checks if a string is a valid URL
   */
  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Checks if this page matches a given URL (after normalization)
   */
  matchesUrl(url: string): boolean {
    const normalized = PageModel.normalizeUrl(url);
    return this.normalizedUrl === normalized;
  }

  /**
   * Checks if the original URL differs from the normalized URL
   */
  hasUrlChanged(): boolean {
    return this.normalizedUrl !== this.originalUrl;
  }

  /**
   * Gets the pathname from the normalized URL
   */
  getPath(): string {
    try {
      const parsed = new URL(this.normalizedUrl);
      return parsed.pathname;
    } catch {
      return '';
    }
  }

  /**
   * Gets the hostname from the normalized URL
   */
  getHostname(): string {
    try {
      const parsed = new URL(this.normalizedUrl);
      return parsed.hostname;
    } catch {
      return '';
    }
  }

  /**
   * Gets the full normalized URL
   */
  getUrl(): string {
    return this.normalizedUrl;
  }

  /**
   * Serializes the page to JSON
   */
  toJSON(): Page {
    return {
      id: this.id,
      projectId: this.projectId,
      normalizedUrl: this.normalizedUrl,
      originalUrl: this.originalUrl,
      createdAt: this.createdAt,
    };
  }

  /**
   * Creates a deep copy of the page
   */
  clone(): PageModel {
    const cloned: Page = {
      id: this.id,
      projectId: this.projectId,
      normalizedUrl: this.normalizedUrl,
      originalUrl: this.originalUrl,
      createdAt: new Date(this.createdAt),
    };

    return new PageModel(cloned);
  }
}
