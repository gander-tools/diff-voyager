import { describe, it, expect } from 'vitest';
import { ProjectModel } from './Project.js';
import { RunProfile } from '../enums/index.js';
import type { ProjectConfig } from '../types/index.js';

describe('ProjectModel', () => {
  const validConfig: ProjectConfig = {
    crawl: {
      baseUrl: 'https://example.com',
      scopeRules: {
        includeDomains: ['example.com'],
        includeSubdomains: true,
        excludePatterns: [],
      },
    },
    runProfile: RunProfile.VISUAL_SEO,
    ignoreFilters: {
      cssSelectors: [],
      xpathSelectors: [],
      httpHeaders: [],
      anonymizeFields: [],
    },
    viewport: {
      width: 1920,
      height: 1080,
    },
    thresholds: {
      visualDiffPercentage: 0.1,
    },
  };

  describe('create', () => {
    it('should create a new project with valid data', () => {
      const project = ProjectModel.create({
        name: 'Test Project',
        description: 'A test project',
        baseUrl: 'https://example.com',
        config: validConfig,
      });

      expect(project.id).toBeDefined();
      expect(project.name).toBe('Test Project');
      expect(project.description).toBe('A test project');
      expect(project.baseUrl).toBe('https://example.com');
      expect(project.createdAt).toBeInstanceOf(Date);
      expect(project.updatedAt).toBeInstanceOf(Date);
      expect(project.config).toEqual(validConfig);
    });

    it('should create a project without optional description', () => {
      const project = ProjectModel.create({
        name: 'Test Project',
        baseUrl: 'https://example.com',
        config: validConfig,
      });

      expect(project.description).toBeUndefined();
    });

    it('should generate unique IDs for different projects', () => {
      const project1 = ProjectModel.create({
        name: 'Project 1',
        baseUrl: 'https://example.com',
        config: validConfig,
      });

      const project2 = ProjectModel.create({
        name: 'Project 2',
        baseUrl: 'https://example.com',
        config: validConfig,
      });

      expect(project1.id).not.toBe(project2.id);
    });

    it('should set createdAt and updatedAt to the same time initially', () => {
      const project = ProjectModel.create({
        name: 'Test Project',
        baseUrl: 'https://example.com',
        config: validConfig,
      });

      expect(project.createdAt.getTime()).toBe(project.updatedAt.getTime());
    });
  });

  describe('validation', () => {
    it('should throw error if name is empty', () => {
      expect(() =>
        ProjectModel.create({
          name: '',
          baseUrl: 'https://example.com',
          config: validConfig,
        }),
      ).toThrow('Project name cannot be empty');
    });

    it('should throw error if name is only whitespace', () => {
      expect(() =>
        ProjectModel.create({
          name: '   ',
          baseUrl: 'https://example.com',
          config: validConfig,
        }),
      ).toThrow('Project name cannot be empty');
    });

    it('should throw error if baseUrl is invalid', () => {
      expect(() =>
        ProjectModel.create({
          name: 'Test Project',
          baseUrl: 'not-a-url',
          config: validConfig,
        }),
      ).toThrow('Base URL must be a valid URL');
    });

    it('should throw error if baseUrl is empty', () => {
      expect(() =>
        ProjectModel.create({
          name: 'Test Project',
          baseUrl: '',
          config: validConfig,
        }),
      ).toThrow('Base URL must be a valid URL');
    });

    it('should accept http and https URLs', () => {
      const httpConfig = {
        ...validConfig,
        crawl: {
          ...validConfig.crawl,
          baseUrl: 'http://localhost:3000',
        },
      };

      const httpProject = ProjectModel.create({
        name: 'HTTP Project',
        baseUrl: 'http://localhost:3000',
        config: httpConfig,
      });

      const httpsProject = ProjectModel.create({
        name: 'HTTPS Project',
        baseUrl: 'https://example.com',
        config: validConfig,
      });

      expect(httpProject.baseUrl).toBe('http://localhost:3000');
      expect(httpsProject.baseUrl).toBe('https://example.com');
    });

    it('should throw error if crawl config baseUrl does not match project baseUrl', () => {
      const invalidConfig = {
        ...validConfig,
        crawl: {
          ...validConfig.crawl,
          baseUrl: 'https://different.com',
        },
      };

      expect(() =>
        ProjectModel.create({
          name: 'Test Project',
          baseUrl: 'https://example.com',
          config: invalidConfig,
        }),
      ).toThrow('Crawl config baseUrl must match project baseUrl');
    });

    it('should throw error if viewport width is invalid', () => {
      const invalidConfig = {
        ...validConfig,
        viewport: {
          width: 0,
          height: 1080,
        },
      };

      expect(() =>
        ProjectModel.create({
          name: 'Test Project',
          baseUrl: 'https://example.com',
          config: invalidConfig,
        }),
      ).toThrow('Viewport width must be greater than 0');
    });

    it('should throw error if viewport height is invalid', () => {
      const invalidConfig = {
        ...validConfig,
        viewport: {
          width: 1920,
          height: -1,
        },
      };

      expect(() =>
        ProjectModel.create({
          name: 'Test Project',
          baseUrl: 'https://example.com',
          config: invalidConfig,
        }),
      ).toThrow('Viewport height must be greater than 0');
    });

    it('should throw error if visual diff threshold is negative', () => {
      const invalidConfig = {
        ...validConfig,
        thresholds: {
          visualDiffPercentage: -1,
        },
      };

      expect(() =>
        ProjectModel.create({
          name: 'Test Project',
          baseUrl: 'https://example.com',
          config: invalidConfig,
        }),
      ).toThrow('Visual diff percentage must be between 0 and 100');
    });

    it('should throw error if visual diff threshold exceeds 100', () => {
      const invalidConfig = {
        ...validConfig,
        thresholds: {
          visualDiffPercentage: 101,
        },
      };

      expect(() =>
        ProjectModel.create({
          name: 'Test Project',
          baseUrl: 'https://example.com',
          config: invalidConfig,
        }),
      ).toThrow('Visual diff percentage must be between 0 and 100');
    });
  });

  describe('update', () => {
    it('should update project name', () => {
      const project = ProjectModel.create({
        name: 'Old Name',
        baseUrl: 'https://example.com',
        config: validConfig,
      });

      const originalUpdatedAt = project.updatedAt;

      // Wait a bit to ensure updatedAt changes
      const updated = ProjectModel.update(project, { name: 'New Name' });

      expect(updated.name).toBe('New Name');
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime(),
      );
      expect(updated.id).toBe(project.id);
      expect(updated.createdAt).toEqual(project.createdAt);
    });

    it('should update project description', () => {
      const project = ProjectModel.create({
        name: 'Test Project',
        baseUrl: 'https://example.com',
        config: validConfig,
      });

      const updated = ProjectModel.update(project, {
        description: 'New description',
      });

      expect(updated.description).toBe('New description');
    });

    it('should update project config', () => {
      const project = ProjectModel.create({
        name: 'Test Project',
        baseUrl: 'https://example.com',
        config: validConfig,
      });

      const newConfig = {
        ...validConfig,
        runProfile: RunProfile.FULL,
      };

      const updated = ProjectModel.update(project, { config: newConfig });

      expect(updated.config.runProfile).toBe(RunProfile.FULL);
    });

    it('should validate updated data', () => {
      const project = ProjectModel.create({
        name: 'Test Project',
        baseUrl: 'https://example.com',
        config: validConfig,
      });

      expect(() =>
        ProjectModel.update(project, { name: '' }),
      ).toThrow('Project name cannot be empty');
    });
  });

  describe('toJSON', () => {
    it('should serialize project to JSON', () => {
      const project = ProjectModel.create({
        name: 'Test Project',
        baseUrl: 'https://example.com',
        config: validConfig,
      });

      const json = ProjectModel.toJSON(project);

      expect(json.id).toBe(project.id);
      expect(json.name).toBe(project.name);
      expect(json.baseUrl).toBe(project.baseUrl);
      expect(json.createdAt).toBe(project.createdAt.toISOString());
      expect(json.updatedAt).toBe(project.updatedAt.toISOString());
    });
  });

  describe('fromJSON', () => {
    it('should deserialize project from JSON', () => {
      const json = {
        id: 'test-id',
        name: 'Test Project',
        baseUrl: 'https://example.com',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        config: validConfig,
      };

      const project = ProjectModel.fromJSON(json);

      expect(project.id).toBe('test-id');
      expect(project.name).toBe('Test Project');
      expect(project.createdAt).toBeInstanceOf(Date);
      expect(project.updatedAt).toBeInstanceOf(Date);
      expect(project.createdAt.toISOString()).toBe('2024-01-01T00:00:00.000Z');
    });
  });
});
