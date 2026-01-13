# @ts-rest Type-Safe API Contract

**Status**: ✅ Implemented (January 2026)

Diff Voyager uses [@ts-rest](https://ts-rest.com/) for type-safe API communication between frontend and backend with a single source of truth.

## Why @ts-rest?

- **Single Source of Truth**: API contract defined once in `packages/shared/src/api-contract.ts`
- **Compile-Time Type Safety**: TypeScript catches mismatches between frontend and backend
- **Zero Hardcoded Paths**: Routes generated automatically from contract
- **Runtime Validation**: Zod schemas validate all requests/responses
- **Better DX**: Full IDE autocomplete for all API calls

## API Contract Structure

The API contract is defined in `packages/shared/src/api-contract.ts`:

```typescript
import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

// Define Zod schemas for validation
const createScanBodySchema = z.object({
  url: z.string().url(),
  sync: z.boolean().optional(),
  name: z.string().optional(),
  // ... more fields
});

// Define the API contract
export const apiContract = c.router({
  createScan: {
    method: 'POST',
    path: '/scans',
    responses: {
      200: projectDetailsSchema,
      202: createScanAsyncResponseSchema,
      400: errorResponseSchema,
    },
    body: createScanBodySchema,
    summary: 'Create a new scan or crawl',
  },
  // ... more endpoints
});
```

## Backend Implementation (@ts-rest/fastify)

Backend routes in `packages/backend/src/api/routes-ts-rest.ts`:

```typescript
import { apiContract } from '@gander-tools/diff-voyager-shared';
import { initServer } from '@ts-rest/fastify';

export function createTsRestRoutes(config: TsRestRoutesConfig) {
  const s = initServer();

  const router = s.router(apiContract, {
    createScan: {
      handler: async ({ body }) => {
        // body is fully typed from contract!
        const project = await projectRepo.create({
          name: body.name || `Scan: ${body.url}`,
          // ...
        });

        if (body.sync) {
          return { status: 200 as const, body: projectDetails };
        }

        return { status: 202 as const, body: { projectId, status: 'PENDING' } };
      },
    },
    // ... more handlers
  });

  return { router, s };
}

// Register in app.ts
await app.register(tsRestServer.plugin(tsRestRouter), {
  prefix: API_BASE_PATH,
});
```

## Frontend Client (@ts-rest/core)

Frontend client in `packages/frontend/src/services/api/client.ts`:

```typescript
import { initClient } from '@ts-rest/core';
import { apiContract } from '@gander-tools/diff-voyager-shared';

export const tsRestClient = initClient(apiContract, {
  baseUrl: API_BASE_URL,
  baseHeaders: {},
  api: async ({ path, method, headers, body }) => {
    // Use existing retry logic with ofetch
    const response = await fetchWithRetry(path, { method, headers, body });
    return { status: 200, body: response, headers: new Headers() };
  },
});
```

Using the client in services:

```typescript
// packages/frontend/src/services/api/projects.ts
import { tsRestClient } from './client';

export async function createScan(request: CreateScanRequest) {
  const result = await tsRestClient.createScan({ body: request });

  if (result.status === 200) {
    return result.body; // Fully typed!
  }

  if (result.status === 202) {
    return result.body; // Different type, also typed!
  }

  throw new Error('Failed to create scan');
}
```

## Key Features

### 1. Query Parameter Coercion

Use `z.coerce.number()` and `z.coerce.boolean()` for query params (they come as strings from URLs):

```typescript
const listProjectsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});
```

### 2. Multiple Response Types

Handle different status codes with type safety:

```typescript
responses: {
  200: projectDetailsSchema,      // Success
  202: asyncResponseSchema,        // Accepted
  400: errorResponseSchema,        // Bad Request
  404: errorResponseSchema,        // Not Found
}
```

### 3. Path Parameters

Validated with Zod:

```typescript
params: z.object({
  projectId: z.string().uuid(),
})
```

## Testing

### Backend Tests

Example from `packages/backend/tests/integration/api/ts-rest-routes.test.ts`:

```typescript
it('should create async scan and return 202', async () => {
  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/scans',
    payload: { url: 'https://example.com', sync: false },
  });

  expect(response.statusCode).toBe(202);
  const body = JSON.parse(response.body);
  expect(body).toHaveProperty('projectId');
  expect(body).toHaveProperty('status', 'PENDING');
});
```

### Frontend Tests

Use MSW to mock responses:

```typescript
import { HttpResponse, http } from 'msw';

server.use(
  http.get(`${API_BASE_URL}/projects`, () => {
    return HttpResponse.json({
      projects: [...],
      pagination: { total: 2, limit: 50, offset: 0, hasMore: false },
    });
  }),
);

const projects = await listProjects();
expect(projects).toHaveLength(2);
```

## Available Endpoints

All endpoints registered at `/api/v1`:

| Method | Path | Contract Name | Description |
|--------|------|---------------|-------------|
| POST | `/scans` | `createScan` | Create new scan (sync or async) |
| GET | `/projects` | `listProjects` | List all projects with pagination |
| GET | `/projects/:projectId` | `getProject` | Get project details |
| GET | `/projects/:projectId/runs` | `listProjectRuns` | List runs for project |
| POST | `/projects/:projectId/runs` | `createProjectRun` | Create new run |
| GET | `/runs/:runId` | `getRunDetails` | Get run details |
| GET | `/pages/:pageId` | `getPageDetails` | Get page details |

## Best Practices

1. **Always update the contract first** when adding new endpoints
2. **Run `npm run build:shared`** after changing the contract
3. **Use `z.coerce` for query parameters** to handle string-to-number conversion
4. **Type narrow response status** with `as const` for proper type inference
5. **Keep error responses consistent** using `errorResponseSchema`

## Migration Status

- ✅ **API Contract Defined**: 7 endpoints in `packages/shared/src/api-contract.ts`
- ✅ **Backend Integration**: All endpoints implemented with @ts-rest/fastify
- ✅ **Frontend Client**: Type-safe client replacing hardcoded API calls
- ✅ **Testing**: 20/20 backend tests, 63/63 frontend tests passing
- ✅ **Documentation**: Usage examples and best practices documented

See [PR #118](https://github.com/gander-tools/diff-voyager/pull/118) for full implementation details.

## Related Documentation

- [Backend Development](backend-dev.md) - Backend implementation patterns
- [Running Servers](running-servers.md) - Server configuration
- [Security Guidelines](security.md) - API security best practices
