# Drizzle ORM Migration Plan

## Document Purpose

This document outlines the strategic plan for migrating Diff Voyager's data access layer from raw SQL queries with `better-sqlite3` to **Drizzle ORM**, a TypeScript-first SQL toolkit that provides type safety while maintaining the performance and simplicity of direct SQL access.

## Executive Summary

### Why Drizzle ORM?

Drizzle ORM is the **recommended choice** for Diff Voyager because:

1. **Perfect SQLite Integration**: Native support for `better-sqlite3` driver
2. **Zero Runtime Overhead**: Thin abstraction over SQL with no performance penalty
3. **TypeScript-First Design**: Excellent type inference and compile-time safety
4. **Security by Default**: Automatic prepared statements (OWASP compliance)
5. **JSON Column Support**: First-class support for JSON fields (critical for this project)
6. **No Code Generation**: Schema defined in TypeScript, not generated files
7. **Migration Compatibility**: Can coexist with current SQL during transition
8. **Local-First Philosophy**: Designed for SQLite and edge deployments

### Migration Philosophy

This migration follows **incremental adoption** principles:

- ✅ **Non-Breaking**: Migrate repository by repository
- ✅ **Reversible**: Keep old code until fully validated
- ✅ **Testable**: Maintain TDD approach throughout
- ✅ **Secure**: Improve security posture during migration
- ✅ **Performance-Neutral**: No performance degradation

## Current State Analysis

### Database Architecture

**Current Components:**
- Database: SQLite with `better-sqlite3` driver
- Schema: 6 core tables (projects, runs, pages, snapshots, diffs, tasks)
- Migrations: Custom tracking table with numbered migration functions
- Queries: Prepared statements via `db.prepare()` API
- JSON Storage: Heavy use of `*_json` TEXT columns for complex data
- Repositories: 5 repository classes with raw SQL queries

### Key Characteristics

**Strengths to Preserve:**
- Synchronous API (better-sqlite3 advantage)
- Prepared statements for security
- Transaction support
- WAL mode for concurrency
- Custom migration tracking

**Pain Points to Address:**
- No TypeScript type safety for queries
- Manual JSON serialization/deserialization
- Brittle string-based SQL queries
- Limited query composition capabilities
- No automated type checking for schema changes

## Drizzle ORM Overview

### Core Concepts

**Schema Definition:**
- TypeScript objects define tables and columns
- Types are inferred from schema, not generated
- Schema lives alongside application code

**Query Builder:**
- Fluent API for building type-safe queries
- Automatic prepared statement generation
- Native SQL feel with TypeScript safety

**Migrations:**
- CLI tool (`drizzle-kit`) generates migrations from schema
- Compatible with existing migration patterns
- Can integrate with custom migration tracking

**Relations:**
- Declarative relationship definitions
- Type-safe joins and nested queries
- Lazy loading support

### Feature Mapping

| Current Feature | Drizzle Equivalent | Notes |
|----------------|-------------------|-------|
| `db.prepare()` | `db.select()`, `db.insert()` | Automatic prepared statements |
| JSON columns | `json()`, `jsonb()` column types | Type-safe JSON with inference |
| Transactions | `db.transaction()` | Similar API, better typing |
| Migrations | `drizzle-kit migrate` | Automated from schema diff |
| Custom types | `customType()` helper | Extend column types |
| Foreign keys | `references()` | Declarative in schema |

## Migration Strategy

### Phase 0: Preparation (Setup & Learning)

**Objectives:**
- Install Drizzle dependencies
- Create parallel schema definitions
- Establish testing baseline
- Document current repository interfaces

**Tasks:**
1. Install `drizzle-orm` and `drizzle-kit` packages
2. Create `src/storage/drizzle/schema/` directory structure
3. Define Drizzle schemas mirroring current SQL tables
4. Configure `drizzle.config.ts` for migration generation
5. Generate initial migration from Drizzle schema
6. Verify migration matches current database state
7. Create test utilities for Drizzle repositories

**Deliverables:**
- Drizzle schema files for all 6 tables
- Configuration file for drizzle-kit
- Test helper functions for repository testing
- Migration verification script

