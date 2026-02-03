# Diff Voyager - Implementation Strategy

**Date:** 2026-02-03
**Version:** 0.1.0
**Status:** Active

## Overview

Implementation plan for Diff Voyager multi-process visual regression testing platform. This document outlines the testing approach, build order, technical decisions, and development workflow.

---

## Testing Philosophy

### Test Organization

```
tests/
├── unit/           # Isolated component tests (Chicago/London)
├── integration/    # Multi-component collaboration tests
└── e2e/           # Full system end-to-end scenarios
```

### Testing Methodology

**Primary: Chicago School (Classicist/Inside-Out)**
- Use real collaborators when possible
- Minimal mocking - only mock external boundaries (filesystem, network)
- Test behavior through actual object interactions
- More resilient to refactoring

**Fallback: London School (Mockist/Outside-In)**
- Use when building real model would be too complex
- Heavy mocking of dependencies
- Test units in complete isolation
- Faster setup for complex scenarios

**Documentation Requirement:**
Every test file must include header comment indicating methodology:

```typescript
/**
 * Module Name - Component Description
 * Testing Methodology: Chicago School (using real collaborators)
 * OR
 * Testing Methodology: London School (mocked dependencies)
 */
```

---

## Build Order

**Bottom-Up (Inside-Out) - Chicago School Approach:**

1. **Queue Module** - Foundation for job management
2. **Project Module** - Domain entities + filesystem repository
3. **Snapshot Module** - Domain entities + Playwright engine
4. **API Server** - oRPC endpoints orchestration
5. **Worker Process** - Job consumer and executor
6. **CLI** - Thin wrapper over API client

Each layer builds on fully tested foundations.

---

## File Structure

**Incremental Creation (As-Needed):**
- Create folders/files only when writing tests for that module
- Start with `src/queue/`, expand as we build
- No empty directories
- Follows TDD naturally

**Module Organization:**
```
src/
├── queue/
│   ├── domain/
│   │   ├── job.entity.ts
│   │   └── queue.interface.ts
│   └── infrastructure/
│       └── in-memory-queue.ts
├── project/
│   ├── domain/
│   ├── infrastructure/
│   └── services/
├── snapshot/
│   ├── domain/
│   ├── infrastructure/
│   └── services/
├── shared/
│   ├── config/
│   ├── logger/
│   └── utils/
└── entrypoints/
    ├── api.ts
    ├── worker.ts
    └── cli.ts
```

---

## Queue Module - Technical Design

### Queue Interface (Domain Layer)

```typescript
interface Queue<T> {
  enqueue(job: T): Promise<string>;              // Returns job ID (UUIDv7)
  dequeue(): Promise<T | null>;                  // Get next PENDING job
  updateStatus(jobId: string, status: JobStatus): Promise<void>;
  getJob(jobId: string): Promise<T | null>;      // Retrieve specific job
  listJobs(filter?: JobFilter): Promise<T[]>;    // Query jobs
}
```

### In-Memory Implementation Strategy

**Data Structure:**
- Single array: `private jobs: Job[] = []`
- No persistence (jobs lost on restart - acceptable for v0.1.0)
- No thread-safety initially (single process)

**Operations:**
- `enqueue()`: Push to array, assign UUIDv7, set status PENDING
- `dequeue()`: Find first PENDING job, mark as RUNNING, return it
- Polling mechanism: Worker calls `dequeue()` on interval

**Why This Design:**
- Simple array operations (easy to test with Chicago School)
- No external dependencies
- Trivial to swap for Redis/RabbitMQ (same interface)
- Meets v0.1.0 requirements

### Job Entity Structure

```typescript
interface Job {
  id: string;           // UUIDv7 (time-based, sortable)
  type: JobType;        // SNAPSHOT_SINGLE | SNAPSHOT_CRAWL
  status: JobStatus;    // PENDING | RUNNING | COMPLETED | FAILED | RETRYING
  payload: unknown;     // Job-specific data (flexible)
  createdAt: Date;
  updatedAt: Date;
  retryCount: number;   // Current retry attempt
  maxRetries: number;   // Max allowed retries (default: 3)
}
```

