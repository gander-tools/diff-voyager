# Test Documentation

This document provides a comprehensive overview of all tests in the Diff Voyager codebase.

**Note:** This file is read-only and should not be manually edited unless explicitly requested by the user. It will be updated manually or on explicit user request.

---

## Overview

The test suite is organized into three main categories:

- **Backend Tests** - Node.js/TypeScript backend testing
- **Shared Tests** - API contract and type validation
- **Frontend Tests** - Vue.js component and integration testing

## Test Organization

### Backend Tests

Backend tests are split into unit and integration tests:

- **Backend Unit Tests** - Domain logic, crawler components, queue management, and storage repositories
  - Domain: Comparators (Header, Page, Performance, SEO, Visual), URL Normalizer
  - Crawler: Browser Manager, Page Capturer, Single Page Processor
  - Queue: Task Queue, Task Processor, Page Task Queue
  - Storage: Repository implementations

- **Backend Integration Tests** - Cross-component integration, security, concurrency, and API testing
  - Storage: Repository comparisons (SQL vs Drizzle)
  - Security: Path traversal, input validation
  - Concurrency: Queue and storage concurrent operations
  - API: @ts-rest routes, security middleware
  - Services: Scan processor integration

### Shared Tests

- **Shared Tests** - API contract validation and schema testing
  - Diff Schemas
  - Nested Schemas
  - Path Parameters
  - Request Schemas
  - Query Schemas
  - Common Schemas
  - Response Schemas

### Frontend Tests

- **Frontend Tests** - Vue.js components, views, stores, and accessibility
  - Views: Dashboard, Settings, Project/Run/Page/Rule management
  - Components: Badges, Cards, Forms, Statistics, Diff viewers
  - Stores: Pinia state management
  - Utils: Form validators
  - Accessibility: Keyboard navigation, ARIA, screen readers

## Test Execution

### Backend
```bash
cd packages/backend
npm test        # Run all tests
npm run test:unit     # Unit tests only
npm run test:integration  # Integration tests only
```

### Shared
```bash
cd packages/shared
npm test        # Validate types and schemas
```

### Frontend
```bash
cd packages/frontend
npm test        # Run all tests
```

## Test Coverage

For detailed test coverage and audit information, see:
- [Test Audit Report](tests-to-fix.md) - Missing, redundant, and skipped tests requiring fixes

## Contributing

When adding new tests:
1. Follow the existing structure and naming conventions
2. Write descriptive test names that explain the behavior being tested
3. Keep tests focused on a single behavior
4. Use appropriate test type (unit vs integration)
5. Update this documentation when adding new test categories
