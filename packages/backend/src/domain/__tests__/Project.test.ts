import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectModel } from '../models/Project.js';
import { RunProfile } from '@gander-tools/diff-voyager-shared';

describe('ProjectModel', () => {
  describe('create', () => {
    it('should create a new project with minimal required fields', () => {
      const project = ProjectModel.create({
        name: 'Test Project',
        baseUrl: 'https://example.com',
      });

      expect(project.name).toBe('Test Project');
      expect(project.baseUrl).toBe('https://example.com');
      expect(project.id).toBeTruthy();
      expect(project.createdAt).toBeInstanceOf(Date);
      expect(project.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a project with description', () => {
      const project = ProjectModel.create({
        name: 'Test Project',
        baseUrl: 'https://example.com',
        description: 'A test project',
      });

      expect(project.description).toBe('A test project');
    });

    it('should initialize with default configuration', () => {
      const project = ProjectModel.create({
        name: 'Test Project',
        baseUrl: 'https://example.com',
      });

      expect(project.config).toBeDefined();
      expect(project.config.crawl.baseUrl).toBe('https://example.com');
      expect(project.config.runProfile).toBe(RunProfile.VISUAL_SEO);
      expect(project.config.viewport).toBeDefined();
      expect(project.config.viewport.width).toBe(1920);
      expect(project.config.viewport.height).toBe(1080);
      expect(project.config.thresholds).toBeDefined();
      expect(project.config.thresholds.visualDiffPercentage).toBe(0.1);
    });

    it('should allow custom configuration', () => {
      const project = ProjectModel.create({
        name: 'Test Project',
        baseUrl: 'https://example.com',
        config: {
          runProfile: RunProfile.FULL,
          viewport: {
            width: 1280,
            height: 720,
          },
          thresholds: {
            visualDiffPercentage: 0.5,
          },
        },
      });

      expect(project.config.runProfile).toBe(RunProfile.FULL);
      expect(project.config.viewport.width).toBe(1280);
      expect(project.config.viewport.height).toBe(720);
      expect(project.config.thresholds.visualDiffPercentage).toBe(0.5);
    });

    it('should throw error if name is empty', () => {
      expect(() => {
        ProjectModel.create({
          name: '',
          baseUrl: 'https://example.com',
        });
      }).toThrow('Project name cannot be empty');
    });

    it('should throw error if baseUrl is invalid', () => {
      expect(() => {
        ProjectModel.create({
          name: 'Test Project',
          baseUrl: 'not-a-url',
        });
      }).toThrow('Invalid base URL');
    });

    it('should normalize baseUrl by removing trailing slash', () => {
      const project = ProjectModel.create({
        name: 'Test Project',
        baseUrl: 'https://example.com/',
      });

      expect(project.baseUrl).toBe('https://example.com');
      expect(project.config.crawl.baseUrl).toBe('https://example.com');
    });
  });

  describe('updateConfig', () => {
    let project: ReturnType<typeof ProjectModel.create>;

    beforeEach(() => {
      project = ProjectModel.create({
        name: 'Test Project',
        baseUrl: 'https://example.com',
      });
    });

    it('should update project configuration', () => {
      const initialUpdatedAt = project.updatedAt;

      // Wait a tiny bit to ensure timestamp changes
      const updatedProject = ProjectModel.updateConfig(project, {
        runProfile: RunProfile.FULL,
      });

      expect(updatedProject.config.runProfile).toBe(RunProfile.FULL);
      expect(updatedProject.updatedAt.getTime()).toBeGreaterThanOrEqual(
        initialUpdatedAt.getTime()
      );
    });

    it('should merge configuration updates with existing config', () => {
      const updatedProject = ProjectModel.updateConfig(project, {
        viewport: {
          width: 1280,
          height: 720,
        },
      });

      expect(updatedProject.config.viewport.width).toBe(1280);
      expect(updatedProject.config.viewport.height).toBe(720);
      expect(updatedProject.config.runProfile).toBe(RunProfile.VISUAL_SEO);
    });

    it('should update crawl scope rules', () => {
      const updatedProject = ProjectModel.updateConfig(project, {
        crawl: {
          scopeRules: {
            excludePatterns: ['/admin/*', '/private/*'],
          },
        },
      });

      expect(updatedProject.config.crawl.scopeRules.excludePatterns).toEqual([
        '/admin/*',
        '/private/*',
      ]);
    });

    it('should update ignore filters', () => {
      const updatedProject = ProjectModel.updateConfig(project, {
        ignoreFilters: {
          cssSelectors: ['.timestamp', '.session-id'],
        },
      });

      expect(updatedProject.config.ignoreFilters.cssSelectors).toEqual([
        '.timestamp',
        '.session-id',
      ]);
    });
  });

  describe('toJSON', () => {
    it('should serialize project to JSON', () => {
      const project = ProjectModel.create({
        name: 'Test Project',
        baseUrl: 'https://example.com',
        description: 'Test description',
      });

      const json = ProjectModel.toJSON(project);

      expect(json).toEqual({
        id: project.id,
        name: 'Test Project',
        description: 'Test description',
        baseUrl: 'https://example.com',
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        config: project.config,
      });
    });
  });

  describe('fromJSON', () => {
    it('should deserialize project from JSON', () => {
      const now = new Date();
      const json = {
        id: 'test-id',
        name: 'Test Project',
        description: 'Test description',
        baseUrl: 'https://example.com',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        config: {
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
        },
      };

      const project = ProjectModel.fromJSON(json);

      expect(project.id).toBe('test-id');
      expect(project.name).toBe('Test Project');
      expect(project.description).toBe('Test description');
      expect(project.baseUrl).toBe('https://example.com');
      expect(project.createdAt).toEqual(now);
      expect(project.updatedAt).toEqual(now);
      expect(project.config.runProfile).toBe(RunProfile.VISUAL_SEO);
    });
  });
});
