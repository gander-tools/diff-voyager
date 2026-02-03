# Contributing to Diff Voyager

## Language Policy

**ENGLISH ONLY** - All contributions must use English:

- ✅ Code comments in English
- ✅ Commit messages in English
- ✅ Documentation in English
- ✅ Issue discussions in English
- ✅ Pull request descriptions in English
- ✅ Variable/function names in English

**Why?** English is the international standard for open-source collaboration, ensuring accessibility for developers worldwide.

## Code Style

- **Formatting**: Use Biome - `bun run format`
- **Linting**: Fix all Biome warnings
- **Type checking**: Ensure TypeScript passes - `bun run typecheck`

## Testing Requirements

- **TDD Required**: Write tests BEFORE implementation
- **Coverage**: Maintain >85% test coverage
- **Test Methodology**: Primarily Chicago School (real collaborators), London School only when setup is complex
- **All tests must pass**: `bun test`

## Commit Guidelines

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(module): add new feature
fix(module): fix bug
docs: update documentation
chore: update dependencies
test: add tests
refactor: refactor code
```

## Pull Request Process

1. Create feature branch: `feature/your-feature-name`
2. Write tests first (TDD)
3. Implement feature
4. Format code: `bun run format`
5. Run tests: `bun test`
6. Commit with conventional commits
7. Push and create PR
8. Ensure CI passes

## Development Workflow

See [README.md](README.md) for:
- Development setup
- Running tests
- Building the project
- Architecture overview

## Questions?

Open an issue or start a discussion on GitHub.
