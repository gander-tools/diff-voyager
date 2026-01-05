import { describe, it, expect, beforeEach } from 'vitest';
import { PageSnapshotModel } from '../PageSnapshot';
import type {
  PageSnapshot,
  PageStatus,
  SeoData,
  PerformanceData,
} from '@gander-tools/diff-voyager-shared';

describe('PageSnapshotModel', () => {
  let mockSeoData: SeoData;
  let mockPerformanceData: PerformanceData;
  let mockSnapshot: PageSnapshot;

  beforeEach(() => {
    mockSeoData = {
      title: 'Test Page',
      metaDescription: 'A test page description',
      canonical: 'https://example.com/page',
      robots: 'index, follow',
      h1: ['Main Heading'],
      h2: ['Subheading 1', 'Subheading 2'],
      openGraph: {
        title: 'Test Page OG',
        description: 'OG description',
        image: 'https://example.com/og-image.jpg',
      },
      twitterCard: {
        card: 'summary_large_image',
        title: 'Test Page Twitter',
      },
      lang: 'en',
    };

    mockPerformanceData = {
      loadTimeMs: 1500,
      requestCount: 25,
      totalSizeBytes: 524288,
      resourceTimings: [],
    };

    mockSnapshot = {
      id: 'snapshot-1',
      pageId: 'page-1',
      runId: 'run-1',
      status: 'completed',
      capturedAt: new Date('2024-01-01T00:00:00Z'),
      httpStatus: 200,
      redirectChain: [],
      html: '<html><body>Test</body></html>',
      htmlHash: 'abc123def456',
      httpHeaders: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'max-age=3600',
      },
      seoData: mockSeoData,
      performance: mockPerformanceData,
      artifacts: {
        screenshotPath: '/screenshots/page-1.png',
        harPath: '/har/page-1.har',
      },
    };
  });

  describe('constructor', () => {
    it('should create a PageSnapshotModel instance from PageSnapshot data', () => {
      const model = new PageSnapshotModel(mockSnapshot);

      expect(model.id).toBe('snapshot-1');
      expect(model.pageId).toBe('page-1');
      expect(model.runId).toBe('run-1');
      expect(model.status).toBe('completed');
      expect(model.httpStatus).toBe(200);
      expect(model.html).toBe('<html><body>Test</body></html>');
      expect(model.htmlHash).toBe('abc123def456');
      expect(model.seoData).toEqual(mockSeoData);
      expect(model.performance).toEqual(mockPerformanceData);
    });
  });

  describe('create', () => {
    it('should create a new snapshot with generated ID', () => {
      const newSnapshot = PageSnapshotModel.create({
        pageId: 'page-2',
        runId: 'run-2',
        html: '<html><body>New</body></html>',
        httpStatus: 200,
      });

      expect(newSnapshot.id).toBeDefined();
      expect(newSnapshot.id).toMatch(/^snapshot-/);
      expect(newSnapshot.pageId).toBe('page-2');
      expect(newSnapshot.runId).toBe('run-2');
      expect(newSnapshot.status).toBe('pending');
      expect(newSnapshot.capturedAt).toBeInstanceOf(Date);
      expect(newSnapshot.html).toBe('<html><body>New</body></html>');
      expect(newSnapshot.httpStatus).toBe(200);
    });

    it('should calculate htmlHash when creating snapshot', () => {
      const newSnapshot = PageSnapshotModel.create({
        pageId: 'page-2',
        runId: 'run-2',
        html: '<html><body>Test</body></html>',
        httpStatus: 200,
      });

      expect(newSnapshot.htmlHash).toBeDefined();
      expect(newSnapshot.htmlHash.length).toBeGreaterThan(0);
    });
  });

  describe('validation', () => {
    it('should validate a valid snapshot', () => {
      const model = new PageSnapshotModel(mockSnapshot);
      const validation = model.validate();

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toEqual([]);
    });

    it('should fail validation when pageId is empty', () => {
      const invalid = { ...mockSnapshot, pageId: '' };
      const model = new PageSnapshotModel(invalid);
      const validation = model.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Page ID is required');
    });

    it('should fail validation when runId is empty', () => {
      const invalid = { ...mockSnapshot, runId: '' };
      const model = new PageSnapshotModel(invalid);
      const validation = model.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Run ID is required');
    });

    it('should fail validation when htmlHash is empty', () => {
      const invalid = { ...mockSnapshot, htmlHash: '' };
      const model = new PageSnapshotModel(invalid);
      const validation = model.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('HTML hash is required');
    });

    it('should fail validation when httpStatus is invalid', () => {
      const invalid = { ...mockSnapshot, httpStatus: 99 };
      const model = new PageSnapshotModel(invalid);
      const validation = model.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('HTTP status must be between 100 and 599');
    });
  });

  describe('status management', () => {
    it('should update status to in_progress', () => {
      const model = new PageSnapshotModel({ ...mockSnapshot, status: 'pending' });
      const updated = model.updateStatus('in_progress');

      expect(updated.status).toBe('in_progress');
    });

    it('should update status to completed', () => {
      const model = new PageSnapshotModel({
        ...mockSnapshot,
        status: 'in_progress',
      });
      const updated = model.updateStatus('completed');

      expect(updated.status).toBe('completed');
    });

    it('should check if snapshot is pending', () => {
      const model = new PageSnapshotModel({ ...mockSnapshot, status: 'pending' });
      expect(model.isPending()).toBe(true);
      expect(model.isCompleted()).toBe(false);
    });

    it('should check if snapshot is in progress', () => {
      const model = new PageSnapshotModel({
        ...mockSnapshot,
        status: 'in_progress',
      });
      expect(model.isInProgress()).toBe(true);
    });

    it('should check if snapshot is completed', () => {
      const model = new PageSnapshotModel({
        ...mockSnapshot,
        status: 'completed',
      });
      expect(model.isCompleted()).toBe(true);
    });

    it('should check if snapshot has error', () => {
      const model = new PageSnapshotModel({ ...mockSnapshot, status: 'error' });
      expect(model.hasError()).toBe(true);
    });
  });

  describe('HTTP status helpers', () => {
    it('should check if status is success (2xx)', () => {
      const model = new PageSnapshotModel(mockSnapshot);
      expect(model.isSuccess()).toBe(true);
    });

    it('should check if status is redirect (3xx)', () => {
      const redirect = { ...mockSnapshot, httpStatus: 301 };
      const model = new PageSnapshotModel(redirect);
      expect(model.isRedirect()).toBe(true);
    });

    it('should check if status is client error (4xx)', () => {
      const notFound = { ...mockSnapshot, httpStatus: 404 };
      const model = new PageSnapshotModel(notFound);
      expect(model.isClientError()).toBe(true);
    });

    it('should check if status is server error (5xx)', () => {
      const serverError = { ...mockSnapshot, httpStatus: 500 };
      const model = new PageSnapshotModel(serverError);
      expect(model.isServerError()).toBe(true);
    });

    it('should check if page has redirects', () => {
      const withRedirects = {
        ...mockSnapshot,
        redirectChain: ['https://example.com', 'https://www.example.com'],
      };
      const model = new PageSnapshotModel(withRedirects);
      expect(model.hasRedirects()).toBe(true);
    });

    it('should get redirect count', () => {
      const withRedirects = {
        ...mockSnapshot,
        redirectChain: ['https://example.com', 'https://www.example.com'],
      };
      const model = new PageSnapshotModel(withRedirects);
      expect(model.getRedirectCount()).toBe(2);
    });
  });

  describe('SEO helpers', () => {
    it('should get SEO title', () => {
      const model = new PageSnapshotModel(mockSnapshot);
      expect(model.getSeoTitle()).toBe('Test Page');
    });

    it('should get meta description', () => {
      const model = new PageSnapshotModel(mockSnapshot);
      expect(model.getMetaDescription()).toBe('A test page description');
    });

    it('should get canonical URL', () => {
      const model = new PageSnapshotModel(mockSnapshot);
      expect(model.getCanonicalUrl()).toBe('https://example.com/page');
    });

    it('should check if page is indexable', () => {
      const model = new PageSnapshotModel(mockSnapshot);
      expect(model.isIndexable()).toBe(true);
    });

    it('should check if page is not indexable', () => {
      const noindex = {
        ...mockSnapshot,
        seoData: {
          ...mockSeoData,
          robots: 'noindex, nofollow',
        },
      };
      const model = new PageSnapshotModel(noindex);
      expect(model.isIndexable()).toBe(false);
    });

    it('should get H1 headings', () => {
      const model = new PageSnapshotModel(mockSnapshot);
      expect(model.getH1()).toEqual(['Main Heading']);
    });

    it('should check if snapshot has SEO data', () => {
      const model = new PageSnapshotModel(mockSnapshot);
      expect(model.hasSeoData()).toBe(true);
    });

    it('should check if snapshot has no SEO data', () => {
      const noSeo = { ...mockSnapshot, seoData: undefined };
      const model = new PageSnapshotModel(noSeo);
      expect(model.hasSeoData()).toBe(false);
    });
  });

  describe('performance helpers', () => {
    it('should get load time', () => {
      const model = new PageSnapshotModel(mockSnapshot);
      expect(model.getLoadTime()).toBe(1500);
    });

    it('should get request count', () => {
      const model = new PageSnapshotModel(mockSnapshot);
      expect(model.getRequestCount()).toBe(25);
    });

    it('should get total size in bytes', () => {
      const model = new PageSnapshotModel(mockSnapshot);
      expect(model.getTotalSize()).toBe(524288);
    });

    it('should get total size in KB', () => {
      const model = new PageSnapshotModel(mockSnapshot);
      expect(model.getTotalSizeKB()).toBe(512);
    });

    it('should get total size in MB', () => {
      const model = new PageSnapshotModel(mockSnapshot);
      expect(model.getTotalSizeMB()).toBe(0.5);
    });

    it('should check if snapshot has performance data', () => {
      const model = new PageSnapshotModel(mockSnapshot);
      expect(model.hasPerformanceData()).toBe(true);
    });

    it('should return null for load time when no performance data', () => {
      const noPerf = { ...mockSnapshot, performance: undefined };
      const model = new PageSnapshotModel(noPerf);
      expect(model.getLoadTime()).toBeNull();
    });
  });

  describe('artifact helpers', () => {
    it('should check if snapshot has screenshot', () => {
      const model = new PageSnapshotModel(mockSnapshot);
      expect(model.hasScreenshot()).toBe(true);
    });

    it('should check if snapshot has HAR file', () => {
      const model = new PageSnapshotModel(mockSnapshot);
      expect(model.hasHar()).toBe(true);
    });

    it('should get screenshot path', () => {
      const model = new PageSnapshotModel(mockSnapshot);
      expect(model.getScreenshotPath()).toBe('/screenshots/page-1.png');
    });

    it('should get HAR path', () => {
      const model = new PageSnapshotModel(mockSnapshot);
      expect(model.getHarPath()).toBe('/har/page-1.har');
    });

    it('should return null for screenshot path when not available', () => {
      const noArtifacts = { ...mockSnapshot, artifacts: undefined };
      const model = new PageSnapshotModel(noArtifacts);
      expect(model.getScreenshotPath()).toBeNull();
    });
  });

  describe('HTML helpers', () => {
    it('should get HTML content', () => {
      const model = new PageSnapshotModel(mockSnapshot);
      expect(model.getHtml()).toBe('<html><body>Test</body></html>');
    });

    it('should get HTML hash', () => {
      const model = new PageSnapshotModel(mockSnapshot);
      expect(model.getHtmlHash()).toBe('abc123def456');
    });

    it('should compare HTML hash with another snapshot', () => {
      const model1 = new PageSnapshotModel(mockSnapshot);
      const model2 = new PageSnapshotModel({
        ...mockSnapshot,
        id: 'snapshot-2',
        htmlHash: 'abc123def456',
      });

      expect(model1.hasHtmlChanged(model2)).toBe(false);
    });

    it('should detect HTML changes between snapshots', () => {
      const model1 = new PageSnapshotModel(mockSnapshot);
      const model2 = new PageSnapshotModel({
        ...mockSnapshot,
        id: 'snapshot-2',
        htmlHash: 'different',
      });

      expect(model1.hasHtmlChanged(model2)).toBe(true);
    });
  });

  describe('toJSON', () => {
    it('should serialize to PageSnapshot interface', () => {
      const model = new PageSnapshotModel(mockSnapshot);
      const json = model.toJSON();

      expect(json).toEqual(mockSnapshot);
      expect(json.id).toBe(mockSnapshot.id);
      expect(json.seoData).toEqual(mockSnapshot.seoData);
      expect(json.performance).toEqual(mockSnapshot.performance);
    });
  });

  describe('clone', () => {
    it('should create a deep copy of the snapshot model', () => {
      const model = new PageSnapshotModel(mockSnapshot);
      const cloned = model.clone();

      expect(cloned).not.toBe(model);
      expect(cloned.id).toBe(model.id);
      expect(cloned.seoData).toEqual(model.seoData);
      expect(cloned.seoData).not.toBe(model.seoData);
    });
  });
});
