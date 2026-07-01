# SPEC

## §G GOAL

PoC versioned web scraper. CLI stages URLs → `run start` creates version and launches worker → worker scrapes all URLs, saves artifacts per version. Goal: capture full page data, verify correctness, enable future diff.

## §C CONSTRAINTS

- one project, one global config; path via env / `config.ts`
- SQLite WAL + `busy_timeout=5000` + `foreign_keys=ON`; tables: `urls`, `runs`, `url_runs`
- `urls` & `runs` persist forever; `url_runs` cleared after run completes
- all scraped meta (links, js_errors) → disk as `meta.json`; ⊥ in SQLite columns
- disk artifacts per scrape: `page.html` (rendered, `page.content()`), `page.source.html` (raw response body), `screenshot.{png|jpeg}`, `archive.har` (HAR w/ `content:'embed'`), `meta.json`; ⊥ `resources/` dir (HAR zawiera zasoby)
- snapshot path: `<SNAPSHOT_DIR>/version-<N>/<slug>/`
- slug = `slugify(path)` + `-` + `sha256(url)[:8]`; deterministic, always derivable from url + run.version; url UNIQUE in `urls`
- `add`/`load` → insert into `urls` (UNIQUE url; skip duplicate)
- `load <file>` format: one URL per line; empty lines & `#`-prefixed lines ignored
- worker spawned via `tsx <path-relative-to-import.meta.url>/worker.ts` (PoC dev-only); `detached: true` + `unref()` — CLI exits immediately, worker runs in background
- `screenshot.exclude` → Playwright `mask` option (colored overlay)
- browser: chromium only (PoC); firefox/webkit ⊥; `browser` singleton per run, new `context`+`page` per URL (HAR isolation); headless configurable via config.json `headless` (default: true)
- `run start` → create run, insert `url_runs` for all `urls`, spawn worker
- worker: one-shot; polls pending `url_runs`; on finish → DELETE url_runs, mark run `done` (if still open), close browser, exit 0/1
- TypeScript 6; tsx dev; compiled JS prod
- libs: `commander`, `drizzle-orm` (driver: `better-sqlite3`, sync), `playwright`, `zod`, `pino`, `dotenv`, `@biomejs/biome` 2.5, `vitest`; ⊥ `@libsql/client` (dead dep, rm from package.json)
- env files: `.env` committed — dev defaults for `DB_PATH`, `SNAPSHOT_DIR`, `CONFIG_PATH`, `LOG_DIR`; `.env.local` gitignored — local overrides; load order in `config.ts`: `dotenv.config({path:'.env'})` → `dotenv.config({path:'.env.local', override:true})`; existing per-var fallbacks in `config.ts` stay as last resort (prod w/o `.env`); `.gitignore`: rm `.env`, add `.env.local`
- DB: `src/schema.ts` — drizzle table defs `urls`/`runs`/`url_runs`; `drizzle-kit generate` → `migrations/*.sql`; `migrate()` (`drizzle-orm/better-sqlite3/migrator`) runs them on boot (CLI + worker)
- V2 atomic claim → Drizzle query builder `.update().set().where(and(...)).returning()`; ⊥ raw SQL unless builder can't guarantee same atomicity (fallback: `sql\`\`` tag, verify @ T3)
- `src/types.ts` first — central TS interfaces (`ScrapedPage`, `RunRecord`, `UrlRecord`, `Config`, `UrlRun`) defined before any implementation file
- TDD: Chicago school (classicist); real objects; mocks only when unavoidable (Playwright browser, SIGTERM)
- test-first cycle: red → green per task; ⊥ implementation task ships w/o passing test
- build: task-by-task; skeleton Txt → user writes tests (red) → review → skeleton Tx → user implements (green) → review → next task
- skeleton Txt: `describe` + named `it(...)` stubs derived from §V for that task; ⊥ assertions
- skeleton Tx: interface/type signature in `src/types.ts` + impl file w/ `throw new Error("not implemented")` bodies
- ⊥ all skeletons upfront
- pre-commit gate: `lefthook` runs `lint → typecheck → test`, in order; each step only runs if prior exits 0; lint step = `biome check` (⊥ `--write` — hook ⊥ modify files mid-commit, deterministic); `npm run lint` (`--write`) stays manual dev command for fixing before commit
- diff: ⊥ PoC (MVP+); future diff compares `version-N/<slug>/meta.json` vs `version-M/<slug>/meta.json` — same slug = same URL across versions
- vectors: ⊥ (future)
- crawler: ⊥ — user supplies URLs
- `?` base-url-per-version: user wants per-run host override for staged paths (e.g. version 1 → dev.example.com/x, version 2 → staging.example.com/x, same slug so comparable); conflicts w/ current V14 (slug hash includes full URL incl. host) & `urls` model (one staged entry = one fixed absolute URL); candidate direction floated (`run start --base-url <host>`, slug recomputed from path only) but ⊥ decided; needs dedicated grill/brainstorm session before spec

