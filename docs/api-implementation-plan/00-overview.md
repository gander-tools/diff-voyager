# API Implementation Plan - Overview

## Document Purpose

This document outlines the implementation plan for three core API scenarios of Diff Voyager, enabling programmatic page scanning and comparison without a UI.

## Scenarios Summary

### Scenario 1: Single Page Scan API

**Flow:**
1. Client sends POST request with a single URL to scan
2. Server creates a new Project with single-page configuration (no crawler)
3. Server creates a task and adds it to the processing queue
4. Server returns task/project identifier immediately
5. Task is processed asynchronously:
   - Page is loaded via Playwright
   - HTML, HTTP headers, and status are captured
   - SEO metadata is extracted
   - Screenshot is taken
   - Optional: HAR file is generated
   - All artifacts are persisted
6. Results are available via Scenario 3 endpoints

### Scenario 2: Full Domain Crawl API

**Flow:**
1. Client sends POST request with base URL and crawler options
2. Server creates a new Project with crawler configuration
3. Server creates a task and adds it to the processing queue
4. Server returns task/project identifier immediately
5. Task is processed asynchronously:
   - Crawler discovers all pages within domain scope
   - Each page is processed as in Scenario 1
   - Progress is tracked per-page
   - Run can be interrupted and resumed
6. Results are available via Scenario 3 endpoints

### Scenario 3: Project/Results Retrieval API

**Endpoints:**
1. Get project details (status, configuration, statistics)
2. Get run details (pages, progress, statistics)
3. List pages with optional diff filtering
4. Get page snapshot details (SEO, headers, content hash)
5. Get page diffs (SEO changes, visual changes, header changes)
6. Get artifact binaries (screenshots, diff images)

## Key Design Decisions

### Identifiers
- **Project ID**: UUID v4, generated on project creation
- **Run ID**: UUID v4, generated on run creation
- **Page ID**: UUID v4, generated per normalized URL per project
- **Snapshot ID**: UUID v4, generated per page per run

### Queue & Processing
- Persistent queue using SQLite
- Atomic task processing with resume capability
- Task states: PENDING, IN_PROGRESS, COMPLETED, FAILED
- Retry logic with configurable attempt limits

### Storage
- SQLite database for metadata and relationships
- File system for artifacts (screenshots, diffs, HARs)
- Structured directory layout per project/run

### Response Format
- All endpoints return JSON
- Binary artifacts returned with appropriate Content-Type
- Consistent error response structure
- Pagination for list endpoints

## MVP Scope Alignment

This implementation covers PRD sections:
- 4.1: Main solo developer flow (baseline creation, comparison runs)
- 4.3: Crawl and queue (persistent queue, atomic operations, resume)
- 4.4: Data collection (HTML, headers, SEO, screenshots, HAR)
- 4.5: Comparison and diff (HTML/SEO, visual, HAR comparison)

**Deferred to future iterations:**
- 4.2: Project edit/delete (only create for now)
- 4.6: Diff acceptance and muting (read-only for now)
- 4.7: Export functionality

## Document Structure

| Document | Content |
|----------|---------|
| `01-domain-types.md` | TypeScript interfaces and types |
| `02-api-endpoints.md` | REST API specification |
| `03-tdd-test-plan.md` | Test structure and test cases |
| `04-implementation-phases.md` | Development phases and tasks |
