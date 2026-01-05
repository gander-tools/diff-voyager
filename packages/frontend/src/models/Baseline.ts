import type {
  Baseline,
  RunConfig,
  ViewportConfig,
} from '@gander-tools/diff-voyager-shared';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface CreateBaselineParams {
  projectId: string;
  runId: string;
  pageCount: number;
  config: RunConfig;
}

export class BaselineModel implements Baseline {
  id: string;
  projectId: string;
  createdAt: Date;
  runId: string;
  pageCount: number;
  config: RunConfig;

  constructor(data: Baseline) {
    this.id = data.id;
    this.projectId = data.projectId;
    this.createdAt = data.createdAt;
    this.runId = data.runId;
    this.pageCount = data.pageCount;
    this.config = data.config;
  }

  /**
   * Creates a new baseline
   */
  static create(params: CreateBaselineParams): BaselineModel {
    const baseline: Baseline = {
      id: BaselineModel.generateId(),
      projectId: params.projectId,
      createdAt: new Date(),
      runId: params.runId,
      pageCount: params.pageCount,
      config: params.config,
    };

    return new BaselineModel(baseline);
  }

  /**
   * Generates a unique ID for a new baseline
   */
  private static generateId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 9);
    return `baseline-${timestamp}-${random}`;
  }

  /**
   * Validates the baseline data
   */
  validate(): ValidationResult {
    const errors: string[] = [];

    // Validate projectId
    if (!this.projectId || this.projectId.trim().length === 0) {
      errors.push('Project ID is required');
    }

    // Validate runId
    if (!this.runId || this.runId.trim().length === 0) {
      errors.push('Run ID is required');
    }

    // Validate pageCount
    if (this.pageCount < 0) {
      errors.push('Page count must be non-negative');
    }

    // Validate viewport dimensions
    if (this.config.viewport.width <= 0 || this.config.viewport.height <= 0) {
      errors.push('Viewport dimensions must be greater than 0');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Serializes the baseline to JSON
   */
  toJSON(): Baseline {
    return {
      id: this.id,
      projectId: this.projectId,
      createdAt: this.createdAt,
      runId: this.runId,
      pageCount: this.pageCount,
      config: this.config,
    };
  }

  /**
   * Creates a deep copy of the baseline
   */
  clone(): BaselineModel {
    const cloned: Baseline = {
      id: this.id,
      projectId: this.projectId,
      createdAt: new Date(this.createdAt),
      runId: this.runId,
      pageCount: this.pageCount,
      config: JSON.parse(JSON.stringify(this.config)),
    };

    return new BaselineModel(cloned);
  }

  /**
   * Checks if the baseline uses the visual_seo profile
   */
  isVisualSeoProfile(): boolean {
    return this.config.profile === 'visual_seo';
  }

  /**
   * Checks if the baseline uses the full profile
   */
  isFullProfile(): boolean {
    return this.config.profile === 'full';
  }

  /**
   * Checks if the baseline uses the minimal profile
   */
  isMinimalProfile(): boolean {
    return this.config.profile === 'minimal';
  }

  /**
   * Checks if screenshots are captured in this baseline
   */
  capturesScreenshots(): boolean {
    return this.config.captureScreenshots;
  }

  /**
   * Checks if HAR files are captured in this baseline
   */
  capturesHar(): boolean {
    return this.config.captureHar;
  }

  /**
   * Checks if diff images are generated in this baseline
   */
  generatesDiffImages(): boolean {
    return this.config.generateDiffImages;
  }

  /**
   * Gets the viewport configuration
   */
  getViewport(): ViewportConfig {
    return this.config.viewport;
  }

  /**
   * Gets the page count
   */
  getPageCount(): number {
    return this.pageCount;
  }

  /**
   * Checks if the baseline has any pages
   */
  hasPages(): boolean {
    return this.pageCount > 0;
  }
}