---

## Configuration Files

### TypeScript Configuration (tsconfig.json)

**Key Settings:**
- **Target:** ES2022 (modern features, Node 24+ support)
- **Module:** ESNext with Node16 resolution
- **Strict Mode:** Enabled (catch type errors early)
- **Path Aliases:** `@/*` → `src/*` for clean imports
- **Types:** Bun types included

### Biome Configuration (biome.json)

**Formatter Rules:**
- Indentation: Tabs (width 2)
- Quotes: Single quotes
- Trailing commas: Always
- Line width: 100 characters

**Linter:**
- Recommended rules enabled
- No unused variables
- No console.log in production code

**Organization:**
- Auto-organize imports
- Auto-remove unused imports

**File Patterns:**
- Include: `src/`, `tests/`
- Ignore: `dist/`, `node_modules/`, `data/`, `*.log`

---

## Project Initialization Steps

### Setup Sequence

1. **Install Dependencies**
   ```bash
   bun install
   ```

2. **Create Configuration Files**
   - `tsconfig.json`
   - `biome.json`

3. **Update `.gitignore`**
   Add: `dist/`, `node_modules/`, `data/`, `*.log`, `.DS_Store`, `coverage/`

4. **Verify Tooling**
   ```bash
   bun run format:check    # Test Biome
   bun run typecheck       # Test TypeScript
   ```

5. **Data Directory**
   - NOT created initially
   - Generated at runtime when first project created
   - Stays in `.gitignore`

---

## Development Workflow

### TDD Cycle (Per Module)

1. **RED** - Create test file in `tests/unit/{module}/`, write failing test
2. **GREEN** - Create minimal implementation in `src/{module}/`, make test pass
3. **REFACTOR** - Improve code quality while keeping tests green
4. **FORMAT** - Run `bun run format` before commit
5. **COMMIT** - Atomic commit with conventional commit message

### Git Workflow

**Branch Naming:**
```
feature/{module-name}
bugfix/{issue-description}
refactor/{component-name}
test/{test-addition}
docs/{documentation-update}
```

**Commit Strategy:**
- Atomic commits after each working test
- Conventional commits format
- Always format before staging

**Example:**
```bash
git checkout -b feature/queue-module
# Write test + implementation
bun run format
git add .
git commit -m "feat(queue): add in-memory queue with enqueue/dequeue"
```

---

## Implementation Roadmap

### Phase 1: Queue Module
- [ ] Create `tests/unit/queue/` directory
- [ ] Write tests for `Job` entity
- [ ] Implement `Job` entity with validation
- [ ] Write tests for `InMemoryQueue`
- [ ] Implement `InMemoryQueue` with array-based storage
- [ ] Test enqueue/dequeue operations
- [ ] Test status updates
- [ ] Test job retrieval and listing

### Phase 2: Project Module
- [ ] Define `Project` entity with validation
- [ ] Create `ProjectRepository` interface
- [ ] Implement `FilesystemProjectRepository`
- [ ] Create `ProjectService` with create/get/list operations
- [ ] Test project creation flow
- [ ] Test project retrieval (by UUID and name)
- [ ] Test filesystem persistence

### Phase 3: Snapshot Module
- [ ] Define `Snapshot` entity
- [ ] Create snapshot repository interface
- [ ] Implement Playwright snapshot engine
- [ ] Create crawler service (Crawlee integration)
- [ ] Test single page capture
- [ ] Test full site crawl
- [ ] Test error handling and retries

### Phase 4: API Server
- [ ] Set up oRPC with Fastify
- [ ] Configure middleware (CORS, rate-limit, swagger)
- [ ] Implement `projects.create` endpoint
- [ ] Implement `projects.get` endpoint
- [ ] Implement `projects.list` endpoint
- [ ] Implement `snapshots.create` endpoint
- [ ] Add Zod validation schemas
- [ ] Test API error handling