## §I INTERFACES

- arch: CLI (`src/cli.ts`) & worker (`src/worker.ts`) separate processes; talk only via SQLite DB (`src/db.ts`); WAL + `busy_timeout=5000` ! prevent SQLITE_BUSY under concurrent access
- job lifecycle: `pending` → `processing` → `done | failed`; worker claims atomically via `UPDATE … RETURNING` (safe for future multi-worker)
- files: `src/config.ts` DB path & env consts, auto-loaded via `loadEnvFiles()` on import | `src/db.ts` connection factory, migration, typed query helpers | `src/cli.ts` commander CLI, URL zod-validated | `src/worker.ts` poll loop (500ms idle), atomic claim, scrape, persist | `src/scraper.ts` Playwright logic, typed result → JSON
- commands: `npm run dev:cli -- <cmd>` CLI via tsx | `npm run dev:worker` worker via tsx | `npm run build` tsc | `npm run test` / `-- <file>` / `-- --watch` vitest | `npm run lint` biome check --write | `npm run typecheck` tsc --noEmit
- file: `lefthook.yml` — pre-commit hook config: 3 steps `lint` (`biome check`, ⊥ write) → `typecheck` (`tsc --noEmit`) → `test` (`vitest run`)
- `package.json` `"prepare": "lefthook install"` → auto-installs git hook after `npm install`
- cmd: `add <url>` → validate (zod) → insert into `urls` (skip if url exists) → print ok | "already exists"
- cmd: `load <file>` → single tx; skip empty lines & `#` comments; validate each url; ∃ invalid → rollback all, exit w/ error listing invalid lines; bulk insert `urls` (skip duplicates) → print added/skipped counts
- cmd: `run start` → ⊥ if `urls` empty; ⊥ if ∃ open run; BEGIN tx: INSERT run (version = COALESCE(MAX(version),0)+1), INSERT url_runs for all `urls`, COMMIT; spawn worker (detached, unref); save PID to runs.pid → print "run N started, PID: X"
- cmd: `run stop` → ⊥ if ⊥ open run; SIGTERM to runs.pid (ESRCH → error "process not found, use run reset"); DELETE url_runs WHERE run_id=?, `UPDATE runs SET status='abandoned' WHERE id=? AND status='open'` (⊥ overwrite done) → print "stopped"; version ! reused
- cmd: `run reset` → ⊥ if ⊥ open run; DELETE url_runs WHERE run_id=?, `UPDATE runs SET status='abandoned' WHERE id=? AND status='open'` → print "reset ok"; version ! reused (fallback when worker crashed without run stop)
- cmd: `url list` → print aligned table: url, created_at
- cmd: `url remove <url>` → ⊥ if run `open`; DELETE FROM urls WHERE url=? → print "removed" | "not found"
- cmd: `url clear` → ⊥ if run `open`; DELETE FROM urls → print "cleared N urls"
- worker: on start → query DB for single `open` run (exit 1 if none); launch chromium browser; poll pending `url_runs` WHERE run_id=? 500 ms idle; atomic claim; scrape; write all artifacts + `meta.json` to snapshot_dir; update url_runs status; when 0 pending → if ∃ `failed` url_runs: write `errors.json` (V9); DELETE url_runs WHERE run_id=?, mark run `done` | `done_with_errors`; close browser; exit 0 if ∀ done, exit 1 if ∃ failed
- cmd: `clean` → ⊥ if ∃ run `open`; delete `DB_PATH` dir (`data/`, incl. WAL/SHM sidecars), `SNAPSHOT_DIR`, `LOG_DIR` → print "cleaned: <paths removed>"; resets project to fresh-install state (no urls/runs/artifacts/logs)
- file: `config.json` schema:
  ```json
  {
    "screenshot": {
      "selector": "string (CSS)",
      "exclude": ["string (CSS)"],
      "full_page": true,
      "format": "png | jpeg",
      "quality": 80
    },
    "timeout_ms": 30000,
    "wait_for": "load | networkidle | domcontentloaded | <CSS selector>",
    "viewport": { "width": 1280, "height": 800 },
    "user_agent": "string",
    "headless": true
  }
  ```
  all fields optional; defaults: full_page=true, format=png, timeout_ms=30000, wait_for=load, viewport=1280x800; quality applies to jpeg only (ignored for png); wait_for CSS selector → page.waitForSelector(timeout_ms) → timeout throws → V15
