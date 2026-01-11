# Development Roadmap

**Last Updated**: 2026-01-08

## Current Focus

**Phase 6**: Integration workflows and diff generation during comparison runs

## Short-term Goals (MVP Completion)

### 1. Fix Skipped Tests (Priority: High)

**Target**: Week 1-2

**Milestone**: [#1 - Documentation TODO Cleanup](https://github.com/gander-tools/diff-voyager/milestone/1)

See GitHub Issues for detailed tracking (all **Bug** type):
- [ ] 🔴 Fix `includePages` parameter coercion → [#156](https://github.com/gander-tools/diff-voyager/issues/156)
- [ ] 🔴 Investigate page details endpoint response structure → [#148](https://github.com/gander-tools/diff-voyager/issues/148) (parent)
  - [ ] 🔴 Include SEO data → [#151](https://github.com/gander-tools/diff-voyager/issues/151)
  - [ ] 🔴 Include HTTP headers → [#152](https://github.com/gander-tools/diff-voyager/issues/152)
  - [ ] 🔴 Include performance metrics → [#153](https://github.com/gander-tools/diff-voyager/issues/153)
- [ ] 🔴 Fix HAR file URL handling → [#157](https://github.com/gander-tools/diff-voyager/issues/157)

**Acceptance Criteria**: See individual issues for detailed criteria.

### 2. Complete Phase 6: Integration Workflows (Priority: High)

**Target**: Weeks 3-4

**Milestone**: [#2 - Phase 6: Integration Workflows](https://github.com/gander-tools/diff-voyager/milestone/2)

See GitHub Issues for detailed tracking:
- [ ] 🔵 Implement automatic diff generation → [#149](https://github.com/gander-tools/diff-voyager/issues/149) (Feature, parent)
  - [ ] 🟡 Create integration tests for diff workflow → [#154](https://github.com/gander-tools/diff-voyager/issues/154) (Task)
- [ ] 🟡 End-to-end testing of Crawlee integration → [#158](https://github.com/gander-tools/diff-voyager/issues/158) (Task)
- [ ] 🟡 Performance optimization for crawls → [#159](https://github.com/gander-tools/diff-voyager/issues/159) (Task)

**Acceptance Criteria**: See individual issues for detailed criteria.

### 3. Complete Phase 7: Production Polish (Priority: Medium)

**Target**: Weeks 5-6

**Milestone**: [#3 - Phase 7: Production Polish](https://github.com/gander-tools/diff-voyager/milestone/3)

See GitHub Issues for detailed tracking (all **Task** type):
- [ ] 🟡 Add database indexes for query optimization → [#160](https://github.com/gander-tools/diff-voyager/issues/160)
- [ ] 🟡 Analyze and optimize slow queries → [#161](https://github.com/gander-tools/diff-voyager/issues/161)
- [ ] 🟡 Complete error scenario tests → [#162](https://github.com/gander-tools/diff-voyager/issues/162)
- [ ] 🟡 Improve error messages for better UX → [#163](https://github.com/gander-tools/diff-voyager/issues/163)
- [ ] 🟡 Performance benchmarking and baselines → [#164](https://github.com/gander-tools/diff-voyager/issues/164)

**Acceptance Criteria**: See individual issues for detailed criteria.

### 4. MVP Feature Completion (Priority: Medium)

**Target**: Weeks 7-8

**Milestone**: [#4 - Backend MVP Complete](https://github.com/gander-tools/diff-voyager/milestone/4)

See GitHub Issues for detailed tracking (all **Feature** type):
- [ ] 🔵 Implement project export functionality → [#150](https://github.com/gander-tools/diff-voyager/issues/150) (parent)
  - [ ] 🔵 Add export API endpoint → [#155](https://github.com/gander-tools/diff-voyager/issues/155)
- [ ] 🔵 Implement diff filtering → [#165](https://github.com/gander-tools/diff-voyager/issues/165)
- [ ] 🔵 Add search functionality for diffs and pages → [#166](https://github.com/gander-tools/diff-voyager/issues/166)

**Acceptance Criteria**: See individual issues for detailed criteria.

**GitHub Milestones**:
- [Milestone #1: Documentation TODO Cleanup](https://github.com/gander-tools/diff-voyager/milestone/1) - Fix skipped tests
- [Milestone #2: Phase 6: Integration Workflows](https://github.com/gander-tools/diff-voyager/milestone/2) - Integration workflows (due Jan 24, 2026)
- [Milestone #3: Phase 7: Production Polish](https://github.com/gander-tools/diff-voyager/milestone/3) - Production readiness (due Feb 7, 2026)
- [Milestone #4: Backend MVP Complete](https://github.com/gander-tools/diff-voyager/milestone/4) - Backend MVP features (due Feb 21, 2026)
- [Milestone #5: Frontend Phase 3: Run Management](https://github.com/gander-tools/diff-voyager/milestone/5) - Run management UI (due Mar 31, 2026)
- [Milestone #6: Frontend Phase 4: Diff Review](https://github.com/gander-tools/diff-voyager/milestone/6) - Diff review UI (due Apr 30, 2026)
- [Milestone #7: Frontend MVP Complete](https://github.com/gander-tools/diff-voyager/milestone/7) - Frontend MVP (due May 31, 2026)
- [Milestone #8: v1.0 Public Release](https://github.com/gander-tools/diff-voyager/milestone/8) - Public release (due Jun 30, 2026)

## Medium-term Goals (Frontend MVP)

### 5. Frontend UI Development (Priority: High)

**Target**: Weeks 9-16 (2 months)

**Milestones**:
- [#5 - Frontend Phase 3: Run Management](https://github.com/gander-tools/diff-voyager/milestone/5) - Due Mar 31, 2026
- [#6 - Frontend Phase 4: Diff Review](https://github.com/gander-tools/diff-voyager/milestone/6) - Due Apr 30, 2026
- [#7 - Frontend MVP Complete](https://github.com/gander-tools/diff-voyager/milestone/7) - Due May 31, 2026

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
