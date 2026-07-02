# diff voyager

Versioned web scraper. Stage URLs, start a run, get full-page artifacts per version — HTML, screenshot, HAR, metadata. Built for future diffing across versions.

## Installation

```bash
npm install
npx playwright install chromium
```

Copy `.env` to the project root (all values are optional — defaults shown):

```dotenv
DB_PATH=./data/voyager.db
SNAPSHOT_DIR=./snapshots
CONFIG_PATH=./config.json
LOG_DIR=./logs
```

## Usage

```bash
# stage a URL
npm run dev:cli -- add https://example.com

# stage many URLs from a file (one per line, `#` comments and blank lines ignored)
npm run dev:cli -- load urls.txt

# start a run (spawns background worker)
npm run dev:cli -- run start
```

Artifacts land in `SNAPSHOT_DIR` once the worker finishes.

## Commands

| command             | description                                                                                                                                     |
|----------------------|---------------------------------------------------------------------------------------------------------------------------------------------------|
| `add <url>`          | Stage a single URL. Skips silently if the URL is already staged.                                                                                  |
| `load <file>`        | Stage URLs from a file, one per line. Blank lines and `#`-prefixed lines are ignored. Invalid URLs abort the whole load — nothing is inserted.     |
| `run start`          | Create a new version and start a background worker that scrapes all staged URLs. Fails if a run is already open or no URLs are staged.            |
| `run stop`           | Stop the running worker (`SIGTERM`) and mark the open run as `abandoned`. Use to cancel a run in progress.                                        |
| `run reset`          | Mark the open run as `abandoned` without signaling a process. Use if the worker already crashed or was killed outside the CLI.                    |
| `url list`           | List staged URLs with their creation date.                                                                                                         |
| `url remove <url>`   | Remove a single staged URL. Fails while a run is open.                                                                                             |
| `url clear`          | Remove all staged URLs. Fails while a run is open.                                                                                                 |
| `diff <v1> <v2> [url-or-path]` | Compare screenshots (pixelmatch) and `meta.json` between two versions. `url-or-path` omitted diffs every page_slug present in both versions; a full URL diffs exactly one; a path(+query) diffs every URL sharing that path+query across domains. Fails if either version's run is still open. Results land in `RESULT_DIR`. |

## Configuration

Scraping behavior is controlled by an optional `config.json` file (path via `CONFIG_PATH`, default `./config.json`). All fields are optional.

```json
{
  "screenshot": {
    "selector": "string (CSS)",
    "rules": {
      "hide": { "<glob>": ["string (CSS)"] },
      "mark": { "<glob>": ["string (CSS)"] },
      "diff": { "tolerance": { "<glob>": "number 0-1" } }
    },
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

- `screenshot.selector` — screenshot a single element instead of the full page.
- `screenshot.rules.hide` — glob-matched (source or effective url) CSS selectors hidden (`display:none`) before the screenshot.
- `screenshot.rules.mark` — glob-matched CSS selectors masked (colored overlay) via Playwright's `mask` option.
- `screenshot.rules.diff.tolerance` — glob-matched fraction (0-1) of differing pixels allowed by `diff` before flagging a screenshot as changed; unmatched urls default to `0`.
- `screenshot.full_page` — default `true`; ignored if `selector` is set.
- `screenshot.format` / `screenshot.quality` — `quality` applies to `jpeg` only.
- `timeout_ms` — default `30000`.
- `wait_for` — default `load`; a CSS selector waits for that element to appear, throwing on timeout.
- `viewport` — default `1280x800`.
- `user_agent` — overrides the default Chromium user agent.
- `headless` — default `true`.

If `config.json` is missing, built-in defaults are used. If it exists but contains invalid JSON, the worker exits with a parse error.

## Output structure

```
snapshots/
└── version-1/
    └── example-com-a1b2c3d4/
        ├── page.html          # rendered DOM
        ├── page.source.html   # raw response body
        ├── screenshot.png
        ├── archive.har
        └── meta.json          # title, links, js errors, …
```
