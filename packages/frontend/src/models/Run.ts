import type {
  Run,
  RunConfig,
  RunStatistics,
  RunStatus,
} from '@gander-tools/diff-voyager-shared';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface CreateRunParams {
  projectId: string;
  baselineId: string;
  config: RunConfig;
}

export class RunModel implements Run {
  id: string;
  projectId: string;
  baselineId: string;
  status: RunStatus;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  config: RunConfig;
  statistics?: RunStatistics;

  constructor(data: Run) {
    this.id = data.id;
    this.projectId = data.projectId;
    this.baselineId = data.baselineId;
    this.status = data.status;
    this.createdAt = data.createdAt;
    this.startedAt = data.startedAt;
    this.completedAt = data.completedAt;
    this.config = data.config;
    this.statistics = data.statistics;
  }

  /**
   * Creates a new run with default values
   */
  static create(params: CreateRunParams): RunModel {
    const run: Run = {
      id: RunModel.generateId(),
      projectId: params.projectId,
      baselineId: params.baselineId,
      status: 'new',
      createdAt: new Date(),
      config: params.config,
    };

    return new RunModel(run);
  }

  /**
   * Generates a unique ID for a new run
   */
  private static generateId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 9);
    return `run-${timestamp}-${random}`;
  }

  /**
   * Validates the run data
   */
  validate(): ValidationResult {
    const errors: string[] = [];

    // Validate projectId
    if (!this.projectId || this.projectId.trim().length === 0) {
      errors.push('Project ID is required');
    }

    // Validate baselineId
    if (!this.baselineId || this.baselineId.trim().length === 0) {
      errors.push('Baseline ID is required');
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
   * Starts the run (sets status to in_progress)
   */
  start(): RunModel {
    const updated: Run = {
      ...this.toJSON(),
      status: 'in_progress',
      startedAt: new Date(),
      completedAt: undefined,
    };

    return new RunModel(updated);
  }

  /**
   * Completes the run (sets status to completed)
   */
  complete(): RunModel {
    const updated: Run = {
      ...this.toJSON(),
      status: 'completed',
      completedAt: new Date(),
    };

    return new RunModel(updated);
  }

  /**
   * Interrupts the run (sets status to interrupted)
   */
  interrupt(): RunModel {
    const updated: Run = {
      ...this.toJSON(),
      status: 'interrupted',
    };

    return new RunModel(updated);
  }

  /**
   * Updates the run statistics
   */
  updateStatistics(statistics: RunStatistics): RunModel {
    const updated: Run = {
      ...this.toJSON(),
      statistics,
    };

    return new RunModel(updated);
  }

  /**
   * Checks if the run is new
   */
  isNew(): boolean {
    return this.status === 'new';
  }

  /**
   * Checks if the run is in progress
   */
  isInProgress(): boolean {
    return this.status === 'in_progress';
  }

  /**
   * Checks if the run is completed
   */
  isCompleted(): boolean {
    return this.status === 'completed';
  }

  /**
   * Checks if the run is interrupted
   */
  isInterrupted(): boolean {
    return this.status === 'interrupted';
  }

  /**
   * Checks if the run is finished (completed or interrupted)
   */
  isFinished(): boolean {
    return this.isCompleted() || this.isInterrupted();
  }

  /**
   * Gets the total number of pages
   */
  getTotalPages(): number {
    return this.statistics?.totalPages || 0;
  }

  /**
   * Gets the number of completed pages
   */
  getCompletedPages(): number {
    return this.statistics?.completedPages || 0;
  }

  /**
   * Gets the number of error pages
   */
  getErrorPages(): number {
    return this.statistics?.errorPages || 0;
  }

  /**
   * Gets the number of changed pages
   */
  getChangedPages(): number {
    return this.statistics?.changedPages || 0;
  }

  /**
   * Gets the number of unchanged pages
   */
  getUnchangedPages(): number {
    return this.statistics?.unchangedPages || 0;
  }

  /**
   * Gets the number of critical differences
   */
  getCriticalDifferences(): number {
    return this.statistics?.criticalDifferences || 0;
  }

  /**
   * Calculates the progress percentage
   */
  getProgress(): number {
    const total = this.getTotalPages();
    if (total === 0) return 0;

    const completed = this.getCompletedPages();
    return Math.round((completed / total) * 100);
  }

  /**
   * Calculates the success rate (percentage of pages without errors)
   */
  getSuccessRate(): number {
    const total = this.getTotalPages();
    if (total === 0) return 0;

    const errors = this.getErrorPages();
    return Math.round(((total - errors) / total) * 100);
  }

  /**
   * Checks if the run has critical differences
   */
  hasCriticalDifferences(): boolean {
    return this.getCriticalDifferences() > 0;
  }

  /**
   * Checks if the run has any changes
   */
  hasChanges(): boolean {
    return this.getChangedPages() > 0;
  }

  /**
   * Calculates the duration of the run in milliseconds
   */
  getDuration(): number | null {
    if (!this.startedAt) return null;

    const endTime = this.completedAt || new Date();
    return endTime.getTime() - this.startedAt.getTime();
  }

  /**
   * Checks if the run uses the visual_seo profile
   */
  isVisualSeoProfile(): boolean {
    return this.config.profile === 'visual_seo';
  }

  /**
   * Checks if the run uses the full profile
   */
  isFullProfile(): boolean {
    return this.config.profile === 'full';
  }

  /**
   * Checks if the run uses the minimal profile
   */
  isMinimalProfile(): boolean {
    return this.config.profile === 'minimal';
  }

  /**
   * Checks if screenshots are captured in this run
   */
  capturesScreenshots(): boolean {
    return this.config.captureScreenshots;
  }

  /**
   * Checks if HAR files are captured in this run
   */
  capturesHar(): boolean {
    return this.config.captureHar;
  }

  /**
   * Checks if diff images are generated in this run
   */
  generatesDiffImages(): boolean {
    return this.config.generateDiffImages;
  }

  /**
   * Serializes the run to JSON
   */
  toJSON(): Run {
    return {
      id: this.id,
      projectId: this.projectId,
      baselineId: this.baselineId,
      status: this.status,
      createdAt: this.createdAt,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      config: this.config,
      statistics: this.statistics,
    };
  }

  /**
   * Creates a deep copy of the run
   */
  clone(): RunModel {
    const cloned: Run = {
      id: this.id,
      projectId: this.projectId,
      baselineId: this.baselineId,
      status: this.status,
      createdAt: new Date(this.createdAt),
      startedAt: this.startedAt ? new Date(this.startedAt) : undefined,
      completedAt: this.completedAt ? new Date(this.completedAt) : undefined,
      config: JSON.parse(JSON.stringify(this.config)),
      statistics: this.statistics
        ? JSON.parse(JSON.stringify(this.statistics))
        : undefined,
    };

    return new RunModel(cloned);
  }
}
