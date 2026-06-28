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

# start a run (spawns background worker)
npm run dev:cli -- run start

# check progress
npm run dev:cli -- url list
```

Artifacts land in `SNAPSHOT_DIR` once the worker finishes.

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
