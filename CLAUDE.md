# CLAUDE.md — TypeScript CLI and background worker for async web scraping

## Collaboration rules

- Communicate in **Polish**; code and docs in **English**
- **TDD**: interfaces and tests before implementation
- **Agent role**: consult and verify — review code correctness, present task plan; do not write implementation or tests unless explicitly asked
- **Never commit or approve** without explicit confirmation
- Commits: **Conventional Commits** in English; add `Closes #123` / `Fixes owner/repo#123` in body when resolving an issue
- Write only what was asked — no invented abstractions, no scope creep
- Planning docs: `BUGS.md` and `TODOS.md` only — **no other project documents, ever**
- Add temporary directories (build output, caches, artifacts) to `.gitignore` immediately

## Commands

```bash
npm run dev:cli -- <command>   # run CLI via tsx
npm run dev:worker             # run worker via tsx
npm run build                  # tsc
npm run test                   # vitest
npm run test -- <file>         # single file
npm run test -- --watch        # watch mode
npm run lint                   # biome check --write
npm run typecheck              # tsc --noEmit
```

## Architecture

```
CLI (src/cli.ts)         Worker (src/worker.ts)
      │                         │
      └────── SQLite DB ─────────┘
               (src/db.ts)
```

Processes communicate only through the DB. WAL + `busy_timeout=5000` prevents `SQLITE_BUSY` under concurrent access.

Job lifecycle: `pending` → `processing` → `done | failed`

Worker atomically claims jobs via `UPDATE … RETURNING` — safe for future multi-worker setups.

| File             | Responsibility                                               |
|------------------|--------------------------------------------------------------|
| `src/config.ts`  | DB path and env-driven constants                             |
| `src/db.ts`      | Connection factory, schema migration, typed query helpers    |
| `src/cli.ts`     | `commander` CLI; URL validated with `zod`                    |
| `src/worker.ts`  | Poll loop (500 ms idle sleep), atomic claim, scrape, persist |
| `src/scraper.ts` | Playwright logic; returns typed result serialised to JSON    |

## Testing

- SQLite: in-memory or temp file — never production DB
- Playwright: mocked in unit tests; real browser in integration only
- Cover atomic claim: two workers racing for the same job
