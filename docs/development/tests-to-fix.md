# Test Audit Report - Tests Requiring Fixes

**Generated**: 2026-01-23
**Last Updated**: 2026-01-24
**Status**: 60 failing tests across 7 test files

## Summary

- **Total Backend Tests**: 706
- **Passing Tests**: 646 (91.5%)
- **Failing Tests**: 60 (8.5%)
- **Test Files**: 38 passed | 7 failed (45 total)

## 🔴 Failing Tests Requiring Fixes

### 1. storage-concurrency.test.ts - 18 tests failing ⚠️ HIGH PRIORITY

**File**: `tests/integration/concurrency/storage-concurrency.test.ts`
**Issue**: `NOT NULL constraint failed: runs.project_id`
**Root Cause**: Database constraint violation during concurrent operations

**Failing Tests**:
- should handle concurrent project creation
- should handle concurrent project updates
- should handle concurrent project reads
- should maintain consistency during concurrent create and read
- should handle concurrent run creation for same project
- should handle concurrent run status updates
- should isolate runs across concurrent transactions
- should handle concurrent page creation
- should handle concurrent page updates
- should maintain consistency across concurrent page operations
- should handle concurrent operations across projects, runs, and pages
- should maintain referential integrity under concurrent operations
- should handle concurrent deletes with cascade
- should maintain consistency when deleting parent during child creation
- should prevent deadlocks on concurrent updates
- should handle circular dependency updates
- should maintain data consistency under heavy concurrent load
- should handle mixed read/write operations correctly

**Action Required**: Fix database constraint handling in concurrent operations

---

### 2. page-capturer.test.ts - 21 tests failing

**File**: `tests/unit/crawler/page-capturer.test.ts`
**Status**: Improved from 27 to 21 failures after Playwright installation (22% now passing)

**Failing Tests**:
- should capture HTML content with correct hash
- should extract HTTP status correctly
- should capture HTTP headers
- should handle 404 pages correctly
- should follow redirects and capture final page
- should capture redirect chain
- should capture full-page screenshot
- should respect viewport configuration
- should collect HAR file when collectHar is true
- should not collect HAR file when collectHar is false
- should collect HAR file for pages with multiple resources
- should extract title from HTML
- should extract meta description
- should extract canonical URL
- should extract robots directive
- should extract H1 headings
- should extract H2 headings
- should extract language attribute
- should handle pages without meta tags
- should handle multiple H1 headings
- should collect performance metrics

**Action Required**: Investigate and fix page capture functionality

---

### 3. single-page-processor.test.ts - 6 tests failing

**File**: `tests/unit/crawler/single-page-processor.test.ts`

**Failing Tests**:
- should capture and store a page snapshot
- should extract SEO data during capture
- should handle 404 pages gracefully
- should reuse existing page for same normalized URL
- should handle capture errors and return error info
- should respect viewport configuration

**Action Required**: Fix single page processing logic

---

### 4. scan-processor.test.ts - 6 tests failing

**File**: `tests/integration/services/scan-processor.test.ts`

**Failing Tests**:
- (Details not captured in this audit - see test file for specifics)

**Action Required**: Investigate and fix scan processing failures

---

### 5. browser-manager-errors.test.ts - 6 tests failing

**File**: `tests/unit/crawler/browser-manager-errors.test.ts`
**Status**: Significantly improved from 31 to 6 failures after Playwright installation (81% now passing)

**Failing Tests**:
- (Details not captured in this audit - see test file for specifics)

**Action Required**: Fix remaining browser error handling edge cases

---

### 6. scan-endpoints.test.ts - 2 tests failing

**File**: `tests/integration/api/scan-endpoints.test.ts`

**Failing Tests**:
- should return 200 with full result for sync scan
- should return project details after scan

**Action Required**: Fix scan endpoint integration issues

---

### 7. api-security.test.ts - 1 test failing

**File**: `tests/integration/api/api-security.test.ts`

**Failing Tests**:
- should validate URL schemes to prevent javascript: URLs (XSS Prevention)

**Action Required**: Implement URL scheme validation for XSS prevention

---

## 🎯 Priority Order for Fixes

1. **HIGH**: storage-concurrency.test.ts (18 failures) - Database constraint issue affecting core functionality
2. **MEDIUM**: page-capturer.test.ts (21 failures) - Core capture functionality
3. **MEDIUM**: scan-processor.test.ts (6 failures) - Integration workflow
4. **MEDIUM**: single-page-processor.test.ts (6 failures) - Core processing
5. **LOW**: browser-manager-errors.test.ts (6 failures) - Edge case error handling
6. **LOW**: scan-endpoints.test.ts (2 failures) - API integration
7. **LOW**: api-security.test.ts (1 failure) - Security validation

---

## ✅ Recently Fixed Tests

### page-details-endpoint.test.ts - ALL TESTS PASSING

**Fixed**: 2026-01-24
**Commit**: `61b7cf3` - "test(backend): fix and enable page-details-endpoint tests"

**Previously Skipped Tests (Now Enabled)**:
- ✅ should include SEO data from latest snapshot
- ✅ should include HTTP headers from latest snapshot
- ✅ should include performance metrics from latest snapshot

**Changes Made**:
- Fixed field names to match TypeScript interfaces:
  - `description` → `metaDescription` (SeoData)
  - `loadTime` → `loadTimeMs` (PerformanceData)
  - `totalSize` → `totalSizeBytes` (PerformanceData)
- Removed `.skip` prefixes

**See**: [backend-integration.md](tests/backend-integration.md#page-details-endpoint) for detailed test documentation

---

## 🚀 Setup Requirements

### Playwright Browsers (Required)

Many backend tests require Playwright browsers. Without them, 60+ tests will fail.

**Installation**:
```bash
npx playwright install
```

**Impact of Installation**:
- Before: 121 failed | 585 passed (17% fail rate)
- After: 60 failed | 646 passed (8.5% fail rate)
- **+61 tests now passing** (50% improvement)

**Files Improved**:
- browser-manager.test.ts: 0% → 100% passing ✅
- browser-manager-errors.test.ts: 0% → 81% passing
- page-capturer.test.ts: 0% → 22% passing

---

## 📊 Test Quality Metrics

### Overall Backend Test Suite
- **Total Tests**: 706
- **Pass Rate**: 91.5% (646 passing)
- **Fail Rate**: 8.5% (60 failing)
- **Skipped Tests**: 0

### By Category
- **Unit Tests**: Mostly passing (minor failures in crawler)
- **Integration Tests**: Mostly passing (storage concurrency issues)
- **API Tests**: Mostly passing (minor endpoint issues)
- **Security Tests**: 1 failure (XSS prevention)

---

## 📖 Related Documentation

- [Test Documentation](tests.md) - Comprehensive test overview
- [Backend Integration Tests](tests/backend-integration.md) - Integration test details
- [Backend Unit Tests](tests/backend-unit.md) - Unit test details
- [Testing Strategy](../guides/testing-strategy.md) - TDD approach and patterns
- [Getting Started](../guides/getting-started.md) - Setup and installation

---

**Last Review**: 2026-01-24
**Next Review**: After fixing high-priority failing tests
**Reviewed By**: Claude Code Agent
