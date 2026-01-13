# Backend Development

This guide covers backend development workflows for Diff Voyager's Node.js + TypeScript backend.

## Development Commands

```bash
cd packages/backend

# Run all tests
npm test

# Run specific test file
npm test -- tests/unit/domain/url-normalizer.test.ts

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage

# Build TypeScript
npm run build

# Start dev server with hot reload
npm run dev
```

## Test Structure

The backend uses a structured test organization:

```
packages/backend/tests/
├── unit/                    # Unit tests (no external deps)
│   ├── domain/             # URL normalizer, etc.
│   └── storage/            # Repository tests
├── integration/            # Integration tests (with DB, mock server)
│   └── api/                # API endpoint tests
├── fixtures/               # Test data
│   └── html/               # HTML fixtures for SEO testing
└── helpers/                # Test utilities
    ├── mock-server.ts      # HTTP mock server
    ├── test-db.ts          # In-memory SQLite
    └── factories.ts        # Test data factories
```

## Testing Strategy

### Unit Tests
- Domain models and business logic
- URL normalization and validation
- Repository interfaces (with in-memory DB)
- Isolated, fast-running tests

### Integration Tests
- API endpoint tests with Fastify test harness
- Database integration with SQLite
- Mock HTTP server for crawler tests
- End-to-end service interactions

### Test Database

Tests use in-memory SQLite databases:

```typescript
import { createTestDb } from '../helpers/test-db.js';

// Each test gets a fresh database
const db = await createTestDb();

// Automatically cleaned up after test
```

## Related Documentation

- [Running Servers](running-servers.md) - Server configuration and startup
- [Security Guidelines](security.md) - Security best practices
- [@ts-rest Guide](ts-rest.md) - API contract implementation
- [Drizzle ORM Guide](drizzle-orm.md) - Database query patterns
- [Testing Strategy](../guides/testing-strategy.md) - Overall testing approach
