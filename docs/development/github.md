# GitHub Repository Metadata

**Last Updated**: 2026-01-14

This document provides a reference guide for repository labels, milestones, and issue conventions. Use this when creating issues or pull requests to ensure proper categorization and avoid using non-existent labels.

## Table of Contents

1. [Labels](#labels)
2. [Milestones](#milestones)
3. [Issue Types](#issue-types)
4. [Usage Guidelines](#usage-guidelines)
5. [Examples](#examples)

---

## Labels

### Issue Type Labels

- `bug` - Something isn't working (#d73a4a - red)
- `enhancement` - New feature or request (#a2eeef - light blue)
- `question` - Further information is requested (#d876e3 - purple)
- `duplicate` - This issue or pull request already exists (#cfd3d7 - gray)
- `invalid` - This doesn't seem right (#e4e669 - yellow)
- `wontfix` - This will not be worked on (#ffffff - white)
- `good first issue` - Good for newcomers (#7057ff - purple)
- `help wanted` - Extra attention is needed (#008672 - green)

### Scope Labels

- `backend` - Backend-related code (Node.js, API, database, repositories) (#68A063 - green)
- `frontend` - Frontend-related code (Vue.js, TypeScript, UI components) (#42B883 - green)
- `shared` - Shared code between frontend and backend (types, contracts) (#3178C6 - blue)
- `tests` - Test-related changes (unit, integration, e2e tests) (#0E8A16 - dark green)
- `core` - Core functionality affecting multiple components (#764ABC - purple)

### Priority Labels

**Note**: Priority labels have a **space** after the colon!

- `priority: high` - High priority (#FF0000 - red)
- `priority: medium` - Medium priority (#FFA500 - orange)
- `priority: low` - Low priority (#00FF00 - green)

### Size Labels

- `size/small` - Small effort: 1-2 hours of work (#90EE90 - light green)
- `size/medium` - Medium effort: 2-4 hours of work (#FFD700 - gold)
- `size/large` - Large effort: 4-8 hours of work (#FF6347 - tomato)
- `size/xlarge` - Extra large effort: 8+ hours of work (#FF4500 - orange-red)

### Special Purpose Labels

- `documentation` - Improvements or additions to documentation (#0075ca - blue)
- `claude code` - Work done with Claude Code CLI tool (#9B4DCA - purple)
- `dependencies` - Changes to project dependencies (npm packages) (#0366D6 - blue)
- `github-actions` - GitHub Actions CI/CD workflows and automation (#2088FF - blue)
- `renovate` - Automated dependency updates from Renovate bot (#1A7F37 - green)
- `configuration` - Project configuration files and settings (#C5DEF5 - light blue)
- `tech-debt` - Technical debt (#FBCA04 - yellow)
- `refactor` - Code refactoring without behavior change (#FEF2C0 - beige)
- `performance` - Performance-related improvements and optimizations (#FBCA04 - yellow)
- `needs-triage` - Issue needs review and categorization (#D93F0B - orange)

### Release Labels

- `release` - Release-related changes and version bumps (#B60205 - red)
- `autorelease: pending` - Release is pending (commit created, waiting for tag) (#FFF4CC - light yellow)
- `autorelease: tagged` - Release has been tagged and published (#C5DEF5 - light blue)

### Other Labels

- `from-docs` - Generated from documentation (#FEF2C0 - beige)

---

## Milestones

### Active Milestones

**Milestone #1: Documentation TODO Cleanup**
- **Due**: 2026-02-28
- **State**: Open
- **Description**: Issues extracted from documentation TODOs (skipped-tests.md, roadmap.md)
- **Focus**: Fix skipped tests and resolve documentation TODOs

**Milestone #2: Phase 6: Integration Workflows**
- **Due**: 2026-01-24
- **State**: Open
- **Description**: Complete backend integration workflows: automatic diff generation, multi-page crawl testing, performance optimization. Target: Weeks 3-4 (Jan 24, 2026)
- **Focus**: Backend integration and workflow automation

**Milestone #3: Phase 7: Production Polish**
- **Due**: 2026-02-07
- **State**: Open
- **Description**: Production readiness: database optimization, error handling, performance benchmarking, improved UX. Target: Weeks 5-6 (Feb 7, 2026)
- **Focus**: Production-ready polish and optimization

**Milestone #4: Backend MVP Complete**
- **Due**: 2026-02-21
- **State**: Open
- **Description**: Complete backend MVP: all skipped tests fixed, Phase 6 & 7 complete, export and search features implemented. Target: Weeks 7-8 (Feb 21, 2026)
- **Focus**: Backend MVP completion

**Milestone #5: Frontend Phase 3: Run Management**
- **Due**: 2026-03-31
- **State**: Open
- **Description**: Run management UI: RunList, RunCreate, RunDetail views with full CRUD operations. Depends on: Backend MVP complete. Target: Month 3 (Mar 2026)
- **Focus**: Run management interface

**Milestone #6: Frontend Phase 4: Diff Review**
- **Due**: 2026-04-30
- **State**: Open
- **Description**: Diff review interface: visual diff viewer, SEO/header/performance comparison, acceptance workflow, mute rules UI. Target: Month 3-4 (Apr 2026)
- **Focus**: Diff review and comparison UI

**Milestone #7: Frontend MVP Complete**
- **Due**: 2026-05-31
- **State**: Open
- **Description**: Complete frontend MVP: all UI phases complete (Project, Run, Diff Review, Rules & Settings), E2E tests, responsive design, accessibility. Target: Month 4-5 (May 2026)
- **Focus**: Frontend MVP completion

**Milestone #8: v1.0 Public Release**
- **Due**: 2026-06-30
- **State**: Open
- **Description**: First public release: Backend + Frontend MVP complete, beta testing done, documentation complete, production ready. Target: Month 6 (Jun 2026)
- **Focus**: Public release preparation

**Milestone #9: Frontend Phase 5: Rules and Settings**
- **Due**: 2026-03-30
- **State**: Open
- **Description**: Implement Rules and Settings views for managing diff ignore/mute rules and application configuration. Includes RuleForm, RuleCard, RuleConditionBuilder components, RulesListView, RuleCreateView, SettingsView, integration, and E2E tests.
- **Focus**: Rules and settings management

**Milestone #10: Frontend Phase 6: Polish and Accessibility**
- **Due**: 2026-04-29
- **State**: Open
- **Description**: Polish, accessibility, performance, error handling, and E2E testing to complete frontend MVP. Includes accessibility improvements, performance optimizations, error boundaries, loading states, comprehensive E2E tests, and integration.
- **Focus**: Frontend polish and accessibility

---

## Issue Types

The project uses GitHub Issue Types to categorize work:

- **Bug** (🔴 red) - Unexpected problems, test failures, regressions
  - Use label: `bug`
  - Title format: `fix(<scope>): <description>`

- **Feature** (🔵 blue) - New functionality, enhancements, user-facing improvements
  - Use label: `enhancement`
  - Title format: `feat(<scope>): <description>`

- **Task** (🟡 yellow) - Implementation work, refactoring, technical tasks
  - Use labels: `refactor`, `tech-debt`, `configuration`, etc.
  - Title format: `refactor(<scope>):`, `chore(<scope>):`, etc.

---

## Usage Guidelines

### Creating Issues

**Label Selection**:
1. **Always set ONE issue type label**: `bug`, `enhancement`, or task-related label
2. **Add ONE scope label**: `backend`, `frontend`, `shared`, `tests`, `core`
3. **Add ONE priority label** (if applicable): `priority: high`, `priority: medium`, `priority: low`
4. **Add ONE size label** to estimate effort: `size/small`, `size/medium`, `size/large`, `size/xlarge`
5. **Add special purpose labels** as needed: `documentation`, `claude code`, `performance`, `github-actions`, etc.

**Milestone Assignment**:
- Choose the appropriate phase milestone based on when the work should be completed
- **Backend work** → Milestones #1-4
- **Frontend work** → Milestones #5-7, #9-10
- **Final release** → Milestone #8

**Title Format**:
Use Conventional Commits format: `<type>(<scope>): <description>`

**Types**:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Test additions or modifications
- `chore` - Maintenance tasks

**Scopes**:
- `backend` - Backend changes
- `frontend` - Frontend changes
- `shared` - Shared code
- `ci` - CI/CD changes
- `docs` - Documentation

**Examples**:
- `feat(backend): add page snapshot comparison logic`
- `fix(frontend): resolve visual diff rendering issue`
- `docs: update CLAUDE.md with commit guidelines`
- `test(backend): add integration tests for crawler`

### Creating Pull Requests

**Label Selection**:
- Same as issues (type, scope, priority, size, special purpose)
- Labels are usually inherited from the linked issue

**Title Format**:
- Same as Conventional Commits format
- Should match the issue title when implementing a single issue

**Milestone Assignment**:
- Inherit from the linked issue
- Or assign based on the target release

---

## Examples

### Bug Report Example

**Title**: `fix(backend): includePages query parameter coercion fails`

**Labels**:
- `bug` (type)
- `backend` (scope)
- `priority: high` (priority)
- `size/small` (size)

**Milestone**: #1 - Documentation TODO Cleanup

**Description**:
```markdown
## Problem
The `includePages` query parameter is not being coerced to boolean correctly, causing the endpoint to fail.

## Steps to Reproduce
1. Call GET /api/v1/projects/:id?includePages=true
2. Observe 400 error

## Expected Behavior
Should return project with pages included

## Actual Behavior
Returns 400 Bad Request
```

---

### Feature Request Example

**Title**: `feat(frontend): add visual diff comparison viewer`

**Labels**:
- `enhancement` (type)
- `frontend` (scope)
- `priority: medium` (priority)
- `size/large` (size)

**Milestone**: #6 - Frontend Phase 4: Diff Review

**Description**:
```markdown
## Feature Description
Add a visual diff viewer component that shows side-by-side screenshot comparison with highlighted differences.

## Requirements
- Side-by-side screenshot display
- Zoom and pan controls
- Difference highlighting
- Accept/Reject actions

## Acceptance Criteria
- [ ] Component displays baseline and comparison screenshots
- [ ] Visual differences are highlighted
- [ ] User can accept or reject differences
- [ ] Component has unit tests
```

---

### Documentation Example

**Title**: `docs: add GitHub metadata documentation for LLM`

**Labels**:
- `documentation` (type)
- `enhancement` (also applicable for improvements)
- `claude code` (special purpose)
- `size/small` (size)

**Milestone**: #3 - Phase 7: Production Polish

**Description**:
```markdown
## Goal
Create comprehensive documentation of repository metadata (labels, milestones, issue types) to help LLMs create issues and PRs correctly.

## Content
- All available labels with descriptions
- All milestones with due dates
- Issue type conventions
- Usage guidelines and examples

## Acceptance Criteria
- [ ] docs/development/github.md created
- [ ] All labels documented
- [ ] All milestones documented
- [ ] Usage guidelines provided
- [ ] CLAUDE.md updated with link
```

---

## Common Mistakes to Avoid

### Label Mistakes

❌ **Wrong**: Using `priority:medium` (no space after colon)
✅ **Correct**: Using `priority: medium` (space after colon)

❌ **Wrong**: Using `ci` label (doesn't exist)
✅ **Correct**: Using `github-actions` for CI/CD related issues

❌ **Wrong**: Using multiple type labels (`bug` + `enhancement`)
✅ **Correct**: Choosing one type label based on primary purpose

❌ **Wrong**: Not setting any scope label
✅ **Correct**: Always set a scope: `backend`, `frontend`, `shared`, etc.

### Milestone Mistakes

❌ **Wrong**: Assigning backend work to Milestone #5 (Frontend Phase)
✅ **Correct**: Assigning backend work to Milestones #1-4

❌ **Wrong**: Not assigning any milestone
✅ **Correct**: Always assign to appropriate milestone

### Title Format Mistakes

❌ **Wrong**: `Add visual diff viewer`
✅ **Correct**: `feat(frontend): add visual diff viewer`

❌ **Wrong**: `fix: bug in backend`
✅ **Correct**: `fix(backend): resolve includePages parameter coercion`

---

## See Also

- [Roadmap](roadmap.md) - Current status, completed work, and planned features
- [Issue Management Guide](../guides/issue-management.md) - Issue hierarchy and dependency tracking
- [CLAUDE.md](../../CLAUDE.md) - Development guide and workflow
- [GitHub Milestones](https://github.com/gander-tools/diff-voyager/milestones) - Live milestone tracking
- [GitHub Issues](https://github.com/gander-tools/diff-voyager/issues) - Issue tracker
