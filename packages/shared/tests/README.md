# Shared Package Tests

Comprehensive test suite for all Zod schemas in the `@gander-tools/diff-voyager-shared` package.

## Overview

This test suite validates the runtime behavior of all Zod schemas used in the Diff Voyager API contract. The tests ensure type-safe validation of requests and responses between the backend and frontend.

**Total Tests**: 210 tests across 7 test files
**Coverage Goal**: >95% line coverage

## What We Test

### ✅ Zod Schemas (Runtime Validation)

We test all 25+ Zod schemas exported from `api-contract.ts`:

1. **Common Schemas** (3 schemas, 31 tests)
   - `uuidSchema` - UUID v4 validation
   - `urlSchema` - HTTP/HTTPS URL validation
   - `timestampSchema` - ISO 8601 datetime validation

2. **Path Parameters** (4 schemas, 13 tests)
   - `projectIdParamSchema` - Project UUID path param
   - `runIdParamSchema` - Run UUID path param
   - `pageIdParamSchema` - Page UUID path param
   - `taskIdParamSchema` - Task UUID path param

3. **Query Parameters** (4 schemas, 38 tests)
   - `getProjectQuerySchema` - Boolean and number coercion
   - `listProjectsQuerySchema` - Pagination with limits
   - `listRunsQuerySchema` - Pagination with limits
   - `listRunPagesQuerySchema` - Pagination with status filter

4. **Request Schemas** (3 schemas, 42 tests)
   - `viewportSchema` - Viewport dimensions (320x240 minimum)
   - `createScanBodySchema` - Scan creation with optional fields
   - `createRunBodySchema` - Run creation request

5. **Response Schemas** (9 schemas, 43 tests)
   - `paginationSchema` - Pagination metadata
   - `errorResponseSchema` - Error structure
   - `projectConfigSchema` - Project configuration
   - `statisticsSchema` - Project statistics (9 integer fields)
   - `projectListItemSchema` - Project list item
   - `projectDetailsSchema` - Full project with nested data
   - `runResponseSchema` - Run response
   - `runDetailsSchema` - Run with config and statistics
   - `createScanAsyncResponseSchema` - Async scan response
   - `createRunResponseSchema` - Run creation response
   - `runPagesListSchema` - Run pages list with pagination

6. **Nested Schemas** (4 schemas, 18 tests)
   - `runConfigSchema` - Run configuration
   - `runStatisticsSchema` - Run statistics (3 fields)
   - Nested viewport validation
   - Validation cascading through nested objects

7. **Diff Schemas** (2 schemas, 25 tests)
   - `pageDiffSchema` - Page comparison with change arrays
   - `taskStatusSchema` - Task status with enum validation

### ❌ What We Don't Test

We do **NOT** test the following (no runtime behavior):

- TypeScript interfaces in `types/index.ts` (compile-time only)
- TypeScript enums in `enums/index.ts` (compile-time only)
- Constants in `constants.ts` (simple values)

## Test Organization

```
tests/
├── api-contract/
│   ├── common-schemas.test.ts         # UUID, URL, timestamp (31 tests)
│   ├── query-schemas.test.ts          # Query params with coercion (38 tests)
│   ├── path-params.test.ts            # Path parameter validation (13 tests)
│   ├── request-schemas.test.ts        # Request body schemas (42 tests)
│   ├── response-schemas.test.ts       # Response schemas (43 tests)
│   ├── nested-schemas.test.ts         # Nested object composition (18 tests)
│   └── diff-schemas.test.ts           # Diff and task schemas (25 tests)
├── helpers/
│   └── fixtures.ts                    # Reusable test data
└── README.md                          # This file
```

## Testing Pattern

All tests follow the established pattern from `packages/frontend/tests/unit/utils/validators.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { schemaName } from '../../src/api-contract.js';

describe('schemaName', () => {
  it('should accept valid data', () => {
    const validData = { /* ... */ };
    const result = schemaName.safeParse(validData);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.field).toBe(expectedValue);
    }
  });

  it('should reject invalid data', () => {
    const invalidData = { /* ... */ };
    const result = schemaName.safeParse(invalidData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain('fieldName');
    }
  });
});
```