**Success Criteria:**
- Schema definitions compile without errors
- Generated migration is semantically identical to current schema
- All current tests pass (no changes yet)

### Phase 1: Repository Pattern Adaptation

**Objectives:**
- Define repository interface contracts
- Create Drizzle-based repository implementations
- Maintain backward compatibility
- Establish testing patterns

**Focus Areas:**

**1. Repository Interface Standardization:**
- Extract interfaces from current repository classes
- Define method signatures independent of implementation
- Document expected behaviors and edge cases
- Create interface compliance tests

**2. Dual Implementation Strategy:**
- Keep existing SQL repositories (`*Repository.ts`)
- Create new Drizzle repositories (`*Repository.drizzle.ts`)
- Both implement same interface contract
- Switch via dependency injection or feature flag

**3. Testing Framework:**
- Shared test suites for both implementations
- Property-based tests for query equivalence
- Performance benchmarks for comparison
- Security tests for SQL injection prevention

**Deliverables:**
- Repository interfaces (IProjectRepository, IRunRepository, etc.)
- Dual implementation for at least one repository
- Shared test suite framework
- Performance comparison tooling

**Success Criteria:**
- All tests pass for both implementations
- No performance regression > 5%
- Security tests verify prepared statement usage

### Phase 2: Progressive Repository Migration

**Migration Order (Simplest → Most Complex):**

**1. PageRepository (Simplest)**
- Straightforward CRUD operations
- No complex JSON fields
- Limited join operations
- Good learning ground

**2. ProjectRepository**
- Single JSON field (config)
- Moderate complexity
- Clear boundaries

**3. RunRepository**
- Two JSON fields (config, statistics)
- Relations to projects
- Status tracking

**4. TaskRepository (Queue)**
- Critical for async operations
- JSON payload field
- Status transitions
- Concurrent access patterns

**5. SnapshotRepository (Most Complex)**
- Five JSON fields (redirect_chain, headers, seo_data, performance_data)
- Multiple file path references
- Complex queries with joins
- Diff comparisons

**6. DiffRepository**
- Two JSON fields (summary, changes)
- References to multiple snapshots
- Complex comparison logic

**Per-Repository Migration Steps:**

1. **Schema Definition**
   - Define Drizzle schema with proper types
   - Map JSON fields to TypeScript types
   - Define relations to other tables

2. **Implementation**
   - Implement repository using Drizzle query builder
   - Handle JSON serialization/deserialization
   - Implement transaction support where needed

3. **Testing**
   - Run shared test suite against new implementation
   - Add Drizzle-specific tests if needed
   - Verify query equivalence with current implementation
   - Run security tests

4. **Integration**
   - Switch dependency injection to use new repository
   - Run full integration test suite
   - Monitor performance in test environment

5. **Validation**
   - Manual smoke testing
   - Compare query plans (EXPLAIN QUERY PLAN)
   - Verify artifact storage still works
   - Check error handling

6. **Cleanup (After All Repositories)**
   - Remove old repository implementation
   - Remove abstraction layer if used
   - Update documentation

**Deliverables (per repository):**
- Drizzle schema for table
- Repository implementation
- Passing test suite
- Migration validation report

**Success Criteria (per repository):**
- All tests pass (unit + integration)
- Performance within 5% of baseline
- Security tests verify injection prevention
- No regressions in API behavior

### Phase 3: Migration System Integration

**Objectives:**
- Integrate Drizzle migrations with current system
- Maintain migration history
- Ensure backward compatibility

**Approaches:**

**Option A: Parallel Migration Tracking**
- Keep current `migrations` table
- Add Drizzle's migration tracking (`__drizzle_migrations`)
- Both systems track their own migrations
- Manual coordination during transition

**Option B: Unified Migration Tracking**
- Migrate current migration history to Drizzle format
- Convert existing migration functions to SQL files
- Use Drizzle exclusively going forward

**Option C: Hybrid (Recommended)**
- Keep current migrations as-is (historical record)
- New migrations use Drizzle exclusively
- Migration script checks both systems
- Single source of truth: Drizzle schema

**Implementation Steps:**

1. **Migration System Analysis**
   - Document current migration behavior
   - Identify migration dependencies
   - Plan migration numbering scheme

