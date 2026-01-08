# Development Workflow

This guide describes the development workflow, testing practices, and contribution guidelines for Diff Voyager.

## Development Philosophy

Diff Voyager follows **Test-Driven Development (TDD)** with a focus on simplicity and maintainability.

### Core Principles

1. **Write tests first** - Red → Green → Refactor
2. **Keep it simple** - Avoid over-engineering
3. **Type safety** - Leverage TypeScript for compile-time checks
4. **Security by default** - Prevent common vulnerabilities
5. **Document as you go** - Update docs with code changes

## Test-Driven Development (TDD)

### TDD Cycle

```
┌─────────────┐
│   1. RED    │  Write a failing test
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  2. GREEN   │  Write minimal code to pass
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ 3. REFACTOR │  Clean up while maintaining green tests
└──────┬──────┘
       │
       └──────→ (repeat)
```

### Example TDD Flow

**1. Write the test first (RED)**:

```typescript
// tests/unit/domain/url-normalizer.test.ts
import { describe, it, expect } from 'vitest';
import { UrlNormalizer } from '../../../src/domain/url-normalizer.js';

describe('UrlNormalizer', () => {
  it('should remove trailing slash', () => {
    const result = UrlNormalizer.normalize('https://example.com/path/');
    expect(result).toBe('https://example.com/path');
  });
});
```

**2. Run tests (should fail)**:
```bash
npm test
# FAIL: UrlNormalizer is not defined
```

**3. Write minimal implementation (GREEN)**:

```typescript
// src/domain/url-normalizer.ts
export class UrlNormalizer {
  static normalize(url: string): string {
    return url.replace(/\/$/, '');
  }
}
```

**4. Run tests (should pass)**:
```bash
npm test
# PASS: ✓ should remove trailing slash
```

**5. Refactor (if needed)**:

```typescript
export class UrlNormalizer {
  static normalize(url: string): string {
    const urlObj = new URL(url);
    urlObj.pathname = urlObj.pathname.replace(/\/$/, '');
    return urlObj.toString();
  }
}
```

**6. Ensure tests still pass**:
```bash
npm test
# PASS: All tests passing
```

## Testing Strategy

### Test Structure

```
packages/backend/tests/
├── unit/                    # Pure logic tests (no I/O)
│   ├── domain/             # Comparators, normalizers
│   ├── storage/            # Repository tests (in-memory DB)
│   └── queue/              # Task queue tests
├── integration/            # Component integration
│   ├── api/                # API endpoint tests
│   └── services/           # Service orchestration
└── helpers/                # Test utilities
    ├── mock-server.ts      # HTTP mock server
    ├── test-db.ts          # In-memory SQLite
    └── factories.ts        # Test data factories
```

### Test Types

**Unit Tests** - Fast, isolated, no I/O:
```typescript
describe('SEOComparator', () => {
  it('should detect title change', () => {
    const baseline = { title: 'Old Title' };
    const comparison = { title: 'New Title' };
    const changes = SEOComparator.compare(baseline, comparison);
    expect(changes).toContain({ field: 'title', type: 'CHANGED' });
  });
});
```

**Integration Tests** - Real components, mock external services:
```typescript
describe('POST /api/v1/scans', () => {
  let app: FastifyInstance;
  let mockServer: MockServer;

  beforeAll(async () => {
    mockServer = new MockServer();
    await mockServer.start();
    app = await createApp();
  });

  it('should create scan', async () => {
    const response = await request(app)
      .post('/api/v1/scans')
      .send({ url: mockServer.url('/test') });
    expect(response.status).toBe(200);
  });
});
```

### Running Tests

```bash
# All tests
npm test

# Backend only
npm run test:backend

# Watch mode (auto-rerun)
cd packages/backend && npm run test:watch

# Coverage report
npm run test:coverage:backend

# Specific test file
npm test -- url-normalizer.test.ts
```

## Code Quality

### Linting and Formatting

Diff Voyager uses **Biome** for linting and formatting (replaces ESLint + Prettier).

```bash
# Check code style
npm run check

# Auto-fix issues
npm run check:fix

# Unsafe fixes (use with caution)
npm run check:fix:unsafe
```

**VSCode Setup**:

Install the Biome extension:
- Extension ID: `biomejs.biome`
- Enables auto-format on save

### Pre-commit Checklist

Before committing, ensure:

- [ ] All tests passing: `npm test`
- [ ] Code formatted: `npm run check:fix`
- [ ] No TypeScript errors: `npm run build`
- [ ] Security review (if touching file I/O, validation, or auth)

## Git Workflow

### Branching Strategy