- env: `DB_PATH` (default `./data/voyager.db`), `SNAPSHOT_DIR` (default `./snapshots`), `CONFIG_PATH` (default `./config.json`), `LOG_DIR` (default `./logs`)
- worker log: `<LOG_DIR>/worker-v<N>.log`; pino streams to file; dir created before spawn
- `src/cli.ts` CLI wiring: `runCommand(fn)` — sole open/migrate/error-format/close point; ∀ command `.action()` → `runCommand((db) => …)`; ⊥ inline open/migrate/try/catch/finally per command
- db schema (`unixepoch()` requires SQLite ≥ 3.38.0; alternative: `strftime('%s','now')`):

```sqlite
CREATE TABLE urls
(
    id         TEXT PRIMARY KEY,
    url        TEXT NOT NULL UNIQUE,
    path       TEXT NOT NULL,
    created_at INTEGER DEFAULT (unixepoch('now'))
);
CREATE TABLE runs
(
    id         TEXT PRIMARY KEY,
    version    INTEGER NOT NULL UNIQUE,
    status     TEXT    NOT NULL DEFAULT 'open', -- open | done | done_with_errors | abandoned
    pid        INTEGER,
    created_at INTEGER          DEFAULT (unixepoch('now'))
);
CREATE TABLE url_runs
(
    id         TEXT PRIMARY KEY,
    url_id     TEXT NOT NULL REFERENCES urls (id),
    run_id     TEXT NOT NULL REFERENCES runs (id),
    status     TEXT NOT NULL DEFAULT 'pending', -- pending | processing | done | failed
    error      TEXT,
    created_at INTEGER       DEFAULT (unixepoch('now')),
    UNIQUE (url_id, run_id)
);
```

- snapshot dir: `<SNAPSHOT_DIR>/version-<N>/<slug>/`
- snapshot contents: `page.html` (rendered), `page.source.html` (raw), `screenshot.{png|jpeg}`, `archive.har`, `meta.json`
- `meta.json` schema:
  ```json
  {
    "url": "string",
    "version": 1,
    "scraped_at": "ISO8601",
    "title": "string",
    "lang": "string",
    "canonical": "string",
    "description": "string",
    "og_description": "string",
    "links": [{ "href": "string", "text": "string", "internal": true }],
    "js_errors": ["string"]
  }
  ```
  links: all `<a href>` from DOM regardless of visibility; href as-is (⊥ normalized); internal = same host; js_errors: both `page.on('console')` type=error + `page.on('pageerror')`; missing fields (404, no meta) → `""` empty string (⊥ null); timing and network metrics in `archive.har`

## §V INVARIANTS

