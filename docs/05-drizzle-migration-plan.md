# Drizzle ORM Migration - Task Checklist

## Phase 0: Preparation & Setup

- [x] 0.1: Install Drizzle dependencies (`drizzle-orm`, `drizzle-kit`)
- [x] 0.2: Create `drizzle.config.ts` configuration file
- [x] 0.3: Create directory structure (`src/storage/drizzle/schema/`, `src/storage/drizzle/migrations/`)
- [x] 0.4: Define `pages` table schema (simplest - no JSON)
- [x] 0.5: Define `projects` table schema (1 JSON column: config_json)
- [x] 0.6: Define `runs` table schema (2 JSON columns: config_json, statistics_json)
- [x] 0.7: Define `snapshots` table schema (4 JSON columns)
- [x] 0.8: Define `diffs` table schema (2 JSON columns)
- [x] 0.9: Define `tasks` table schema (1 JSON column, composite indexes)
- [x] 0.10: Create schema index file (`src/storage/drizzle/schema/index.ts`)
- [x] 0.11: Create Drizzle database connection helper (`src/storage/drizzle/db.ts`)
- [x] 0.12: Extend test utilities for Drizzle support

## Phase 1: PageRepository Migration (TDD)

- [ ] 1.1: Extract IPageRepository interface from current implementation
- [ ] 1.2: Write comprehensive tests for PageRepositoryDrizzle (TDD - tests first)
- [ ] 1.3: Implement PageRepositoryDrizzle class (make tests pass)
- [ ] 1.4: Add comparison tests (verify SQL vs Drizzle equivalence)
- [ ] 1.5: Add security tests (SQL injection prevention)
- [ ] 1.6: Add performance benchmarks (verify <5% regression)
- [ ] 1.7: Update documentation (CLAUDE.md, migration plan status)

## Progress

**Last Updated:** 2026-01-08
**Current Task:** 1.1 - Extract IPageRepository interface
**Completed:** 12/19 tasks (Phase 0 complete)

## Notes

This checklist tracks the Drizzle ORM migration progress. Each task corresponds to a single commit following conventional commits format. All commits are made to the `feat/drizzle-migration` branch, NOT to `main`.