### Phase 5: Worker Process
- [ ] Create worker polling mechanism
- [ ] Implement job consumer
- [ ] Add Playwright browser initialization
- [ ] Implement single page snapshot handler
- [ ] Implement full crawl handler
- [ ] Add retry logic with exponential backoff
- [ ] Test error scenarios

### Phase 6: CLI
- [ ] Set up Commander.js
- [ ] Create API client wrapper
- [ ] Implement `project create` command
- [ ] Implement `project get` command
- [ ] Implement `project list` command
- [ ] Implement `snapshot create` command
- [ ] Add global options (--debug, --headed, --api)

---

## Testing Strategy Details

### Chicago School Example (Queue Module)

```typescript
/**
 * Queue Module - In-Memory Implementation
 * Testing Methodology: Chicago School (using real queue instance)
 */

describe('InMemoryQueue', () => {
  let queue: InMemoryQueue;

  beforeEach(() => {
    queue = new InMemoryQueue(); // Real instance, no mocks
  });

  test('enqueue adds job and returns job ID', async () => {
    const jobId = await queue.enqueue({
      type: JobType.SNAPSHOT_SINGLE,
      payload: { url: 'https://example.com' }
    });

    expect(jobId).toMatch(/^[0-9a-f-]{36}$/); // UUIDv7 format

    const job = await queue.getJob(jobId);
    expect(job?.status).toBe(JobStatus.PENDING);
  });
});
```

### London School Example (When Needed)

```typescript
/**
 * Project Service - Business Logic
 * Testing Methodology: London School (mocked repository - complex filesystem setup)
 */

describe('ProjectService', () => {
  let service: ProjectService;
  let mockRepository: jest.Mock<ProjectRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
    };
    service = new ProjectService(mockRepository);
  });

  test('create project validates name format', async () => {
    await expect(
      service.create({ name: 'invalid name!', url: 'https://example.com' })
    ).rejects.toThrow('Name must be alphanumeric');

    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
```

---

## Acceptance Criteria

### Queue Module Complete When:
- [x] All job operations tested (enqueue, dequeue, update, get, list)
- [x] UUIDv7 generation works
- [x] Status transitions validated
- [x] Chicago School tests passing
- [x] Code formatted with Biome
- [x] Committed to feature branch

### Project Module Complete When:
- [x] Project entity with full validation
- [x] Filesystem repository reads/writes project.json
- [x] Projects can be retrieved by UUID or name
- [x] Service layer handles business logic
- [x] All tests passing (Chicago School primary)
- [x] Code formatted and committed

### Ready for API Integration When:
- [x] Queue module stable
- [x] Project module stable
- [x] Snapshot module stable
- [x] All domain logic tested
- [x] Repository interfaces defined

---

## Success Metrics

**Code Quality:**
- Test coverage >80% per module
- Zero TypeScript errors
- Zero Biome errors
- All tests passing

**Architecture:**
- Clear separation: domain / infrastructure / services
- Swappable implementations (repositories, queue)
- Type-safe interfaces
- No circular dependencies

**TDD Adherence:**
- Every feature has test written first
- Atomic commits with working tests
- RED → GREEN → REFACTOR cycle followed

---

## Next Actions

1. ✅ Create this implementation plan
2. ⏳ Set up configuration files (tsconfig.json, biome.json)
3. ⏳ Run `bun install`
4. ⏳ Start Queue module implementation (TDD)
5. ⏳ Continue with Project module
6. ⏳ Build remaining modules per roadmap

---

## Notes

- **Data directory:** Created at runtime, not committed to git
- **Queue persistence:** In-memory only for v0.1.0, swappable later
- **Testing methodology:** Primarily Chicago School, document when using London
- **Commits:** Always format before commit, atomic commits per working test
- **Branch strategy:** Feature branches per module, merge to main when stable

---

**Last Updated:** 2026-02-03
**Next Review:** After Queue module completion
