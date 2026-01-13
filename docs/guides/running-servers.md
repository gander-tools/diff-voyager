# Running Servers

This guide covers how to run and configure the Diff Voyager backend API server.

## Running the API Server

### Basic Usage

```bash
# Start backend server (default port 3000)
npm run dev:backend

# Or with custom port/data directory
PORT=3001 DATA_DIR=./my-data npm run dev:backend
```

### Log Level Configuration

Configure log levels via environment variables or CLI arguments:

```bash
# Via environment variables
LOG_LEVEL_CONSOLE=info LOG_LEVEL_FILE=debug npm run dev:backend

# Via CLI arguments (takes priority over env vars)
node packages/backend/dist/index.js --log-level-console info --log-level-file debug

# All available options
node packages/backend/dist/index.js \
  --port 3001 \
  --data-dir ./my-data \
  --log-level-console warn \
  --log-level-file debug
```

**Log Level Configuration:**
- **Environment variables:** `LOG_LEVEL_CONSOLE`, `LOG_LEVEL_FILE` (or `LOG_LEVEL` for both)
- **CLI flags:** `--log-level-console`, `--log-level-file` (or `--log-level` for both)
- **Priority:** CLI flags > environment variables > defaults
- **Valid levels:** `trace`, `debug`, `info`, `warn`, `error`, `fatal`
- **Defaults:** Console=`debug` (dev) or `info` (prod), File=`debug`

### Available Endpoints

The server will be available at `http://localhost:3000` with endpoints:

- `POST /api/v1/scans` - Create a scan (single page or crawl)
- `GET /api/v1/projects/:id` - Get project details with pages
- `GET /api/v1/artifacts/:pageId/*` - Get artifacts (screenshot, har, html)
- `GET /health` - Health check

### API Documentation

- **Swagger UI**: Available at `http://localhost:3000/docs`
- Interactive API documentation with request/response examples
- Try out API endpoints directly from the browser

## Testing the API

### Quick Test with curl

**Async scan** (returns immediately):
```bash
curl -X POST http://localhost:3000/api/v1/scans \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

**Sync scan** (blocks until complete, returns full result):
```bash
curl -X POST http://localhost:3000/api/v1/scans \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "sync": true}'
```

**Get project details**:
```bash
curl http://localhost:3000/api/v1/projects/{projectId}
```

### Scan Options

All available options for creating a scan:

```json
{
  "url": "https://example.com",
  "sync": true,
  "name": "My Project",
  "crawl": false,
  "viewport": { "width": 1920, "height": 1080 },
  "collectHar": false,
  "waitAfterLoad": 1000
}
```

**Parameters:**
- `url` (required): The URL to scan
- `sync` (optional): If true, blocks until scan completes; if false, returns immediately
- `name` (optional): Custom project name
- `crawl` (optional): If true, crawls entire site; if false, scans only the specified URL
- `viewport` (optional): Browser viewport size
- `collectHar` (optional): Whether to collect HAR files for performance analysis
- `waitAfterLoad` (optional): Milliseconds to wait after page load before capturing

## Related Documentation

- [Backend Development](backend-dev.md) - Backend development workflow
- [@ts-rest Guide](ts-rest.md) - API contract and endpoints
- [Getting Started](getting-started.md) - Initial project setup
