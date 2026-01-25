# Diff Voyager

Local website version comparison tool for verifying visual, content, SEO, and performance during framework upgrades.

## Structure

```
packages/backend/    # Node.js + TypeScript API
packages/frontend/   # Vue 3 + TypeScript UI
packages/shared/     # Shared types
```

## Essential Commands

```bash
npm run setup              # Full setup
npm run dev:backend        # API server :3000
npm run dev:frontend       # Frontend dev
npm test --workspace=backend
npm test --workspace=frontend
```

## Rules

**Commits:** Conventional Commits format: `<type>(<scope>): <description>`
- Types: feat, fix, docs, style, refactor, test, chore

**TODOs:** Create GitHub Issues, link in docs. No inline `// TODO:` without issue reference.

**Security:** Rate limiting, path traversal prevention, input validation required. See @docs/guides/security.md

**TDD:** Write tests first. See @docs/guides/testing-strategy.md

## Documentation

### Architecture
- @docs/architecture/overview.md
- @docs/architecture/domain-model.md
- @docs/architecture/technology-stack.md

### Guides
- @docs/guides/getting-started.md - setup, install
- @docs/guides/development-workflow.md - TDD flow
- @docs/guides/backend-dev.md - backend patterns, tests
- @docs/guides/frontend-dev.md - Vue components, forms
- @docs/guides/ts-rest.md - API endpoints
- @docs/guides/drizzle-orm.md - database queries
- @docs/guides/security.md - CRITICAL for file/API/auth work
- @docs/guides/i18n.md - translations
- @docs/guides/running-servers.md - server options
- @docs/guides/testing-strategy.md - test approach
- @docs/guides/issue-management.md - GitHub issues
- @docs/guides/common-regressions.md - avoid breaking changes

### API
- @docs/api/endpoints.md
- @docs/api/types.md

### Development Status
- @docs/development/status.md - current state
- @docs/development/goals.md - roadmap
- @docs/development/github.md - labels, milestones
- @docs/development/tests.md - test structure (read-only)
- @docs/development/tests-to-fix.md - test audit (read-only)
- @docs/development/tests/backend-unit.md
- @docs/development/tests/backend-integration.md
- @docs/development/tests/frontend.md
- @docs/development/tests/shared.md

### Other
- @docs/README.md - full index
- @docs/screenshots/README.md
- @.claude/PRD.md - product requirements

## Key Files

- Contract: `packages/shared/src/api-contract.ts`
- Backend routes: `packages/backend/src/api/routes-ts-rest.ts`
- Frontend client: `packages/frontend/src/services/api/client.ts`
- DB schemas: `packages/backend/src/drizzle/schema/`
- Repositories: `packages/backend/src/repositories/`