2. **Integration Implementation**
   - Create migration wrapper if needed
   - Update `createDatabase()` function
   - Handle migration ordering

3. **Testing**
   - Test fresh database creation
   - Test migration from each historical version
   - Test rollback scenarios (if supported)

4. **Documentation**
   - Update migration guide
   - Document hybrid system behavior
   - Create migration authoring guide

**Deliverables:**
- Integrated migration system
- Migration testing suite
- Updated migration documentation

**Success Criteria:**
- Fresh database creation works
- Existing databases can upgrade
- Migration history is preserved

### Phase 4: Advanced Features & Optimization

**Objectives:**
- Leverage Drizzle-specific features
- Optimize query patterns
- Improve type safety across codebase

**Feature Implementation:**

**1. Type-Safe JSON Columns**
```typescript
// Example concept (not actual current code):
// Define TypeScript types for JSON columns
// Use Drizzle's $inferSelect and $inferInsert
// Automatic serialization/deserialization
```

**2. Relation Queries**
- Use Drizzle's relational query API
- Simplify joins across tables
- Improve query composition

**3. Transaction Patterns**
- Standardize transaction usage
- Implement transaction helpers
- Add transaction testing utilities

**4. Query Optimization**
- Review query plans
- Add indexes where beneficial
- Optimize hot paths

**5. Developer Experience**
- Create repository base classes
- Add query logging in development
- Improve error messages

**Deliverables:**
- Type definitions for all JSON columns
- Relational query examples
- Transaction helper utilities
- Performance optimization report

**Success Criteria:**
- Type errors caught at compile time
- Query performance maintained or improved
- Developer velocity increased

### Phase 5: Cleanup & Documentation

**Objectives:**
- Remove legacy code
- Update all documentation
- Create migration guide for future developers

**Tasks:**

1. **Code Cleanup**
   - Remove old repository implementations
   - Remove abstraction layers
   - Clean up unused dependencies
   - Remove feature flags/switches

2. **Documentation Updates**
   - Update CLAUDE.md with Drizzle patterns
   - Create Drizzle best practices guide
   - Update API implementation plan
   - Document schema change process

3. **Team Knowledge Transfer**
   - Create example queries guide
   - Document common patterns
   - Create troubleshooting guide

4. **Future Migration Process**
   - Document how to add new tables
   - Document schema change process
   - Create migration checklist

**Deliverables:**
- Clean codebase without legacy SQL
- Updated documentation
- Migration knowledge base

**Success Criteria:**
- No dead code remains
- Documentation is current
- New developers can work with Drizzle

## Security Considerations

### Security Improvements

**Automatic Prepared Statements:**
- Drizzle always uses prepared statements
- Eliminates SQL injection risk
- No manual parameterization needed

**Type Safety:**
- Invalid queries caught at compile time
- Prevents runtime SQL errors
- Reduces attack surface

**Input Validation:**
- Schema enforcement at type level
- Invalid data rejected before database
- Reduces injection vectors

### Security Testing Plan

**Test Categories:**

1. **SQL Injection Prevention**
   - Test malicious input in all parameters
   - Verify prepared statements used
   - Test JSON field injection

2. **Path Traversal (Existing Tests)**
   - Continue testing artifact path security
   - Ensure Drizzle doesn't change behavior
   - Verify file access controls remain

3. **Rate Limiting (Existing)**
   - Ensure migration doesn't affect rate limiting
   - Test under load conditions

4. **Input Validation**
   - Test schema constraints
   - Test JSON validation
   - Test foreign key constraints

**Security Checklist (Per Repository):**
- [ ] All queries use prepared statements
- [ ] User input is validated before queries
- [ ] JSON fields have schema validation
- [ ] Error messages don't leak information
- [ ] Transaction isolation is correct
- [ ] Security tests pass

## Testing Strategy

### Test Categories

**1. Unit Tests (Repository Methods)**
- Individual method behavior
- Edge cases and error handling
- Transaction rollback scenarios
- JSON serialization/deserialization

**2. Integration Tests (Multi-Repository)**
- Cross-repository operations
- Complex queries with joins
- Transaction spanning multiple tables
- Artifact storage integration

