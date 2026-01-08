# Development Roadmap

**Last Updated**: 2026-01-08

## Current Focus

**Phase 6**: Integration workflows and diff generation during comparison runs

## Short-term Goals (MVP Completion)

### 1. Fix Skipped Tests (Priority: High)

**Target**: Week 1-2

- [ ] Fix snapshot data retrieval in page details endpoint
  - Investigate SnapshotRepository query
  - Fix response serialization
  - Enable 3 skipped tests in `page-details-endpoint.test.ts`

- [ ] Fix HAR file URL handling
  - Verify artifact path construction
  - Fix harUrl serialization
  - Enable skipped test in `scan-processor.test.ts`

**Acceptance Criteria**:
- All currently skipped tests passing
- No regression in existing tests

### 2. Complete Phase 6: Integration Workflows (Priority: High)

**Target**: Weeks 3-4

#### 2.1 Diff Generation Workflow

- [ ] Implement automatic diff generation during comparison runs
  - Trigger PageComparator when comparison snapshot created
  - Store diff results in DiffRepository
  - Update run statistics with diff counts

- [ ] Create integration tests for diff workflow
  - Baseline run → comparison run → automatic diff
  - Verify SEO changes detected
  - Verify visual changes detected
  - Verify header/performance changes detected

#### 2.2 Multi-page Crawl Workflow

- [ ] End-to-end testing of Crawlee integration
  - Create test site with multiple linked pages
  - Verify URL discovery
  - Verify concurrent processing
  - Verify progress tracking

- [ ] Performance optimization
  - Tune concurrency settings
  - Add crawl progress callbacks
  - Implement crawl cancellation

**Acceptance Criteria**:
- Diffs automatically generated for all comparison runs
- Multi-page crawls complete successfully
- Integration tests passing

### 3. Complete Phase 7: Production Polish (Priority: Medium)

**Target**: Weeks 5-6

#### 3.1 Database Optimization

- [ ] Add database indexes
  - Index on projects.base_url
  - Index on pages.normalized_url
  - Index on runs.project_id + is_baseline
  - Index on snapshots.page_id + run_id

- [ ] Query optimization
  - Analyze slow queries with EXPLAIN
  - Optimize N+1 queries
  - Add query result caching where appropriate

#### 3.2 Error Handling

- [ ] Complete error scenario tests
  - Network timeout scenarios
  - Invalid URL handling
  - Disk space exhaustion
  - Browser crashes

- [ ] Improve error messages
  - User-friendly error descriptions
  - Actionable error guidance
  - Detailed logging for debugging

#### 3.3 Performance Benchmarking

- [ ] Establish performance baselines
  - Single page scan: < 5 seconds
  - 10-page crawl: < 30 seconds
  - 100-page crawl: < 5 minutes
  - API endpoints: < 100ms

- [ ] Load testing
  - Concurrent API requests
  - Large project handling (500+ pages)
  - Long-running crawls

**Acceptance Criteria**:
- All error scenarios handled gracefully
- Performance meets baseline targets
- Database queries optimized

### 4. MVP Feature Completion (Priority: Medium)

**Target**: Weeks 7-8

#### 4.1 Export Functionality

- [ ] Implement project export
  - JSON manifest generation
  - Artifact bundling
  - Zip archive creation

- [ ] Add export API endpoint
  - GET /api/v1/projects/:id/export
  - Streaming response for large exports
  - Configurable export options

#### 4.2 Diff Filtering and Search

- [ ] Implement diff filtering
  - Filter by change type (SEO, visual, header, performance)
  - Filter by severity (critical, warning, info)
  - Filter by status (new, accepted, muted)

- [ ] Add search functionality
  - Search by page URL
  - Search by diff content
  - Full-text search in HTML

**Acceptance Criteria**:
- Export generates valid archive with all artifacts
- Diff filtering and search working via API

## Medium-term Goals (Frontend MVP)

### 5. Frontend UI Development (Priority: High)

**Target**: Weeks 9-16 (2 months)

#### 5.1 Project Setup

- [ ] Vue 3 + Vite project scaffolding
- [ ] Pinia store setup
- [ ] Vue Router configuration
- [ ] API client service
- [ ] Component library selection

#### 5.2 Core Views

- [ ] Project List View
  - List all projects
  - Create new project
  - Delete project
  - Search and filter

- [ ] Project Detail View
  - Project configuration
  - Runs list with status
  - Statistics dashboard
  - Start new comparison run

- [ ] Run Detail View
  - Run metadata and status
  - Pages list with diff indicators
  - Filter by change type
  - Export run results