- V1: ∀ `add`/`load` → URL validated w/ zod; invalid → error, ⊥ insert
- V2: worker claims url_run via `UPDATE url_runs SET status='processing' WHERE id=? AND status='pending' RETURNING *`; atomic
- V3: ∀ SQLite open → `PRAGMA journal_mode=WAL`, `PRAGMA busy_timeout=5000`, `PRAGMA foreign_keys=ON` set immediately
- V4: CONFIG_PATH file missing → worker uses built-in defaults (⊥ fail); CONFIG_PATH exists but invalid JSON → worker exit 1 w/ parse error msg
- V5: snapshot dir created before scrape: `path.join(SNAPSHOT_DIR, "version-"+run.version, slug)`; `page.on('response')` listener registered before `page.goto()` — captures raw response body of navigation request
- V6: ⊥ production DB in tests; in-memory or temp file only
- V7: ∀ url_run insert → `run_id` & `url_id` ! reference existing rows; UNIQUE(url_id,run_id)
- V8: `run start` ⊥ if `urls` empty → "no URLs registered"; ⊥ if ∃ run `open` → "run N is still open"; `run reset`/`run stop` → status `abandoned`, ⊥ DELETE run; version monotonic ⊥ reused; `url remove`/`url clear` ⊥ if ∃ run `open`
- V9: worker → 0 pending url_runs → count `failed` url_runs first; if count>0 → write `<SNAPSHOT_DIR>/version-<N>/errors.json` (`[{url,error}]`, one entry per `failed` url_run, sourced from `url_runs.error` before delete) then `UPDATE runs SET status='done_with_errors' WHERE id=? AND status='open'`; else `UPDATE runs SET status='done' WHERE id=? AND status='open'`; both branches → DELETE url_runs WHERE run_id=? (⊥ overwrite abandoned in either branch); exit 0 if ∀ done, exit 1 if ∃ failed;
  `urls` & `runs` ⊥ deleted
- V25: `clean` cmd ⊥ if ∃ run `open` (same guard family as V8 url remove/clear); deletes `data/` (DB file + `-shm`/`-wal` sidecars), `SNAPSHOT_DIR`, `LOG_DIR` entirely; next CLI invocation recreates `data/` dir + DB via existing `openDb` mkdir (V21)
- V26: `scraper.ts` `page.evaluate(fn)` ⊥ reference bundler-injected helpers (e.g. esbuild/tsx `__name`) unavailable in browser context — regression: scrape against a real/local page must produce `screenshot.*` + `meta.json` w/o `ReferenceError`; ⊥ rely on `archive.har`-only output as acceptable success signal
- V27: `config.ts` `dotenv.config()` calls (both `.env` and `.env.local`) always pass `quiet: true` → ⊥ stdout noise ("injected env..." tips) on CLI/worker invocation; `override: true` on `.env.local` call unchanged
- V10: `urls.url` UNIQUE; `add` duplicate url → skip (⊥ error); path = helper field for slug only
- V11: `runs.version` UNIQUE; version = `COALESCE(MAX(version),0)+1`; INSERT run + INSERT url_runs in single transaction → atomic; INSERT fail on conflict → rollback → error
- V12: `run start` spawn fail → DELETE url_runs WHERE run_id=?, DELETE run, exit w/ error; ⊥ orphaned open run
- V13: `load` → single transaction; ∃ invalid URL → rollback all, exit w/ error listing invalid lines
- V14: slug = `slugify(path)` (non-alnum → `-`, trim `-`) + `-` + `sha256(url)[:8]`; deterministic — always derivable, ⊥ stored separately; `links[].href` as-is from DOM (⊥ normalized); `internal` = same host (protocol-agnostic); `screenshot.selector` set → element screenshot (⊥ full_page)
- V15: scraper throws → catch, mark url_run `failed`, save error msg to `url_runs.error`, log via pino, continue next URL; ⊥ worker crash on single URL failure; context.close() in `finally` per URL → HAR always written; browser.close() in worker `finally` before exit → ⊥ zombie Chrome
- V16: `run stop` SIGTERM → ESRCH → exit w/ error "process not found, use run reset"; ⊥ silent continue; `UPDATE runs SET status='abandoned' WHERE status='open'` — ⊥ overwrite `done` (symmetric with V9)
- V17: config load order → `dotenv.config({path:'.env'})` → `dotenv.config({path:'.env.local', override:true})` → per-var `process.env` fallback (last resort); missing `.env`/`.env.local` files ⊥ fail, fallback still works; `loadEnvFiles()` called automatically on `config.ts` module top-level — importing `config.ts` alone is enough, ⊥ requires any entrypoint to call it explicitly
- V19: ∀ CLI command action → wired via single `runCommand(fn)`: `openDb` → `migrate` → invoke `fn(db)` → catch → `console.error` + `exitCode=1` → finally `db.close()`; ⊥ inline open/migrate/try/catch/finally duplicated per command (prevents re-shallowing, cf. B1/B2 drift pattern)
- V20: `cli.ts` invoked w/ ⊥ subcommand → print help/usage, exit 0 (⊥ error — missing subcommand ≠ usage error); unknown cmd | bad args unaffected, still exit 1
- V21: `openDb` (db.ts) → dir of `DB_PATH` missing → `fs.mkdirSync(path.dirname(dbPath), {recursive:true})` before opening `better-sqlite3`; fixes crash confirmed from both `cli.ts` (`add`) & `worker.ts` (both route through `openDb`); fix lives solely in `db.ts`, ⊥ `config.ts`
- V22: test seeding for `run stop` ESRCH-path ! use fixed magic PID (kernel `pid_max` varies — some environments default well below `999999`; wrong-range PID → `EINVAL` not `ESRCH` → wrong branch, flaky by host); ! derive provably-free PID (spawn short-lived child, wait exit, reuse its pid) for portability across environments
- V23: HAR output — `recordHar: { path: '.../archive.har', content: 'embed' }` (scraper.ts:86) + Playwright `^1.61.1` (package.json:36) → flat `.har` JSON (⊥ `.zip`; `.zip` only if path ends `.zip` | `content≠'embed'`)
- V24: SNAPSHOT_DIR/LOG_DIR mkdir → at disk-writing call site, ⊥ `config.ts`: `scraper.ts:81` (SNAPSHOT_DIR), `worker.ts:185` (LOG_DIR); symmetric w/ V21 "fix lives solely in db.ts" — no dup side-effect logic across modules

