# Features Documentation

Detailed documentation for each major feature of Diff Voyager.

## Available Features

### [Crawler](crawler.md)
**Status**: ✅ Complete (Phase 3)

Browser automation and page capture system:
- Browser Manager (Playwright pooling)
- Page Capturer (HTML, screenshots, SEO, HAR)
- Single Page Processor
- Site Crawler (Crawlee integration)

**Key Capabilities**:
- Multi-page URL discovery
- Domain boundary checking
- Concurrent processing
- Browser instance pooling
- Progress tracking

### [Comparators](comparators.md)
**Status**: ✅ Complete (Phase 2)

Diff detection algorithms:
- SEO Comparator (title, meta, canonical, robots, headings)
- Visual Comparator (pixelmatch, diff images)
- Header Comparator (HTTP headers)
- Performance Comparator (load time, requests, size)
- Page Comparator (orchestration)

**Key Capabilities**:
- Comprehensive diff detection
- Severity classification (CRITICAL, WARNING, INFO)
- Visual diff image generation
- Performance delta calculation

### [Task Queue](task-queue.md)
**Status**: ✅ Complete (Phase 4)

Asynchronous task processing:
- SQLite-based queue
- Priority scheduling
- Retry logic
- Stale task recovery
- Background processing

**Key Capabilities**:
- Persistent queue (survives restarts)
- Atomic operations
- Graceful shutdown
- Progress tracking

### [Frontend Plan](frontend-plan.md)
**Status**: ❌ Not Started

Vue 3 UI implementation plan:
- Project management
- Run comparison
- Diff review interface
- Mute rules
- Export functionality

**Planned Features**:
- Visual diff viewer
- Side-by-side comparison
- Diff acceptance workflow
- Responsive design

## Feature Status Overview

| Feature | Phase | Status | Test Coverage |
|---------|-------|--------|---------------|
| Crawler | 3 | ✅ Complete | 41+ tests |
| Comparators | 2 | ✅ Complete | 63+ tests |
| Task Queue | 4 | ✅ Complete | 19+ tests |
| Frontend UI | - | ❌ Not Started | - |

## See Also

- [Implementation Status](../development/implementation-status.md) - Overall progress
- [Roadmap](../development/roadmap.md) - Planned features
- [Architecture](../architecture/overview.md) - System design

## Quick Reference

For detailed implementation information, see:
- Phase 2 details: docs/api-implementation-plan/04-implementation-phases.md (lines 196-290)
- Phase 3 details: docs/api-implementation-plan/04-implementation-phases.md (lines 292-358)
- Phase 4 details: docs/api-implementation-plan/04-implementation-phases.md (lines 360-400)