**3. Migration Tests**
- Fresh database creation
- Upgrade from each version
- Schema consistency verification
- Data preservation

**4. Performance Tests**
- Query execution time
- Transaction throughput
- Memory usage
- Concurrent operation handling

**5. Security Tests**
- SQL injection attempts
- Invalid input handling
- Transaction isolation
- Constraint enforcement

### Test Data Strategy

**Test Database Approaches:**

1. **In-Memory SQLite** (Current approach)
   - Fast test execution
   - Isolated per test
   - No cleanup needed

2. **Fixture Files**
   - Consistent test data
   - Complex scenarios
   - Shared across tests

3. **Factories/Builders**
   - Dynamic test data generation
   - Flexible test scenarios
   - Type-safe data creation

**Recommended Approach:**
- Keep in-memory SQLite for isolation
- Use factories for test data generation
- Add fixture files for complex scenarios

### Regression Prevention

**Comparison Testing:**
- Run both implementations in parallel
- Compare results for identical inputs
- Verify behavioral equivalence

**Property-Based Testing:**
- Generate random valid inputs
- Verify invariants hold
- Find edge cases automatically

**Snapshot Testing:**
- Capture query results for known inputs
- Detect unexpected changes
- Validate across migrations

## Performance Considerations

### Performance Requirements

**Goals:**
- Zero performance regression on hot paths
- Maintain sub-100ms response times for API endpoints
- Handle 1000+ pages per project efficiently
- Support concurrent read operations

### Benchmark Plan

**Metrics to Track:**

1. **Query Performance**
   - SELECT query execution time
   - INSERT/UPDATE operation time
   - Complex join queries
   - JSON field operations

2. **Transaction Performance**
   - Transaction commit time
   - Rollback overhead
   - Concurrent transaction handling

3. **Memory Usage**
   - Connection pool size
   - Query builder overhead
   - JSON parsing overhead

4. **Disk I/O**
   - Database file size
   - WAL file growth
   - Checkpoint frequency

**Benchmarking Process:**

1. **Baseline Establishment**
   - Benchmark current implementation
   - Document hot paths
   - Identify performance-critical queries

2. **Per-Repository Benchmarking**
   - Benchmark new implementation
   - Compare with baseline
   - Identify regressions

3. **Optimization**
   - Profile slow queries
   - Add indexes if needed
   - Optimize query patterns

4. **Final Validation**
   - Full system benchmark
   - Real-world scenario testing
   - Load testing

**Performance Acceptance Criteria:**
- No query >5% slower than baseline
- Hot paths within 2% of baseline
- Memory usage increase <10%
- Database file size unchanged

## Risk Management

### Identified Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Breaking API behavior | High | Medium | Shared test suites, integration tests |
| Performance regression | Medium | Low | Continuous benchmarking, rollback plan |
| Data corruption during migration | High | Very Low | Backup before migration, transaction safety |
| Type system complexity | Low | Medium | Incremental learning, documentation |
| Repository interface mismatch | Medium | Low | Contract testing, interface validation |
| JSON field type issues | Medium | Medium | Careful type definition, runtime validation |
| Migration system conflicts | Medium | Low | Hybrid approach, thorough testing |
| Team learning curve | Low | Medium | Documentation, examples, gradual adoption |

### Rollback Plan

**Per-Repository Rollback:**
- Keep old implementation until fully validated
- Feature flag to switch between implementations
- Can rollback individual repository if issues found

**Full Rollback:**
- Drizzle is additive, not destructive
- Can revert to old repositories at any time
- Database schema unchanged during transition
- Remove Drizzle dependencies if needed

**Rollback Triggers:**
- Critical bug discovered
- Performance regression >10%
- Data integrity issue
- Security vulnerability introduced

## Timeline Estimates

**Note:** Following project guidelines, no specific time estimates are provided. The migration is designed to be incremental and can be paused at any phase boundary.

### Phase Duration Indicators

**Phase 0 (Preparation):**
- Scope: Setup and configuration
- Complexity: Low
- Blocking: None

**Phase 1 (Pattern Adaptation):**
- Scope: Framework and testing infrastructure
- Complexity: Medium
- Blocking: Phase 0 complete