## §T TASKS

| id  | status | task                                                                                                                                                                                                                                                                                                                                                                                                    | cites             |
|-----|--------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------|
| T0  | x      | `src/types.ts` — all shared interfaces: `ScrapedPage`, `RunRecord`, `UrlRecord`, `Config`, `UrlRun`                                                                                                                                                                                                                                                                                                     | §I                |
| T1  | x      | tests: dotenv load order — `.env.local` overrides `.env` (`override:true`); per-var `process.env` fallback when no env files; isolated temp-dir env files (⊥ touch repo `.env`), cleanup after                                                                                                                                                                                                          | V17               |
| T2  | x      | `src/config.ts` — env constants: DB_PATH, SNAPSHOT_DIR, CONFIG_PATH, LOG_DIR (done); dotenv `.env`→`.env.local` load order (pending)                                                                                                                                                                                                                                                                    | V17               |
| T3  | x      | tests: DB schema, UNIQUE constraints, WAL pragma set, FK enforcement                                                                                                                                                                                                                                                                                                                                    | V3,V6,V7          |
| T4  | x      | `src/db.ts` — connection factory, WAL pragma, schema migration                                                                                                                                                                                                                                                                                                                                          | V3,V7             |
| T5  | x      | tests: slug determinism, uniqueness across URLs, special chars                                                                                                                                                                                                                                                                                                                                          | V14               |
| T6  | x      | `src/slug.ts` — URL → slug (`slugify(path)` + `-` + `sha256(url)[:8]`)                                                                                                                                                                                                                                                                                                                                  | V14               |
| T7  | x      | tests: URL validation, duplicate skip, `load` rollback on invalid, line parsing                                                                                                                                                                                                                                                                                                                         | V1,V10,V13        |
| T8  | x      | `src/cli.ts` — `add <url>`, `load <file>`                                                                                                                                                                                                                                                                                                                                                               | V1,V10,V13        |
| T9  | x      | tests: empty-urls guard, open-run guard, atomic INSERT tx, spawn-fail rollback                                                                                                                                                                                                                                                                                                                          | V8,V11,V12        |
| T10 | x      | `src/cli.ts` — `run start`: guards, create run + url_runs (tx), spawn worker                                                                                                                                                                                                                                                                                                                            | V8,V11,V12        |
| T11 | x      | tests: url remove/clear open-run guard, run stop SIGTERM mock, abandoned-race guard                                                                                                                                                                                                                                                                                                                     | V8,V9,V16         |
| T12 | x      | `src/cli.ts` — `run stop`, `run reset`, `url list`, `url remove`, `url clear`                                                                                                                                                                                                                                                                                                                           | §I,V8             |
| T13 | x      | tests: scraper unit (Playwright mocked), config defaults, wait_for variants, error catch                                                                                                                                                                                                                                                                                                                | V4,V5,V14,V15     |
| T14 | x      | `src/scraper.ts` — meta, links, js_errors, HAR (embed), screenshot, HTML → disk                                                                                                                                                                                                                                                                                                                         | V4,V5,V15         |
| T15 | x      | tests: atomic claim race (two workers), V9 abandoned-race, exit codes                                                                                                                                                                                                                                                                                                                                   | V2,V6,V9          |
| T16 | x      | `src/worker.ts` — poll loop, atomic claim, invoke scraper, write meta.json, cleanup+exit                                                                                                                                                                                                                                                                                                                | V2,V9             |
| T17 | x      | integration test: e2e — add url → run start → worker processes → verify artifacts+db state (wires cli+worker+db+scraper)                                                                                                                                                                                                                                                                                | V2,V8,V9,V15      |
| T18 | x      | setup `lefthook` — devDependency, `lefthook.yml` (lint→typecheck→test), `package.json` `prepare` script                                                                                                                                                                                                                                                                                                 | §C                |
| T19 | x      | tests: characterize `cli.ts` `isMainModule` wiring (stdout + exit code) for `add`, `run start`, error path — currently 0% covered; red before refactor                                                                                                                                                                                                                                                  | V19               |
| T20 | x      | `src/cli.ts` — extract `runCommand(fn)`; rewire all 8 `.action()` callbacks through it; pure refactor, ⊥ behavior change                                                                                                                                                                                                                                                                                | V19               |
| T21 | x      | tests: `cli.ts` invoked w/ 0 args → exitCode 0 & stdout contains help/usage text                                                                                                                                                                                                                                                                                                                        | V20               |
| T22 | x      | `src/cli.ts` — 0-arg invocation → print help, exit 0 (⊥ affect unknown-cmd/bad-arg exit 1 path)                                                                                                                                                                                                                                                                                                         | V20               |
| T23 | x      | tests: `openDb` w/ non-existent nested dir on `DB_PATH` → does ⊥ throw, dir+db file created                                                                                                                                                                                                                                                                                                             | V21               |
| T24 | x      | `src/db.ts` — `openDb` `fs.mkdirSync(path.dirname(dbPath), {recursive:true})` before opening `better-sqlite3`                                                                                                                                                                                                                                                                                           | V21               |
| T25 | x      | tests: subprocess-level coverage `tests/cli-process.test.ts` for `load`, `run stop`, `run reset`, `url list`, `url remove`, `url clear` — happy path + full open-run guard matrix; seed `open` run via direct SQL insert into test `dbPath` (⊥ real `run start`/worker spawn); `run stop` ESRCH path uses provably-free PID per V22 (⊥ hardcoded magic PID); reuse `runCli`/`lastLine`/`tmpDir` helpers | V8,V9,V16,V19,V22 |
| T26 | x      | `README.md` — full CLI command reference (`load`, `run stop`, `run reset`, `url remove`, `url clear`) + `config.json` schema; docs-only, ⊥ test skeleton (no code behavior)                                                                                                                                                                                                                             | §I                |
| T27 | x      | tests: `config.ts` dotenv load — captured stdout during CLI invocation contains ⊥ "injected env" tip lines                                                                                                                                                                                                                                                                                              | V27               |
| T28 | x      | `src/config.ts` — add `quiet: true` to both `dotenv.config()` calls in `loadEnvFiles`                                                                                                                                                                                                                                                                                                                   | V27               |
| T29 | x      | `.gitignore` — add `data/`, `logs/`, `snapshots/`; docs/repo-hygiene, ⊥ test skeleton                                                                                                                                                                                                                                                                                                                   | §C                |
| T30 | x      | tests: `scraper.ts` regression — scrape a real/local test page, assert `screenshot.*` + `meta.json` written, ⊥ `ReferenceError` thrown from `page.evaluate`                                                                                                                                                                                                                                             | V26               |
| T31 | x      | `src/scraper.ts` — fix `page.evaluate(extractDom)` `__name is not defined` (avoid serializing bundler-transformed named fn to browser context)                                                                                                                                                                                                                                                          | V26               |
| T32 | x      | tests: `worker.ts` `finalizeRun` — `failed` count>0 → `done_with_errors` status + `errors.json` written w/ `{url,error}` entries before `url_runs` delete; `failed` count=0 → unchanged `done` path                                                                                                                                                                                                     | V9                |
| T33 | x      | `src/worker.ts` — implement `done_with_errors` status branch + `errors.json` write in `finalizeRun`                                                                                                                                                                                                                                                                                                     | V9                |
| T34 | x      | tests: `clean` cmd — guard when run `open`; deletes `data/` (+ WAL/SHM), `SNAPSHOT_DIR`, `LOG_DIR`; next `openDb` call recreates `data/`                                                                                                                                                                                                                                                                | V25               |
| T35 | x      | `src/cli.ts` — `clean` command                                                                                                                                                                                                                                                                                                                                                                          | V25               |

