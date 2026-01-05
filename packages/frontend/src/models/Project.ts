import type {
  Project,
  ProjectConfig,
  CrawlConfig,
  ScopeRules,
  RunProfile,
  IgnoreFilters,
  ViewportConfig,
  ThresholdConfig,
} from '@gander-tools/diff-voyager-shared';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface CreateProjectParams {
  name: string;
  baseUrl: string;
  description?: string;
  config?: Partial<ProjectConfig>;
}

export class ProjectModel implements Project {
  id: string;
  name: string;
  description?: string;
  baseUrl: string;
  config: ProjectConfig;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Project) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.baseUrl = data.baseUrl;
    this.config = data.config;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  /**
   * Creates a new project with default configuration
   */
  static create(params: CreateProjectParams): ProjectModel {
    const defaultScopeRules: ScopeRules = {
      includeDomains: [new URL(params.baseUrl).hostname],
      includeSubdomains: true,
      excludePatterns: [],
      includePatterns: ['/*'],
    };

    const defaultCrawlConfig: CrawlConfig = {
      baseUrl: params.baseUrl,
      scopeRules: defaultScopeRules,
      maxPages: 1000,
      maxDurationMs: 3600000, // 1 hour
      maxConcurrency: 5,
      maxRetries: 3,
    };

    const defaultIgnoreFilters: IgnoreFilters = {
      cssSelectors: [],
      xpathSelectors: [],
      httpHeaders: [],
      anonymizeFields: [],
    };

    const defaultViewport: ViewportConfig = {
      width: 1920,
      height: 1080,
    };

    const defaultThresholds: ThresholdConfig = {
      visualDiffPixelThreshold: 0.1,
      performanceThresholdMs: 1000,
    };

    const defaultConfig: ProjectConfig = {
      crawl: defaultCrawlConfig,
      runProfile: 'visual_seo' as RunProfile,
      ignoreFilters: defaultIgnoreFilters,
      viewport: defaultViewport,
      thresholds: defaultThresholds,
    };

    // Merge provided config with defaults
    const config: ProjectConfig = {
      crawl: {
        ...defaultCrawlConfig,
        ...(params.config?.crawl || {}),
      },
      runProfile: params.config?.runProfile || defaultConfig.runProfile,
      ignoreFilters: {
        ...defaultIgnoreFilters,
        ...(params.config?.ignoreFilters || {}),
      },
      viewport: {
        ...defaultViewport,
        ...(params.config?.viewport || {}),
      },
      thresholds: {
        ...defaultThresholds,
        ...(params.config?.thresholds || {}),
      },
    };

    const now = new Date();

    const project: Project = {
      id: ProjectModel.generateId(),
      name: params.name,
      description: params.description,
      baseUrl: params.baseUrl,
      config,
      createdAt: now,
      updatedAt: now,
    };

    return new ProjectModel(project);
  }

  /**
   * Generates a unique ID for a new project
   */
  private static generateId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 9);
    return `project-${timestamp}-${random}`;
  }

  /**
   * Validates the project data
   */
  validate(): ValidationResult {
    const errors: string[] = [];

    // Validate name
    if (!this.name || this.name.trim().length === 0) {
      errors.push('Project name is required');
    }

    // Validate baseUrl
    if (!this.baseUrl || !this.isValidUrl(this.baseUrl)) {
      errors.push('Base URL must be a valid URL');
    }

    // Validate maxPages
    if (this.config.crawl.maxPages <= 0) {
      errors.push('Max pages must be greater than 0');
    }

    // Validate maxDurationMs
    if (this.config.crawl.maxDurationMs <= 0) {
      errors.push('Max duration must be greater than 0');
    }

    // Validate maxConcurrency
    if (this.config.crawl.maxConcurrency <= 0) {
      errors.push('Max concurrency must be greater than 0');
    }

    // Validate viewport
    if (this.config.viewport.width <= 0 || this.config.viewport.height <= 0) {
      errors.push('Viewport dimensions must be greater than 0');
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
   * Updates project properties and returns a new instance
   */
  update(updates: Partial<Omit<Project, 'id' | 'createdAt'>>): ProjectModel {
    const updated: Project = {
      ...this.toJSON(),
      ...updates,
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    };

    return new ProjectModel(updated);
  }

  /**
   * Serializes the project to JSON
   */
  toJSON(): Project {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      baseUrl: this.baseUrl,
      config: this.config,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Creates a deep copy of the project
   */
  clone(): ProjectModel {
    const cloned: Project = {
      id: this.id,
      name: this.name,
      description: this.description,
      baseUrl: this.baseUrl,
      config: JSON.parse(JSON.stringify(this.config)),
      createdAt: new Date(this.createdAt),
      updatedAt: new Date(this.updatedAt),
    };

    return new ProjectModel(cloned);
  }

  /**
   * Checks if the project uses the visual_seo profile
   */
  isVisualSeoProfile(): boolean {
    return this.config.runProfile === 'visual_seo';
  }

  /**
   * Checks if the project uses the full profile
   */
  isFullProfile(): boolean {
    return this.config.runProfile === 'full';
  }

  /**
   * Checks if the project uses the minimal profile
   */
  isMinimalProfile(): boolean {
    return this.config.runProfile === 'minimal';
  }

  /**
   * Gets the maximum number of pages to crawl
   */
  getMaxPages(): number {
    return this.config.crawl.maxPages;
  }

  /**
   * Gets the maximum duration for crawling in milliseconds
   */
  getMaxDuration(): number {
    return this.config.crawl.maxDurationMs;
  }

  /**
   * Gets the viewport configuration
   */
  getViewport(): ViewportConfig {
    return this.config.viewport;
  }
}