**Phase 2 (Repository Migration):**
- Scope: 6 repositories, incremental
- Complexity: Medium to High (varies per repository)
- Blocking: Phase 1 complete
- Can be done one repository at a time

**Phase 3 (Migration Integration):**
- Scope: Migration system updates
- Complexity: Medium
- Blocking: At least one repository migrated

**Phase 4 (Advanced Features):**
- Scope: Optional optimizations
- Complexity: Low to Medium
- Blocking: Phase 2 complete (all repositories)

**Phase 5 (Cleanup):**
- Scope: Documentation and code cleanup
- Complexity: Low
- Blocking: Phase 4 complete

### Incremental Delivery

The migration can be paused after:
- ✅ Phase 1: Testing infrastructure ready
- ✅ After each repository in Phase 2
- ✅ Phase 3: Migration system updated
- ✅ Phase 4: Advanced features implemented

This allows for flexibility based on project priorities and available resources.

## Success Criteria

### Migration Success Metrics

**Code Quality:**
- [ ] All TypeScript strict mode errors resolved
- [ ] 100% of tests passing
- [ ] Zero linting errors
- [ ] Code coverage maintained or improved

**Functionality:**
- [ ] All API endpoints work identically
- [ ] All artifact storage operations work
- [ ] All comparison logic unchanged
- [ ] Queue processing unaffected

**Performance:**
- [ ] No query >5% slower
- [ ] Hot paths within 2% of baseline
- [ ] Memory usage increase <10%
- [ ] API response times maintained

**Security:**
- [ ] All queries use prepared statements
- [ ] SQL injection tests pass
- [ ] Input validation tests pass
- [ ] Security audit clean

**Developer Experience:**
- [ ] Type errors caught at compile time
- [ ] IDE autocomplete works for queries
- [ ] Error messages are helpful
- [ ] Documentation is clear

**Maintainability:**
- [ ] No legacy SQL code remains
- [ ] Migration process documented
- [ ] Schema changes are straightforward
- [ ] New developers can contribute

## Dependencies & Prerequisites

### Required Packages

**Runtime Dependencies:**
```json
{
  "drizzle-orm": "^0.36.0",
  "better-sqlite3": "^11.0.0" // Keep existing driver
}
```

**Development Dependencies:**
```json
{
  "drizzle-kit": "^0.28.0" // Migration CLI tool
}
```

### Configuration Files

**drizzle.config.ts:**
- Database connection configuration
- Migration directory paths
- Schema export paths
- SQLite-specific options

**tsconfig.json Updates:**
- Ensure Drizzle types are included
- Enable strict mode for better type safety
- Configure path aliases if needed

### Team Prerequisites

**Knowledge Requirements:**
- TypeScript generics and type inference
- SQL fundamentals (already have)
- better-sqlite3 API (already have)
- Basic understanding of ORMs vs query builders

**Recommended Learning:**
- Drizzle ORM documentation
- Schema definition patterns
- Query builder API reference
- Migration workflow

## Appendix

### A. Drizzle ORM Resources

**Official Documentation:**
- Website: https://orm.drizzle.team
- SQLite Guide: https://orm.drizzle.team/docs/get-started-sqlite
- Schema Definition: https://orm.drizzle.team/docs/sql-schema-declaration
- Query Builder: https://orm.drizzle.team/docs/select

**Community Resources:**
- GitHub: https://github.com/drizzle-team/drizzle-orm
- Discord: Official Drizzle Discord server
- Examples: https://github.com/drizzle-team/drizzle-orm/tree/main/examples

### B. Alternative ORMs Considered

**Why Not Prisma?**
- ❌ Requires code generation
- ❌ Heavier runtime overhead
- ❌ Less direct SQL control
- ❌ Schema in separate DSL

**Why Not TypeORM?**
- ❌ Heavier decorators-based approach
- ❌ More complex for simple use cases
- ❌ SQLite support is secondary

**Why Not Kysely?**
- ✅ Very similar to Drizzle
- ❌ Less opinionated (more boilerplate)
- ❌ Smaller community
- ⚖️ Valid alternative, Drizzle preferred for JSON support

