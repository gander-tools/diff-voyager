import { describe, it, expect } from 'vitest';
import { PageSnapshotModel } from '../models/PageSnapshot.js';
import { PageStatus } from '@gander-tools/diff-voyager-shared';

describe('PageSnapshotModel', () => {
  describe('create', () => {
    it('should create a new page snapshot with minimal data', () => {
      const snapshot = PageSnapshotModel.create({
        pageId: 'page-123',
        runId: 'run-123',
        html: '<html><body>Hello</body></html>',
        httpStatus: 200,
        httpHeaders: {
          'content-type': 'text/html',
        },
      });

      expect(snapshot.id).toBeTruthy();
      expect(snapshot.pageId).toBe('page-123');
      expect(snapshot.runId).toBe('run-123');
      expect(snapshot.status).toBe(PageStatus.COMPLETED);
      expect(snapshot.html).toBe('<html><body>Hello</body></html>');
      expect(snapshot.htmlHash).toBeTruthy();
      expect(snapshot.httpStatus).toBe(200);
      expect(snapshot.capturedAt).toBeInstanceOf(Date);
      expect(snapshot.httpHeaders).toEqual({ 'content-type': 'text/html' });
      expect(snapshot.seoData).toEqual({});
      expect(snapshot.artifacts).toEqual({});
    });

    it('should calculate HTML hash', () => {
      const snapshot1 = PageSnapshotModel.create({
        pageId: 'page-123',
        runId: 'run-123',
        html: '<html><body>Hello</body></html>',
        httpStatus: 200,
        httpHeaders: {},
      });

      const snapshot2 = PageSnapshotModel.create({
        pageId: 'page-123',
        runId: 'run-123',
        html: '<html><body>Hello</body></html>',
        httpStatus: 200,
        httpHeaders: {},
      });

      const snapshot3 = PageSnapshotModel.create({
        pageId: 'page-123',
        runId: 'run-123',
        html: '<html><body>Different</body></html>',
        httpStatus: 200,
        httpHeaders: {},
      });

      expect(snapshot1.htmlHash).toBe(snapshot2.htmlHash);
      expect(snapshot1.htmlHash).not.toBe(snapshot3.htmlHash);
    });

    it('should include SEO data when provided', () => {
      const snapshot = PageSnapshotModel.create({
        pageId: 'page-123',
        runId: 'run-123',
        html: '<html><body>Hello</body></html>',
        httpStatus: 200,
        httpHeaders: {},
        seoData: {
          title: 'Test Page',
          metaDescription: 'A test page',
          canonical: 'https://example.com/page',
          robots: 'index, follow',
          h1: ['Main Heading'],
        },
      });

      expect(snapshot.seoData.title).toBe('Test Page');
      expect(snapshot.seoData.metaDescription).toBe('A test page');
      expect(snapshot.seoData.canonical).toBe('https://example.com/page');
      expect(snapshot.seoData.robots).toBe('index, follow');
      expect(snapshot.seoData.h1).toEqual(['Main Heading']);
    });

    it('should include performance data when provided', () => {
      const snapshot = PageSnapshotModel.create({
        pageId: 'page-123',
        runId: 'run-123',
        html: '<html><body>Hello</body></html>',
        httpStatus: 200,
        httpHeaders: {},
        performance: {
          loadTimeMs: 1234,
          requestCount: 10,
          totalSizeBytes: 50000,
        },
      });

      expect(snapshot.performance).toEqual({
        loadTimeMs: 1234,
        requestCount: 10,
        totalSizeBytes: 50000,
      });
    });

    it('should include redirect chain when provided', () => {
      const snapshot = PageSnapshotModel.create({
        pageId: 'page-123',
        runId: 'run-123',
        html: '<html><body>Hello</body></html>',
        httpStatus: 200,
        httpHeaders: {},
        redirectChain: [
          { from: 'https://example.com/old', to: 'https://example.com/new', status: 301 },
          { from: 'https://example.com/new', to: 'https://example.com/page', status: 302 },
        ],
      });

      expect(snapshot.redirectChain).toEqual([
        { from: 'https://example.com/old', to: 'https://example.com/new', status: 301 },
        { from: 'https://example.com/new', to: 'https://example.com/page', status: 302 },
      ]);
    });

    it('should include artifact references when provided', () => {
      const snapshot = PageSnapshotModel.create({
        pageId: 'page-123',
        runId: 'run-123',
        html: '<html><body>Hello</body></html>',
        httpStatus: 200,
        httpHeaders: {},
        artifacts: {
          screenshotPath: '/path/to/screenshot.png',
          harPath: '/path/to/file.har',
        },
      });

      expect(snapshot.artifacts.screenshotPath).toBe('/path/to/screenshot.png');
      expect(snapshot.artifacts.harPath).toBe('/path/to/file.har');
    });

    it('should create error snapshot when error is provided', () => {
      const snapshot = PageSnapshotModel.create({
        pageId: 'page-123',
        runId: 'run-123',
        html: '',
        httpStatus: 0,
        httpHeaders: {},
        error: 'Connection timeout',
      });

      expect(snapshot.status).toBe(PageStatus.ERROR);
      expect(snapshot.error).toBe('Connection timeout');
    });

    it('should set status to PARTIAL when httpStatus is error code', () => {
      const snapshot = PageSnapshotModel.create({
        pageId: 'page-123',
        runId: 'run-123',
        html: '<html><body>Not Found</body></html>',
        httpStatus: 404,
        httpHeaders: {},
      });

      expect(snapshot.status).toBe(PageStatus.PARTIAL);
    });
  });

  describe('isSameContent', () => {
    it('should return true for snapshots with same HTML hash', () => {
      const snapshot1 = PageSnapshotModel.create({
        pageId: 'page-123',
        runId: 'run-123',
        html: '<html><body>Hello</body></html>',
        httpStatus: 200,
        httpHeaders: {},
      });

      const snapshot2 = PageSnapshotModel.create({
        pageId: 'page-123',
        runId: 'run-456',
        html: '<html><body>Hello</body></html>',
        httpStatus: 200,
        httpHeaders: {},
      });

      expect(PageSnapshotModel.isSameContent(snapshot1, snapshot2)).toBe(true);
    });

    it('should return false for snapshots with different HTML hash', () => {
      const snapshot1 = PageSnapshotModel.create({
        pageId: 'page-123',
        runId: 'run-123',
        html: '<html><body>Hello</body></html>',
        httpStatus: 200,
        httpHeaders: {},
      });

      const snapshot2 = PageSnapshotModel.create({
        pageId: 'page-123',
        runId: 'run-456',
        html: '<html><body>Different</body></html>',
        httpStatus: 200,
        httpHeaders: {},
      });

      expect(PageSnapshotModel.isSameContent(snapshot1, snapshot2)).toBe(false);
    });
  });

  describe('toJSON and fromJSON', () => {
    it('should serialize and deserialize snapshot correctly', () => {
      const snapshot = PageSnapshotModel.create({
        pageId: 'page-123',
        runId: 'run-123',
        html: '<html><body>Hello</body></html>',
        httpStatus: 200,
        httpHeaders: { 'content-type': 'text/html' },
        seoData: {
          title: 'Test Page',
          metaDescription: 'A test page',
        },
        performance: {
          loadTimeMs: 1234,
          requestCount: 10,
          totalSizeBytes: 50000,
        },
        artifacts: {
          screenshotPath: '/path/to/screenshot.png',
        },
      });

      const json = PageSnapshotModel.toJSON(snapshot);
      const deserializedSnapshot = PageSnapshotModel.fromJSON(json);

      expect(deserializedSnapshot.id).toBe(snapshot.id);
      expect(deserializedSnapshot.pageId).toBe(snapshot.pageId);
      expect(deserializedSnapshot.runId).toBe(snapshot.runId);
      expect(deserializedSnapshot.status).toBe(snapshot.status);
      expect(deserializedSnapshot.html).toBe(snapshot.html);
      expect(deserializedSnapshot.htmlHash).toBe(snapshot.htmlHash);
      expect(deserializedSnapshot.httpStatus).toBe(snapshot.httpStatus);
      expect(deserializedSnapshot.httpHeaders).toEqual(snapshot.httpHeaders);
      expect(deserializedSnapshot.seoData).toEqual(snapshot.seoData);
      expect(deserializedSnapshot.performance).toEqual(snapshot.performance);
      expect(deserializedSnapshot.artifacts).toEqual(snapshot.artifacts);
      expect(deserializedSnapshot.capturedAt).toEqual(snapshot.capturedAt);
    });
  });
});
