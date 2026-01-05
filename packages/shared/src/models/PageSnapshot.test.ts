import { describe, it, expect } from 'vitest';
import { PageSnapshotModel } from './PageSnapshot.js';
import { PageStatus } from '../enums/index.js';
import type { SeoData, PerformanceData, ArtifactReferences } from '../types/index.js';

describe('PageSnapshotModel', () => {
  const validSeoData: SeoData = {
    title: 'Test Page',
    metaDescription: 'Test description',
    canonical: 'https://example.com/page',
    robots: 'index, follow',
    h1: ['Main Heading'],
    h2: ['Subheading 1', 'Subheading 2'],
    lang: 'en',
  };

  const validPerformanceData: PerformanceData = {
    loadTimeMs: 1500,
    requestCount: 25,
    totalSizeBytes: 500000,
  };

  const validArtifacts: ArtifactReferences = {
    screenshotPath: '/screenshots/page-123.png',
    harPath: '/har/page-123.har',
    diffImagePath: '/diffs/page-123.png',
  };

  describe('create', () => {
    it('should create a new page snapshot with valid data', () => {
      const snapshot = PageSnapshotModel.create({
        pageId: 'page-123',
        runId: 'run-456',
        httpStatus: 200,
        html: '<html><body>Test</body></html>',
        httpHeaders: {
          'content-type': 'text/html',
          'cache-control': 'max-age=3600',
        },
        seoData: validSeoData,
      });

      expect(snapshot.id).toBeDefined();
      expect(snapshot.pageId).toBe('page-123');
      expect(snapshot.runId).toBe('run-456');
      expect(snapshot.status).toBe(PageStatus.COMPLETED);
      expect(snapshot.httpStatus).toBe(200);
      expect(snapshot.html).toBe('<html><body>Test</body></html>');
      expect(snapshot.htmlHash).toBeDefined();
      expect(snapshot.capturedAt).toBeInstanceOf(Date);
      expect(snapshot.seoData).toEqual(validSeoData);
      expect(snapshot.performance).toBeUndefined();
      expect(snapshot.artifacts).toEqual({});
    });

    it('should create snapshot with performance data', () => {
      const snapshot = PageSnapshotModel.create({
        pageId: 'page-123',
        runId: 'run-456',
        httpStatus: 200,
        html: '<html><body>Test</body></html>',
        httpHeaders: {},
        seoData: validSeoData,
        performance: validPerformanceData,
      });

      expect(snapshot.performance).toEqual(validPerformanceData);
    });

    it('should create snapshot with artifacts', () => {
      const snapshot = PageSnapshotModel.create({
        pageId: 'page-123',
        runId: 'run-456',
        httpStatus: 200,
        html: '<html><body>Test</body></html>',
        httpHeaders: {},
        seoData: validSeoData,
        artifacts: validArtifacts,
      });

      expect(snapshot.artifacts).toEqual(validArtifacts);
    });

    it('should create snapshot with redirect chain', () => {
      const snapshot = PageSnapshotModel.create({
        pageId: 'page-123',
        runId: 'run-456',
        httpStatus: 200,
        html: '<html><body>Test</body></html>',
        httpHeaders: {},
        seoData: validSeoData,
        redirectChain: [
          { from: 'http://example.com', to: 'https://example.com', status: 301 },
          { from: 'https://example.com', to: 'https://example.com/page', status: 302 },
        ],
      });

      expect(snapshot.redirectChain).toHaveLength(2);
      expect(snapshot.redirectChain?.[0].status).toBe(301);
    });

    it('should create snapshot with error status', () => {
      const snapshot = PageSnapshotModel.create({
        pageId: 'page-123',
        runId: 'run-456',
        httpStatus: 500,
        html: '',
        httpHeaders: {},
        seoData: {},
        status: PageStatus.ERROR,
        error: 'Server error occurred',
      });

      expect(snapshot.status).toBe(PageStatus.ERROR);
      expect(snapshot.error).toBe('Server error occurred');
    });

    it('should generate consistent hash for same HTML', () => {
      const html = '<html><body>Test</body></html>';

      const snapshot1 = PageSnapshotModel.create({
        pageId: 'page-123',
        runId: 'run-456',
        httpStatus: 200,
        html,
        httpHeaders: {},
        seoData: validSeoData,
      });

      const snapshot2 = PageSnapshotModel.create({
        pageId: 'page-789',
        runId: 'run-456',
        httpStatus: 200,
        html,
        httpHeaders: {},
        seoData: validSeoData,
      });

      expect(snapshot1.htmlHash).toBe(snapshot2.htmlHash);
    });

    it('should generate different hash for different HTML', () => {
      const snapshot1 = PageSnapshotModel.create({
        pageId: 'page-123',
        runId: 'run-456',
        httpStatus: 200,
        html: '<html><body>Test 1</body></html>',
        httpHeaders: {},
        seoData: validSeoData,
      });

      const snapshot2 = PageSnapshotModel.create({
        pageId: 'page-123',
        runId: 'run-456',
        httpStatus: 200,
        html: '<html><body>Test 2</body></html>',
        httpHeaders: {},
        seoData: validSeoData,
      });

      expect(snapshot1.htmlHash).not.toBe(snapshot2.htmlHash);
    });

    it('should throw error if pageId is empty', () => {
      expect(() =>
        PageSnapshotModel.create({
          pageId: '',
          runId: 'run-456',
          httpStatus: 200,
          html: '<html></html>',
          httpHeaders: {},
          seoData: validSeoData,
        }),
      ).toThrow('Page ID cannot be empty');
    });

    it('should throw error if runId is empty', () => {
      expect(() =>
        PageSnapshotModel.create({
          pageId: 'page-123',
          runId: '',
          httpStatus: 200,
          html: '<html></html>',
          httpHeaders: {},
          seoData: validSeoData,
        }),
      ).toThrow('Run ID cannot be empty');
    });

    it('should throw error if httpStatus is invalid', () => {
      expect(() =>
        PageSnapshotModel.create({
          pageId: 'page-123',
          runId: 'run-456',
          httpStatus: 99,
          html: '<html></html>',
          httpHeaders: {},
          seoData: validSeoData,
        }),
      ).toThrow('HTTP status must be between 100 and 599');

      expect(() =>
        PageSnapshotModel.create({
          pageId: 'page-123',
          runId: 'run-456',
          httpStatus: 600,
          html: '<html></html>',
          httpHeaders: {},
          seoData: validSeoData,
        }),
      ).toThrow('HTTP status must be between 100 and 599');
    });
  });

  describe('toJSON', () => {
    it('should serialize page snapshot to JSON', () => {
      const snapshot = PageSnapshotModel.create({
        pageId: 'page-123',
        runId: 'run-456',
        httpStatus: 200,
        html: '<html><body>Test</body></html>',
        httpHeaders: { 'content-type': 'text/html' },
        seoData: validSeoData,
        performance: validPerformanceData,
        artifacts: validArtifacts,
      });

      const json = PageSnapshotModel.toJSON(snapshot);

      expect(json.id).toBe(snapshot.id);
      expect(json.pageId).toBe('page-123');
      expect(json.capturedAt).toBe(snapshot.capturedAt.toISOString());
      expect(json.seoData).toEqual(validSeoData);
      expect(json.performance).toEqual(validPerformanceData);
    });
  });

  describe('fromJSON', () => {
    it('should deserialize page snapshot from JSON', () => {
      const json = {
        id: 'snapshot-123',
        pageId: 'page-456',
        runId: 'run-789',
        status: PageStatus.COMPLETED,
        capturedAt: '2024-01-01T00:00:00.000Z',
        httpStatus: 200,
        html: '<html><body>Test</body></html>',
        htmlHash: 'abc123',
        httpHeaders: { 'content-type': 'text/html' },
        seoData: validSeoData,
        performance: validPerformanceData,
        artifacts: validArtifacts,
      };

      const snapshot = PageSnapshotModel.fromJSON(json);

      expect(snapshot.id).toBe('snapshot-123');
      expect(snapshot.pageId).toBe('page-456');
      expect(snapshot.capturedAt).toBeInstanceOf(Date);
      expect(snapshot.capturedAt.toISOString()).toBe('2024-01-01T00:00:00.000Z');
      expect(snapshot.seoData).toEqual(validSeoData);
    });
  });
});