### C. JSON Column Type Mapping Strategy

**Current JSON Columns:**
- `projects.config_json` → TypeScript ProjectConfig
- `runs.config_json` → TypeScript RunConfig
- `runs.statistics_json` → TypeScript RunStatistics
- `snapshots.redirect_chain_json` → TypeScript RedirectChain[]
- `snapshots.headers_json` → TypeScript HttpHeaders
- `snapshots.seo_data_json` → TypeScript SeoData
- `snapshots.performance_data_json` → TypeScript PerformanceData
- `diffs.summary_json` → TypeScript DiffSummary
- `diffs.changes_json` → TypeScript DiffChanges
- `tasks.payload_json` → TypeScript TaskPayload (polymorphic)

**Drizzle Mapping Pattern:**
- Define TypeScript types in shared package
- Use Drizzle's `json()` column type with type parameter
- Automatic serialization/deserialization
- Type inference for SELECT and INSERT operations
- Runtime validation with Zod or similar if needed

### D. Migration Checklist Template

**Per-Repository Migration Checklist:**

**Pre-Migration:**
- [ ] Repository interface defined
- [ ] Test suite prepared
- [ ] Performance baseline captured
- [ ] Security tests identified

**Implementation:**
- [ ] Schema defined in Drizzle
- [ ] Repository implemented
- [ ] JSON types mapped correctly
- [ ] Relations configured

**Testing:**
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Security tests pass
- [ ] Performance within threshold
- [ ] Manual smoke tests pass

**Integration:**
- [ ] Dependency injection updated
- [ ] API endpoints tested
- [ ] E2E tests pass
- [ ] No console errors

**Validation:**
- [ ] Query plans reviewed
- [ ] Error handling verified
- [ ] Transaction behavior correct
- [ ] Documentation updated

**Sign-Off:**
- [ ] Code review complete
- [ ] Performance approved
- [ ] Security approved
- [ ] Ready for cleanup

### E. Query Pattern Examples

**Note:** These are conceptual examples of migration patterns, not actual code from the current implementation.

**Pattern 1: Simple SELECT**
- Current: Prepared statement with `.get()`
- Drizzle: `.select().from().where()`

**Pattern 2: INSERT with RETURNING**
- Current: `.run()` then `.get()` with last_insert_rowid
- Drizzle: `.insert().values().returning()`

**Pattern 3: Transaction**
- Current: `db.transaction()` callback
- Drizzle: `db.transaction()` with typed callback

**Pattern 4: JSON Field Access**
- Current: Manual `JSON.parse()` and `JSON.stringify()`
- Drizzle: Automatic with typed columns

**Pattern 5: Complex JOIN**
- Current: Multi-line SQL string
- Drizzle: Fluent query builder or relational API

### F. Glossary

**Terms:**
- **Drizzle ORM**: TypeScript-first SQL toolkit and query builder
- **drizzle-kit**: CLI tool for migrations and schema operations
- **Schema**: TypeScript definition of database structure
- **Query Builder**: Type-safe API for constructing SQL queries
- **Prepared Statement**: Compiled SQL query with parameters
- **Type Inference**: Automatic TypeScript type derivation
- **Relational Query**: Query that includes related table data
- **Migration**: Schema change script with up/down operations

**Diff Voyager Specific:**
- **Repository**: Data access layer class for a table/entity
- **Snapshot**: Captured state of a page at a point in time
- **Baseline**: First run of a project, used for comparisons
- **Diff**: Comparison result between baseline and run snapshots
- **Artifact**: Binary file (screenshot, HAR, etc.)

---

## Document Maintenance

**Version:** 1.0
**Created:** 2026-01-07
**Last Updated:** 2026-01-07
**Owner:** Development Team
**Status:** Draft - Awaiting Review

**Change Log:**
- 2026-01-07: Initial migration plan created

**Next Review:** After Phase 0 completion

**Related Documents:**
- `.claude/PRD.md` - Product Requirements Document
- `CLAUDE.md` - Development guide
- `00-overview.md` - API implementation overview
- `01-domain-types.md` - TypeScript type definitions
- `03-tdd-test-plan.md` - Testing strategy