- **main** - Production-ready code
- **feature/***  - New features (e.g., `feature/drizzle-migration`)
- **fix/** - Bug fixes (e.g., `fix/har-url-handling`)
- **docs/** - Documentation updates

### Commit Message Format

**REQUIRED**: Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Code style (formatting, missing semicolons)
- `refactor` - Code change that neither fixes a bug nor adds a feature
- `test` - Adding or updating tests
- `chore` - Maintenance (dependencies, build config)

**Examples**:

```bash
# Feature
git commit -m "feat(backend): add page snapshot comparison logic"

# Bug fix
git commit -m "fix(frontend): resolve visual diff rendering issue"

# Documentation
git commit -m "docs: update CLAUDE.md with commit guidelines"

# Multi-line with body
git commit -m "feat(api): add diff filtering endpoints

- Add GET /api/v1/diffs with query params
- Support filtering by type, severity, status
- Add integration tests for all filters

🤖 Generated with Claude Code"
```

### Creating Commits

1. **Stage changes**:
```bash
git add src/domain/page-comparator.ts
git add tests/unit/domain/page-comparator.test.ts
```

2. **Review staged changes**:
```bash
git diff --staged
```

3. **Commit with conventional format**:
```bash
git commit -m "feat(domain): add page comparator orchestration"
```

4. **Push to remote**:
```bash
git push origin feature/page-comparator
```

### Creating Pull Requests

**Before creating PR**:

1. Ensure all tests pass: `npm test`
2. Update documentation if needed
3. Rebase on latest main:
```bash
git fetch origin
git rebase origin/main
```

**PR Title**: Use conventional commit format
```
feat(api): add diff filtering endpoints
```

**PR Description Template**:
```markdown
## Summary
Brief description of changes (1-3 sentences)

## Changes
- Bullet list of specific changes
- New files created
- Modified behavior

## Test Plan
- [ ] Unit tests added for new logic
- [ ] Integration tests for API endpoints
- [ ] Manual testing performed

## Screenshots (if applicable)
[Add screenshots for UI changes]

🤖 Generated with Claude Code
```

**Create PR**:
```bash
# Using GitHub CLI
gh pr create --title "feat(api): add diff filtering endpoints" \
  --body-file pr-template.md

# Or via web interface
# Push branch and follow GitHub's "Create Pull Request" button
```

## Code Review Guidelines

### As a Reviewer

- **Focus on**: Logic, security, tests, documentation
- **Ignore**: Code style (handled by Biome)
- **Check**:
  - [ ] Tests cover new code
  - [ ] No security vulnerabilities
  - [ ] Documentation updated
  - [ ] Commit messages follow convention
  - [ ] No unnecessary complexity

### As an Author

- Keep PRs focused and small (< 500 lines ideal)
- Respond to feedback promptly
- Update PR based on comments
- Don't merge your own PRs (wait for review)

## Security Guidelines

### CRITICAL Security Requirements

Before committing code that:
- Accepts user input
- Performs file system operations
- Executes external commands
- Handles authentication/authorization

**Verify**:
- [ ] Rate limiting applied (if file system or expensive operation)
- [ ] Path traversal prevented (if file paths involved)
- [ ] Input validation present
- [ ] Error handling doesn't leak information
- [ ] Tests cover security scenarios
- [ ] Code properly formatted (`npm run format`)

### Common Vulnerabilities to AVOID

**NEVER**:
- Use `path.join(baseDir, req.params.userId)` without validation
- Execute file operations without rate limiting
- Pass user input to `exec()`, `spawn()`, or similar
- Trust user input for file names, paths, or commands
- Skip input validation "just for MVP"

**ALWAYS**:
- Validate paths stay within allowed directories
- Apply rate limiting to resource-intensive endpoints
- Sanitize and validate all user inputs
- Use parameterized queries (Drizzle ORM handles this)
- Test security features explicitly

See [CLAUDE.md Security Guidelines](../../CLAUDE.md#security-guidelines) for detailed examples.

## Release Process

### Versioning

Diff Voyager follows [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0): Breaking API changes
- **MINOR** (0.2.0): New features, backwards-compatible
- **PATCH** (0.1.1): Bug fixes, backwards-compatible

### Creating a Release

1. **Update version**:
```bash
cd packages/backend
npm version minor  # or major/patch
```

2. **Update CHANGELOG.md**:
```bash
# Add release notes under new version heading
## [0.2.0] - 2026-01-15
### Added
- Feature X
- Feature Y
```

3. **Commit and tag**:
```bash
git add .
git commit -m "chore: release v0.2.0"
git tag v0.2.0
git push origin main --tags
```

4. **GitHub Release**:
- Create release from tag on GitHub
- Copy CHANGELOG.md entry to release notes
- Attach build artifacts (if applicable)

## Development Best Practices

### Keep Changes Focused

**Good**:
- One feature per PR
- Related tests in same commit
- Documentation updates included

**Bad**:
- Multiple unrelated features in one PR
- Tests in separate PR
- Missing documentation

### Avoid Over-Engineering

**Good**:
```typescript
// Simple, direct implementation
export function calculateDiff(a: number, b: number): number {
  return Math.abs(a - b);
}
```

**Bad**:
```typescript
// Over-engineered for simple task
export class DiffCalculator {
  constructor(private strategy: DiffStrategy) {}

  calculate(a: number, b: number): number {
    return this.strategy.execute(a, b);
  }
}
```

### Write Self-Documenting Code

**Good**:
```typescript
const isBaselineRun = run.isBaseline;
const hasCriticalDiffs = diffs.some(d => d.severity === 'CRITICAL');
```

**Bad**:
```typescript
const x = r.iB;  // Unclear variable names
const y = d.filter(i => i.s === 'C').length > 0;  // Magic values
```

## Debugging

### Backend Debugging

**Enable debug logging**:
```bash
LOG_LEVEL=debug npm run dev:backend
```

**VSCode debugger**:

Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev:backend"],
      "console": "integratedTerminal",
      "cwd": "${workspaceFolder}/packages/backend"
    }
  ]
}
```

### Database Debugging

**View query logs** (add to code temporarily):
```typescript
const result = await db.select().from(projects);
console.log('Query result:', result);
```

**Inspect database**:
```bash
sqlite3 ./data/diff-voyager.db
.schema projects
SELECT * FROM projects LIMIT 5;
```

## See Also

- [Getting Started](getting-started.md) - Installation and first scan
- [Testing Strategy](testing-strategy.md) - Detailed testing approach
- [Architecture](../architecture/overview.md) - System design