## §B BUGS

| id | date       | cause                                                                                                                                                                                                                                                                                                                                     | fix                                                                                                                                                                                                |
|----|------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| B1 | 2026-07-01 | deepen pass hid `config.ts` env loading behind explicit `loadEnvFiles()` call (V18) that nothing invoked yet ∴ dotenv dead — ⊥ working until far-future T8/T16                                                                                                                                                                            | revert V18; V17 restored to auto-load on `config.ts` import                                                                                                                                        |
| B2 | 2026-07-01 | `loadUrls` (cli.ts:47-74) insert loop ⊥ wrapped in `db.transaction(...)` ∴ V13 "single tx" ! literally satisfied — rollback-on-invalid works only via pre-validation, ⊥ real tx                                                                                                                                                           | wrap insert loop (cli.ts:64-71) in `db.transaction(...)`; V13 unchanged, already correct                                                                                                           |
| B3 | 2026-07-02 | `config.ts` `dotenv.config()` (both calls) omit `quiet: true` ∴ dotenv@17.4.2 prints "injected env..." tip lines to stdout on every CLI/worker invocation                                                                                                                                                                                 | pass `{ path, quiet: true }` to both calls in `loadEnvFiles`; new V27                                                                                                                              |
| B4 | 2026-07-02 | `.gitignore` `*.db` pattern ⊥ match WAL sidecars (`*.db-shm`, `*.db-wal`); `logs/`, `snapshots/` never listed ∴ `git status` shows them untracked                                                                                                                                                                                         | add `data/`, `logs/`, `snapshots/` to `.gitignore`                                                                                                                                                 |
| B5 | 2026-07-02 | `scraper.ts:130` `page.evaluate(extractDom)` → tsx/esbuild injects `__name` helper call preserving fn name; helper undefined in browser context ∴ `ReferenceError: __name is not defined` on every real-page scrape; `screenshot`/`meta.json` never written (exception precedes those steps), only `archive.har` survives (V15 `finally`) | avoid serializing bundler-transformed named fn to `page.evaluate` (inline anonymous/arrow fn, or strip `__name` injection via esbuild/tsx config); new V26                                         |
| B6 | 2026-07-02 | `worker.ts` `finalizeRun` sets `runs.status='done'` regardless of `url_runs.status='failed'` count, then deletes `url_runs` (incl. `.error`) ∴ only failure trace after run completes is the log file, ⊥ queryable from DB/disk                                                                                                           | add `runs.status` value `done_with_errors` (set instead of `done` when `failed`>0); write `<SNAPSHOT_DIR>/version-<N>/errors.json` (`[{url,error}]`) before deleting failed `url_runs`; V9 amended |
