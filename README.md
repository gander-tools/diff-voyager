# Diff Voyager

Multi-process visual regression testing platform with API server, Worker, and CLI.

## Architecture

- **API Server**: Fastify + oRPC - handles commands/queries (CQRS)
- **Worker**: Async job processor - executes Playwright/Crawlee crawling
- **CLI**: Thin facade - sends commands to API

## Installation

```bash
bun install
```

## Development

### Start API Server

```bash
bun run dev:api
# Server runs on http://localhost:3000
```

### Start Worker

```bash
bun run dev:worker
# Polls queue every 5 seconds
```

### Use CLI

```bash
# Create project
bun run dev:cli project create my-site https://example.com

# Get project
bun run dev:cli project get my-site

# List projects
bun run dev:cli project list

# Create snapshot
bun run dev:cli snapshot create my-site --full
```

## Testing

```bash
# Run all tests
bun test

# Run tests with coverage
bun run test:coverage

# Run specific module tests
bun test tests/unit/queue/
bun test tests/unit/project/
bun test tests/unit/snapshot/
bun test tests/unit/api/
```

## Code Quality

```bash
# Format code
bun run format

# Check formatting
bun run format:check

# Type check
bun run typecheck
```

## Environment Variables

### API Server

- `PORT` - API server port (default: 3000)
- `HOST` - API server host (default: 0.0.0.0)
- `DATA_DIR` - Data directory (default: ./data)

### Worker

- `POLL_INTERVAL` - Polling interval in ms (default: 5000)

### CLI

- `API_URL` - API server URL (default: http://localhost:3000)

## Project Structure

```
src/
├── queue/              # Queue domain (Job entity, InMemoryQueue)
├── project/            # Project domain (Project entity, repositories)
├── snapshot/           # Snapshot domain (Snapshot entity, repositories)
├── api/                # API routers
└── entrypoints/
    ├── api.ts          # API server entry point
    ├── worker.ts       # Worker entry point
    └── cli.ts          # CLI entry point

tests/
└── unit/
    ├── queue/          # Queue module tests
    ├── project/        # Project module tests
    ├── snapshot/       # Snapshot module tests
    └── api/            # API router tests
```

## Test Statistics

- **Total Tests**: 46
- **Test Coverage**: Queue (14), Project (15), Snapshot (11), API (6)
- **All Passing**: ✓

## Implementation Status

### ✅ Completed

- Queue module (Job entity + InMemoryQueue)
- Project module (Project entity + FilesystemProjectRepository)
- Snapshot module (Snapshot entity + FilesystemSnapshotRepository)
- API Server (Projects & Snapshots routers)
- Worker Process (job polling + retry logic)
- CLI (thin API wrapper)

### 🚧 Future Enhancements

- Playwright snapshot engine (screenshots, HAR, HTML capture)
- Crawlee full site crawler
- Visual diff comparison engine
- Web UI
- Database backend (PostgreSQL/SQLite)
- Redis/RabbitMQ queue implementations

## Development Approach

This project was built using **Test-Driven Development (TDD)**:

- **Chicago School** (primary): Real collaborators, minimal mocking
- **London School** (fallback): Used when setup complexity was high
- **RED → GREEN → REFACTOR** cycle strictly followed
- Every feature has tests written first

## License

GPL-3.0
