import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectModel } from '../Project';
import type {
  Project,
  ProjectConfig,
  CrawlConfig,
  ScopeRules,
  RunProfile,
} from '@gander-tools/diff-voyager-shared';

describe('ProjectModel', () => {
  let mockProject: Project;
  let mockConfig: ProjectConfig;

  beforeEach(() => {
    const scopeRules: ScopeRules = {
      includeDomains: ['example.com'],
      includeSubdomains: true,
      excludePatterns: ['/admin/*', '/api/*'],
      includePatterns: ['/*'],
    };

    const crawlConfig: CrawlConfig = {
      baseUrl: 'https://example.com',
      scopeRules,
      maxPages: 100,
      maxDurationMs: 3600000,
      maxConcurrency: 5,
      maxRetries: 3,
    };

    mockConfig = {
      crawl: crawlConfig,
      runProfile: 'visual_seo' as RunProfile,
      ignoreFilters: {
        cssSelectors: ['.timestamp', '#dynamic-content'],
        xpathSelectors: [],
        httpHeaders: ['Set-Cookie', 'Date'],
        anonymizeFields: [],
      },
      viewport: {
        width: 1920,
        height: 1080,
      },
      thresholds: {
        visualDiffPixelThreshold: 0.01,
        performanceThresholdMs: 500,
      },
    };

    mockProject = {
      id: 'project-1',
      name: 'My Test Project',
      description: 'A test project for framework migration',
      baseUrl: 'https://example.com',
      config: mockConfig,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    };
  });

  describe('constructor', () => {
    it('should create a ProjectModel instance from Project data', () => {
      const model = new ProjectModel(mockProject);

      expect(model.id).toBe('project-1');
      expect(model.name).toBe('My Test Project');
      expect(model.description).toBe('A test project for framework migration');
      expect(model.baseUrl).toBe('https://example.com');
      expect(model.config).toEqual(mockConfig);
      expect(model.createdAt).toEqual(new Date('2024-01-01T00:00:00Z'));
      expect(model.updatedAt).toEqual(new Date('2024-01-01T00:00:00Z'));
    });

    it('should create a new ProjectModel with default values when minimal data provided', () => {
      const minimal = ProjectModel.create({
        name: 'Minimal Project',
        baseUrl: 'https://minimal.com',
      });

      expect(minimal.name).toBe('Minimal Project');
      expect(minimal.baseUrl).toBe('https://minimal.com');
      expect(minimal.id).toBeDefined();
      expect(minimal.config).toBeDefined();
      expect(minimal.config.crawl.baseUrl).toBe('https://minimal.com');
      expect(minimal.createdAt).toBeInstanceOf(Date);
      expect(minimal.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('create', () => {
    it('should create a new project with generated ID and timestamps', () => {
      const newProject = ProjectModel.create({
        name: 'New Project',
        baseUrl: 'https://new.com',
        description: 'A new project',
      });

      expect(newProject.id).toBeDefined();
      expect(newProject.id).toMatch(/^[a-z0-9-]+$/);
      expect(newProject.name).toBe('New Project');
      expect(newProject.description).toBe('A new project');
      expect(newProject.baseUrl).toBe('https://new.com');
      expect(newProject.createdAt).toBeInstanceOf(Date);
      expect(newProject.updatedAt).toBeInstanceOf(Date);
    });

    it('should create project with default config when not provided', () => {
      const newProject = ProjectModel.create({
        name: 'Default Config Project',
        baseUrl: 'https://default.com',
      });

      expect(newProject.config).toBeDefined();
      expect(newProject.config.crawl.baseUrl).toBe('https://default.com');
      expect(newProject.config.runProfile).toBe('visual_seo');
      expect(newProject.config.viewport.width).toBe(1920);
      expect(newProject.config.viewport.height).toBe(1080);
    });

    it('should merge provided config with defaults', () => {
      const customConfig: Partial<ProjectConfig> = {
        runProfile: 'full' as RunProfile,
        viewport: {
          width: 1024,
          height: 768,
        },
      };

      const newProject = ProjectModel.create({
        name: 'Custom Config Project',
        baseUrl: 'https://custom.com',
        config: customConfig,
      });

      expect(newProject.config.runProfile).toBe('full');
      expect(newProject.config.viewport.width).toBe(1024);
      expect(newProject.config.viewport.height).toBe(768);
      expect(newProject.config.crawl.baseUrl).toBe('https://custom.com');
    });
  });

  describe('validation', () => {
    it('should validate a valid project', () => {
      const model = new ProjectModel(mockProject);
      const validation = model.validate();

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toEqual([]);
    });

    it('should fail validation when name is empty', () => {
      const invalid = { ...mockProject, name: '' };
      const model = new ProjectModel(invalid);
      const validation = model.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Project name is required');
    });

    it('should fail validation when baseUrl is invalid', () => {
      const invalid = { ...mockProject, baseUrl: 'not-a-url' };
      const model = new ProjectModel(invalid);
      const validation = model.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Base URL must be a valid URL');
    });

    it('should fail validation when baseUrl is missing protocol', () => {
      const invalid = { ...mockProject, baseUrl: 'example.com' };
      const model = new ProjectModel(invalid);
      const validation = model.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Base URL must be a valid URL');
    });

    it('should fail validation when maxPages is negative', () => {
      const invalid = {
        ...mockProject,
        config: {
          ...mockProject.config,
          crawl: {
            ...mockProject.config.crawl,
            maxPages: -1,
          },
        },
      };
      const model = new ProjectModel(invalid);
      const validation = model.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Max pages must be greater than 0');
    });
  });

  describe('update', () => {
    it('should update project properties and updatedAt timestamp', () => {
      const model = new ProjectModel(mockProject);
      const originalUpdatedAt = model.updatedAt;

      // Wait a bit to ensure timestamp difference
      const updated = model.update({
        name: 'Updated Project Name',
        description: 'Updated description',
      });

      expect(updated.name).toBe('Updated Project Name');
      expect(updated.description).toBe('Updated description');
      expect(updated.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      expect(updated.id).toBe(model.id);
      expect(updated.createdAt).toEqual(model.createdAt);
    });

    it('should update config and maintain other properties', () => {
      const model = new ProjectModel(mockProject);

      const updated = model.update({
        config: {
          ...model.config,
          runProfile: 'full' as RunProfile,
        },
      });

      expect(updated.config.runProfile).toBe('full');
      expect(updated.name).toBe(model.name);
      expect(updated.baseUrl).toBe(model.baseUrl);
    });
  });

  describe('toJSON', () => {
    it('should serialize to Project interface', () => {
      const model = new ProjectModel(mockProject);
      const json = model.toJSON();

      expect(json).toEqual(mockProject);
      expect(json.id).toBe(mockProject.id);
      expect(json.name).toBe(mockProject.name);
      expect(json.config).toEqual(mockProject.config);
    });

    it('should produce JSON with Date objects', () => {
      const model = new ProjectModel(mockProject);
      const json = model.toJSON();

      expect(json.createdAt).toBeInstanceOf(Date);
      expect(json.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('clone', () => {
    it('should create a deep copy of the project model', () => {
      const model = new ProjectModel(mockProject);
      const cloned = model.clone();

      expect(cloned).not.toBe(model);
      expect(cloned.id).toBe(model.id);
      expect(cloned.name).toBe(model.name);
      expect(cloned.config).toEqual(model.config);
      expect(cloned.config).not.toBe(model.config);
    });

    it('should allow independent modifications after cloning', () => {
      const model = new ProjectModel(mockProject);
      const cloned = model.clone();

      const modified = cloned.update({ name: 'Modified Clone' });

      expect(modified.name).toBe('Modified Clone');
      expect(model.name).toBe('My Test Project');
    });
  });

  describe('helper methods', () => {
    it('should check if project has visual_seo profile', () => {
      const model = new ProjectModel(mockProject);
      expect(model.isVisualSeoProfile()).toBe(true);
    });

    it('should check if project has full profile', () => {
      const fullProfile = {
        ...mockProject,
        config: {
          ...mockProject.config,
          runProfile: 'full' as RunProfile,
        },
      };
      const model = new ProjectModel(fullProfile);
      expect(model.isFullProfile()).toBe(true);
    });

    it('should check if project has minimal profile', () => {
      const minimalProfile = {
        ...mockProject,
        config: {
          ...mockProject.config,
          runProfile: 'minimal' as RunProfile,
        },
      };
      const model = new ProjectModel(minimalProfile);
      expect(model.isMinimalProfile()).toBe(true);
    });

    it('should get max pages from config', () => {
      const model = new ProjectModel(mockProject);
      expect(model.getMaxPages()).toBe(100);
    });

    it('should get max duration from config', () => {
      const model = new ProjectModel(mockProject);
      expect(model.getMaxDuration()).toBe(3600000);
    });

    it('should get viewport dimensions', () => {
      const model = new ProjectModel(mockProject);
      expect(model.getViewport()).toEqual({ width: 1920, height: 1080 });
    });
  });
});
