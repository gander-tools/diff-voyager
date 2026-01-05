import {
  type Project,
  type ProjectConfig,
  type CrawlConfig,
  type IgnoreFilters,
  type ViewportConfig,
  type ThresholdConfig,
  RunProfile,
} from '@gander-tools/diff-voyager-shared';
import { randomUUID } from 'node:crypto';

/**
 * Input parameters for creating a new project
 */
export interface CreateProjectInput {
  name: string;
  baseUrl: string;
  description?: string;
  config?: Partial<{
    runProfile: RunProfile;
    crawl: Partial<CrawlConfig>;
    ignoreFilters: Partial<IgnoreFilters>;
    viewport: Partial<ViewportConfig>;
    thresholds: Partial<ThresholdConfig>;
  }>;
}

/**
 * Input parameters for updating project configuration
 */
export interface UpdateConfigInput {
  runProfile?: RunProfile;
  crawl?: Partial<{
    scopeRules?: Partial<CrawlConfig['scopeRules']>;
    maxPages?: number;
    maxDurationMs?: number;
    maxConcurrency?: number;
    maxRetries?: number;
  }>;
  ignoreFilters?: Partial<IgnoreFilters>;
  viewport?: Partial<ViewportConfig>;
  thresholds?: Partial<ThresholdConfig>;
}

/**
 * ProjectModel - Domain model for managing crawl projects
 *
 * Encapsulates business logic for creating, validating, and managing projects.
 * Follows TDD principles with immutable updates and validation.
 */
export class ProjectModel {
  /**
   * Create a new project with default configuration
   */
  static create(input: CreateProjectInput): Project {
    // Validate inputs
    if (!input.name || input.name.trim() === '') {
      throw new Error('Project name cannot be empty');
    }

    if (!this.isValidUrl(input.baseUrl)) {
      throw new Error('Invalid base URL');
    }

    const normalizedBaseUrl = this.normalizeUrl(input.baseUrl);
    const now = new Date();

    const project: Project = {
      id: randomUUID(),
      name: input.name.trim(),
      description: input.description?.trim(),
      baseUrl: normalizedBaseUrl,
      createdAt: now,
      updatedAt: now,
      config: this.createDefaultConfig(normalizedBaseUrl, input.config),
    };

    return project;
  }

  /**
   * Update project configuration
   */
  static updateConfig(project: Project, updates: UpdateConfigInput): Project {
    const updatedConfig: ProjectConfig = {
      ...project.config,
      runProfile: updates.runProfile ?? project.config.runProfile,
      crawl: {
        ...project.config.crawl,
        ...(updates.crawl && {
          scopeRules: {
            ...project.config.crawl.scopeRules,
            ...updates.crawl.scopeRules,
          },
          maxPages: updates.crawl.maxPages ?? project.config.crawl.maxPages,
          maxDurationMs:
            updates.crawl.maxDurationMs ?? project.config.crawl.maxDurationMs,
          maxConcurrency:
            updates.crawl.maxConcurrency ?? project.config.crawl.maxConcurrency,
          maxRetries: updates.crawl.maxRetries ?? project.config.crawl.maxRetries,
        }),
      },
      ignoreFilters: {
        ...project.config.ignoreFilters,
        ...updates.ignoreFilters,
      },
      viewport: {
        ...project.config.viewport,
        ...updates.viewport,
      },
      thresholds: {
        ...project.config.thresholds,
        ...updates.thresholds,
      },
    };

    return {
      ...project,
      config: updatedConfig,
      updatedAt: new Date(),
    };
  }

  /**
   * Serialize project to JSON
   */
  static toJSON(project: Project): Record<string, unknown> {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      baseUrl: project.baseUrl,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      config: project.config,
    };
  }

  /**
   * Deserialize project from JSON
   */
  static fromJSON(json: Record<string, unknown>): Project {
    return {
      id: json.id as string,
      name: json.name as string,
      description: json.description as string | undefined,
      baseUrl: json.baseUrl as string,
      createdAt: new Date(json.createdAt as string),
      updatedAt: new Date(json.updatedAt as string),
      config: json.config as ProjectConfig,
    };
  }

  /**
   * Create default project configuration
   */
  private static createDefaultConfig(
    baseUrl: string,
    partial?: CreateProjectInput['config']
  ): ProjectConfig {
    const domain = new URL(baseUrl).hostname;

    return {
      crawl: {
        baseUrl,
        scopeRules: {
          includeDomains: [domain],
          includeSubdomains: true,
          excludePatterns: [],
          ...(partial?.crawl?.scopeRules || {}),
        },
        maxPages: partial?.crawl?.maxPages,
        maxDurationMs: partial?.crawl?.maxDurationMs,
        maxConcurrency: partial?.crawl?.maxConcurrency ?? 5,
        maxRetries: partial?.crawl?.maxRetries ?? 3,
      },
      runProfile: partial?.runProfile ?? RunProfile.VISUAL_SEO,
      ignoreFilters: {
        cssSelectors: [],
        xpathSelectors: [],
        httpHeaders: [],
        anonymizeFields: [],
        ...partial?.ignoreFilters,
      },
      viewport: {
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
        ...partial?.viewport,
      },
      thresholds: {
        visualDiffPercentage: 0.1, // 0.1% threshold by default
        performanceLoadTimeIncreaseMs: 1000, // 1s increase threshold
        performanceRequestCountIncrease: 10,
        performanceSizeIncreaseBytes: 100000, // 100KB increase threshold
        ...partial?.thresholds,
      },
    };
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

  /**
   * Normalize URL by removing trailing slash
   */
  private static normalizeUrl(url: string): string {
    return url.endsWith('/') ? url.slice(0, -1) : url;
  }
}
