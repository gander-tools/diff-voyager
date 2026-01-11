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

**Status:** 🔗 Tracked in [Issue #156](https://github.com/gander-tools/diff-voyager/issues/156)

**Priority:** High | **Labels:** `bug`, `backend`, `from-docs`, `priority: high`, `tests`

See the issue for detailed investigation notes, root cause analysis, and fix plan.

---

### 2. Page Details Endpoint - SEO Data

**File:** `packages/backend/tests/integration/api/page-details-endpoint.test.ts:125`

**Status:** 🔗 Tracked in [Issue #151](https://github.com/gander-tools/diff-voyager/issues/151) (child of [#148](https://github.com/gander-tools/diff-voyager/issues/148))

**Priority:** Medium | **Labels:** `enhancement`, `backend`, `from-docs`, `priority: medium`, `tests`

**Parent Issue:** [#148 - Investigate page details endpoint response structure](https://github.com/gander-tools/diff-voyager/issues/148)

See the issues for investigation plan and fix approach.

---

### 3. Page Details Endpoint - HTTP Headers

**File:** `packages/backend/tests/integration/api/page-details-endpoint.test.ts:181`

**Status:** 🔗 Tracked in [Issue #152](https://github.com/gander-tools/diff-voyager/issues/152) (child of [#148](https://github.com/gander-tools/diff-voyager/issues/148))

**Priority:** Medium | **Labels:** `enhancement`, `backend`, `from-docs`, `priority: medium`, `tests`

**Parent Issue:** [#148 - Investigate page details endpoint response structure](https://github.com/gander-tools/diff-voyager/issues/148)

See the issues for investigation plan and fix approach.

---

### 4. Page Details Endpoint - Performance Metrics

**File:** `packages/backend/tests/integration/api/page-details-endpoint.test.ts:237`

**Status:** 🔗 Tracked in [Issue #153](https://github.com/gander-tools/diff-voyager/issues/153) (child of [#148](https://github.com/gander-tools/diff-voyager/issues/148))

**Priority:** Medium | **Labels:** `enhancement`, `backend`, `from-docs`, `priority: medium`, `tests`

**Parent Issue:** [#148 - Investigate page details endpoint response structure](https://github.com/gander-tools/diff-voyager/issues/148)

See the issues for investigation plan and fix approach.

---

## Action Items

All action items have been converted to GitHub Issues for better tracking:

### Immediate (Before Next Release)

- [ ] **HIGH PRIORITY:** Fix `includePages` query parameter → [Issue #156](https://github.com/gander-tools/diff-voyager/issues/156)

### Short-term (This Sprint)

- [ ] **INVESTIGATION:** Page details endpoint response structure → [Issue #148](https://github.com/gander-tools/diff-voyager/issues/148) (parent)
  - [ ] Include SEO data → [Issue #151](https://github.com/gander-tools/diff-voyager/issues/151)
  - [ ] Include HTTP headers → [Issue #152](https://github.com/gander-tools/diff-voyager/issues/152)
  - [ ] Include performance metrics → [Issue #153](https://github.com/gander-tools/diff-voyager/issues/153)

### Medium-term (Next Sprint)

- [ ] Fix HAR file URL handling → [Issue #157](https://github.com/gander-tools/diff-voyager/issues/157)

See the [GitHub Milestone: Documentation TODO Cleanup](https://github.com/gander-tools/diff-voyager/milestone/1) for complete tracking.

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