### Key Principles

1. **Use `safeParse()` exclusively** - Never use `parse()` (throws errors)
2. **Type-narrow with conditionals** - Use `if (result.success)` for type inference
3. **Test valid, invalid, and edge cases** - Comprehensive coverage
4. **Descriptive test names** - Clear intent for each test
5. **Reuse fixtures** - DRY principle with `tests/helpers/fixtures.ts`

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Fixtures

The `tests/helpers/fixtures.ts` file provides reusable test data:

- `validUUIDs` / `invalidUUIDs` - UUID test data
- `validURLs` / `invalidURLs` - URL test data
- `validTimestamps` - ISO 8601 timestamp examples
- `validViewport` / `validViewports` / `invalidViewports` - Viewport configurations
- `validProjectConfig` - Complete project configuration
- `validStatistics` / `zeroStatistics` - Statistics objects
- `validRunConfig` / `validRunStatistics` - Run-related data
- `validPagination` - Pagination metadata

## Key Testing Insights

### Type Coercion (Query Parameters)

Zod's type coercion has specific behaviors documented in tests:

```typescript
// z.coerce.number() converts string to number
z.coerce.number().int().min(1).max(100)
"50" → 50 ✅

// z.coerce.boolean() uses JavaScript Boolean() coercion
// ANY non-empty string becomes true (even "false")
z.coerce.boolean()
"false" → true ✅  (not false!)
"" → false ✅
"0" → true ✅
```

### Integer Validation

All count/numeric fields use `.int()` for integer enforcement:

```typescript
z.number().int()        // Must be integer
z.number().int().min(0) // Non-negative integer
z.number().int().positive() // Positive integer (> 0)
```

### Range Validation

Fields with value ranges are explicitly tested:

```typescript
visualDiffThreshold: z.number().min(0).max(1)  // 0-1 range
viewport.width: z.number().int().min(320)      // Minimum 320px
viewport.height: z.number().int().min(240)     // Minimum 240px
```

### Optional vs Nullable

Zod distinguishes between optional and nullable:

```typescript
z.string().optional()    // Can be omitted (undefined), not null
z.string().nullable()    // Can be null, must be present
z.string().nullish()     // Can be undefined or null
```

Tests verify the correct behavior for each schema field.

## Coverage Goals

Target: **>95% line coverage**

All Zod schemas are 100% covered by these tests. The test suite validates:
- All required fields
- All optional fields
- Nested validation
- Type coercion
- Range constraints
- Enum values
- Error messages and paths

## Benefits

1. **Regression Protection** - Catch schema changes that break API contract
2. **Documentation** - Tests serve as usage examples
3. **Type Safety** - Validate all request/response shapes before runtime
4. **Confidence** - Full validation coverage across all API schemas
5. **TDD Compliance** - Aligns with project's test-first approach

## Test Results

```
Test Files  7 passed (7)
Tests      210 passed (210)
Duration   <1 second
```

All tests run in memory with no I/O, ensuring fast test execution.

## Discovered Issues (Fixed)

During test development, we identified and fixed:

1. **Missing constraint**: `projectConfigSchema.visualDiffThreshold` was missing `.min(0).max(1)` range validation
2. **FTP URL validation**: Documented that Zod's `.url()` accepts all valid URL protocols (FTP, HTTP, HTTPS, etc.)
3. **Boolean coercion quirk**: Documented that `z.coerce.boolean()` converts any non-empty string to `true`
4. **Zod key stripping**: Documented that Zod strips unknown keys by default (unless `.strict()` is used)

## Future Enhancements

- Add tests for `pageResponseSchema.seoData` detailed structure (currently `z.any()`)
- Add tests for `pageResponseSchema.performanceData` detailed structure (currently `z.any()`)
- Add tests for artifact URL endpoints (TODO in contract)

## See Also

- [Frontend Validators Tests](../../frontend/tests/unit/utils/validators.test.ts) - Original testing pattern
- [API Contract](../src/api-contract.ts) - Schema definitions
- [Vitest Documentation](https://vitest.dev/) - Test framework
- [Zod Documentation](https://zod.dev/) - Validation library
