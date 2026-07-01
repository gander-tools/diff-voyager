# CLAUDE.md — TypeScript CLI and background worker for async web scraping

## Collaboration rules

- Communicate in **Polish**; code and docs in **English**
- **TDD**: interfaces and tests before implementation
- **Agent role**: consult and verify — review code correctness, present task plan; do not write implementation or tests unless explicitly asked
- **Never commit or approve** without explicit confirmation
- Commits: **Conventional Commits** in English; add `Closes #123` / `Fixes owner/repo#123` in body when resolving an issue
- **Before every commit**: `lint → typecheck → test` must all pass, in that order (enforced by `lefthook` pre-commit hook, see SPEC.md §C) — never commit code that fails any of the three
- Write only what was asked — no invented abstractions, no scope creep
- Add temporary directories (build output, caches, artifacts) to `.gitignore` immediately

See SPEC.md §I for architecture (process diagram, file table, job lifecycle) and commands.

## Testing

- SQLite: in-memory or temp file — never production DB
- Playwright: mocked in unit tests; real browser in integration only
- Cover atomic claim: two workers racing for the same job