- [ ] Page Diff View
  - Side-by-side comparison
  - Visual diff viewer (screenshot overlay)
  - SEO changes table
  - Header changes table
  - Performance metrics chart

- [ ] Settings View
  - Project configuration editor
  - Mute rules management
  - Global settings

#### 5.3 Diff Management Features

- [ ] Diff acceptance workflow
  - Accept individual changes
  - Accept all changes for page
  - Undo acceptance

- [ ] Mute rules creation
  - Create rule from specific diff
  - CSS selector picker
  - XPath generator
  - Preview affected diffs

#### 5.4 UI Polish

- [ ] Responsive design
- [ ] Dark mode support
- [ ] Loading states and skeletons
- [ ] Error handling and notifications
- [ ] Keyboard shortcuts

**Acceptance Criteria**:
- All core views functional
- Diff review workflow complete
- Responsive and accessible UI

See [Frontend Implementation Plan](../features/frontend-plan.md) for detailed specs.

## Long-term Goals (Post-MVP)

### 6. CI/CD Integration (Priority: Low)

**Target**: Months 5-6

- [ ] GitHub Actions workflow
  - Trigger scan on PR
  - Comment diff summary on PR
  - Fail PR if critical diffs detected

- [ ] GitLab CI integration
- [ ] Jenkins plugin (if demand exists)

**Benefits**:
- Automated regression detection
- Prevent SEO regressions in production
- Continuous visual testing

### 7. Advanced Features (Priority: Low)

**Target**: Months 6-12

#### 7.1 SEO Tool Integration

- [ ] Lighthouse integration
  - SEO score tracking
  - Performance score tracking
  - Accessibility score tracking

- [ ] Screaming Frog integration
  - Crawl comparison
  - Broken link detection

#### 7.2 Advanced Visual Diff

- [ ] Structural comparison (DOM diff)
- [ ] Perceptual diff (beyond pixel matching)
- [ ] Layout shift detection
- [ ] Animation and transition handling

#### 7.3 Performance Profiling

- [ ] Waterfall chart visualization
- [ ] Resource timing analysis
- [ ] Core Web Vitals tracking
- [ ] Historical trend charts

#### 7.4 Notifications

- [ ] Email notifications
  - Run completion
  - Critical diffs detected
  - Daily/weekly summaries

- [ ] Slack integration
- [ ] Webhook support

### 8. Scale & Multi-user (Priority: Low)

**Target**: Months 12+

- [ ] User authentication
- [ ] Project sharing and permissions
- [ ] Team collaboration features
- [ ] PostgreSQL migration (for larger datasets)
- [ ] Distributed queue (BullMQ + Redis)
- [ ] Horizontal scaling

**Out of Scope for Solo Developer Tool**:
- Multi-tenant SaaS
- Online dashboard
- Paid plans

## Feature Requests

Community feature requests are tracked in GitHub Issues with the `enhancement` label.

### Top Requested Features

1. **Docker deployment** - Simplified installation (#15)
2. **Playwright test integration** - Use Diff Voyager in existing test suites (#23)
3. **Scheduled scans** - Periodic comparison runs (#31)
4. **API webhooks** - Trigger external actions on events (#42)
5. **Custom comparators** - Plugin system for domain-specific comparisons (#57)

## Non-Goals

The following are explicitly **not planned**:

- Multi-tenant SaaS platform
- User accounts and billing
- Cloud storage integration
- Mobile app
- Browser extension
- Advanced authentication (OAuth, SAML)
- Real-time collaboration
- AI-powered diff analysis

## Success Metrics

### MVP Success Criteria

- [ ] Complete framework migration without SEO regressions
- [ ] Identify critical regressions in 1-2 comparison runs
- [ ] Review all diffs in single focus session (< 1 hour)
- [ ] Stable operation on 100-500 page websites

### Post-MVP Success Criteria

- [ ] GitHub stars: 100+
- [ ] Weekly active projects: 50+
- [ ] Average crawl size: 200+ pages
- [ ] Community contributions: 10+ PRs
- [ ] Documentation completeness: 90%+

## Timeline Overview

```
Month 1-2:  Complete Phase 6 & 7 (Backend MVP)
Month 3-4:  Frontend MVP Development
Month 5:    Beta Testing & Bug Fixes
Month 6:    Public Release (v1.0)
Month 6-12: Advanced Features & Integrations
Month 12+:  Scale & Multi-user (if demand exists)
```

## See Also

- [Implementation Status](implementation-status.md) - Current progress
- [Changelog](changelog.md) - Completed milestones
- [Frontend Plan](../features/frontend-plan.md) - Detailed UI specs
