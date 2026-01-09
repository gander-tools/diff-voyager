# Skipped Tests - TODO/FIXME

**Last Updated:** 2026-01-09

This document tracks all skipped tests in the codebase, explaining why they are disabled and when they should be fixed.

## Summary

| Location | Count | Priority | Status |
|----------|-------|----------|--------|
| Backend Integration - project-details | 1 | High | TODO |
| Backend Integration - page-details | 3 | Medium | TODO |
| Frontend | 0 | - | ✅ Clean |
| **Total** | **4** | - | - |

---

## Backend Integration Tests

### 1. Project Details Endpoint - includePages Parameter

**File:** `packages/backend/tests/integration/api/project-details-endpoint.test.ts:266`

**Test:** `should respect includePages=false query parameter`

**What is disabled:**
- Test verifying that `includePages=false` query parameter excludes pages from response
- Expected behavior: response should have empty `pages` array but accurate `statistics.totalPages`

**Why disabled:**
```
// TODO: Fix includePages query parameter coercion in @ts-rest
// The parameter is not being properly coerced from string to boolean
```

**Root cause:**
- @ts-rest framework is not properly coercing the query parameter from string `"false"` to boolean `false`
- Query parameters come as strings from HTTP requests but TypeScript expects boolean
- Missing or incorrect `z.coerce.boolean()` in API contract schema

**When to fix:**
- **Priority:** High
- **Timing:** Before v1.0 release
- **Blocker:** No - API still works, just doesn't support this optimization parameter
- **Impact:** Performance - when querying projects with many pages, clients can't opt-out of loading page data

**Fix plan:**
1. Update `packages/shared/src/api-contract.ts` - use `z.coerce.boolean()` for `includePages` query param
2. Rebuild shared package: `npm run build:shared`
3. Update backend route handler if needed
4. Re-enable test and verify it passes

---

### 2. Page Details Endpoint - SEO Data

**File:** `packages/backend/tests/integration/api/page-details-endpoint.test.ts:125`

**Test:** `should include SEO data from latest snapshot`

**What is disabled:**
- Test verifying that page details response includes SEO metadata
- Expected properties: `body.seoData.title`, `body.seoData.description`

**Why disabled:**
- **NO COMMENT PROVIDED** - reason unknown
- Likely related to API contract migration or response schema changes
- Test expects SEO data at top level of response, may need restructuring

**When to fix:**
- **Priority:** Medium
- **Timing:** During API contract review phase
- **Blocker:** No - SEO data collection still works in snapshots
- **Impact:** API consumers can't easily access SEO data without parsing snapshots

**Investigation needed:**
1. Check if SEO data is still collected in snapshots (verify SnapshotRepository)
2. Review API contract schema for page details endpoint
3. Decide if SEO data should be:
   - Top-level in response (as test expects)
   - Nested in latest snapshot object
   - Available via separate endpoint
4. Add comment explaining decision
5. Re-enable test with correct expectations

---

### 3. Page Details Endpoint - HTTP Headers

**File:** `packages/backend/tests/integration/api/page-details-endpoint.test.ts:181`

**Test:** `should include HTTP headers from latest snapshot`

**What is disabled:**
- Test verifying that page details response includes HTTP headers
- Expected properties: `body.httpHeaders['content-type']`, `body.httpHeaders['cache-control']`

**Why disabled:**
- **NO COMMENT PROVIDED** - reason unknown
- Same issue pattern as SEO data test (likely API contract migration)
- Test expects headers at top level of response

**When to fix:**
- **Priority:** Medium
- **Timing:** During API contract review phase (same as SEO data)
- **Blocker:** No - HTTP headers still collected in snapshots
- **Impact:** API consumers can't easily access headers without parsing snapshots

**Investigation needed:**
1. Check if HTTP headers are still collected in snapshots
2. Review API contract schema for page details endpoint
3. Align with SEO data decision (consistent response structure)
4. Add comment explaining decision
5. Re-enable test with correct expectations

---

### 4. Page Details Endpoint - Performance Metrics

**File:** `packages/backend/tests/integration/api/page-details-endpoint.test.ts:237`

**Test:** `should include performance metrics from latest snapshot`

**What is disabled:**
- Test verifying that page details response includes performance data
- Expected properties: `body.performanceData.loadTime`, `body.performanceData.requestCount`, `body.performanceData.totalSize`

**Why disabled:**
- **NO COMMENT PROVIDED** - reason unknown
- Same issue pattern as SEO data and HTTP headers tests
- Test expects performance data at top level of response

**When to fix:**
- **Priority:** Medium
- **Timing:** During API contract review phase (same as SEO data and headers)
- **Blocker:** No - Performance metrics still collected in snapshots
- **Impact:** API consumers can't easily access metrics without parsing snapshots

**Investigation needed:**
1. Check if performance metrics are still collected in snapshots
2. Review API contract schema for page details endpoint
3. Align with SEO data and headers decision
4. Add comment explaining decision
5. Re-enable test with correct expectations

---

## Action Items

### Immediate (Before Next Release)

- [ ] **HIGH PRIORITY:** Fix `includePages` query parameter coercion (#1)
  - Update API contract with `z.coerce.boolean()`
  - Re-enable test
  - Verify pagination optimization works

### Short-term (This Sprint)

- [ ] **INVESTIGATION:** Determine page details endpoint response structure (#2, #3, #4)
  - Should snapshot data be exposed at top level or nested?
  - Create consistent API contract for SEO, headers, and performance data
  - Document decision in API documentation

- [ ] **CODE QUALITY:** Add skip comments to tests #2, #3, #4
  - Even if not fixing immediately, explain WHY skipped
  - Link to related issue or decision

### Medium-term (Next Sprint)

- [ ] **MEDIUM PRIORITY:** Implement page details response structure (#2, #3, #4)
  - Update API contract based on investigation
  - Update backend route handlers
  - Re-enable all three tests
  - Update API documentation with examples

---

## Notes

- All skipped tests are in **backend integration tests** - frontend has zero skipped tests ✅
- Three of four tests (#2, #3, #4) appear related to the same issue: page details endpoint response format
- Consider batching fixes for #2, #3, #4 as a single task
- Tests use `it.skip()` syntax - safe to re-enable by changing to `it()`

---

## Related Documentation

- [API Contract](../../CLAUDE.md#ts-rest-type-safe-api-contract)
- [Testing Strategy](../guides/testing-strategy.md)
- [Implementation Status](./implementation-status.md)
