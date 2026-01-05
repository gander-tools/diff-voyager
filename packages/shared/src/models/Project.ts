import { randomUUID } from 'node:crypto';
import type { Project, ProjectConfig } from '../types/index.js';

/**
 * Domain model for Project with validation and business logic
 */
export class ProjectModel {
  /**
   * Creates a new project with validation
   */
  static create(data: {
    name: string;
    description?: string;
    baseUrl: string;
    config: ProjectConfig;
  }): Project {
    // Validate name
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Project name cannot be empty');
    }

    // Validate baseUrl
    this.validateUrl(data.baseUrl);

    // Validate config
    this.validateConfig(data.config, data.baseUrl);

    const now = new Date();

    return {
      id: randomUUID(),
      name: data.name.trim(),
      description: data.description,
      baseUrl: data.baseUrl,
      createdAt: now,
      updatedAt: now,
      config: data.config,
    };
  }

  /**
   * Updates an existing project
   */
  static update(
    project: Project,
    updates: {
      name?: string;
      description?: string;
      config?: ProjectConfig;
    },
  ): Project {
    const updated = { ...project };

    if (updates.name !== undefined) {
      if (!updates.name || updates.name.trim().length === 0) {
        throw new Error('Project name cannot be empty');
      }
      updated.name = updates.name.trim();
    }

    if (updates.description !== undefined) {
      updated.description = updates.description;
    }

    if (updates.config !== undefined) {
      this.validateConfig(updates.config, project.baseUrl);
      updated.config = updates.config;
    }

    updated.updatedAt = new Date();

    return updated;
  }

  /**
   * Serializes project to JSON-compatible format
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
   * Deserializes project from JSON
   */
  static fromJSON(data: {
    id: string;
    name: string;
    description?: string;
    baseUrl: string;
    createdAt: string;
    updatedAt: string;
    config: ProjectConfig;
  }): Project {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      baseUrl: data.baseUrl,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      config: data.config,
    };
  }

  /**
   * Validates URL format
   */
  private static validateUrl(url: string): void {
    if (!url || url.trim().length === 0) {
      throw new Error('Base URL must be a valid URL');
    }

    try {
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Base URL must be a valid URL');
      }
    } catch {
      throw new Error('Base URL must be a valid URL');
    }
  }

  /**
   * Validates project configuration
   */
  private static validateConfig(
    config: ProjectConfig,
    projectBaseUrl: string,
  ): void {
    // Validate crawl config baseUrl matches project baseUrl
    if (config.crawl.baseUrl !== projectBaseUrl) {
      throw new Error('Crawl config baseUrl must match project baseUrl');
    }

    // Validate viewport
    if (config.viewport.width <= 0) {
      throw new Error('Viewport width must be greater than 0');
    }

    if (config.viewport.height <= 0) {
      throw new Error('Viewport height must be greater than 0');
    }

    // Validate thresholds
    if (
      config.thresholds.visualDiffPercentage < 0 ||
      config.thresholds.visualDiffPercentage > 100
    ) {
      throw new Error('Visual diff percentage must be between 0 and 100');
    }
  }
}
