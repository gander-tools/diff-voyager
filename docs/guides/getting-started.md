# Getting Started

This guide will help you install and run Diff Voyager for the first time.

## Prerequisites

### Required Software

| Software | Min Version | Purpose |
|----------|-------------|---------|
| **Node.js** | 22.0.0 | JavaScript runtime |
| **npm** | 10.0.0 | Package manager |
| **Git** | 2.x | Version control |

### System Requirements

- **Operating System**: Linux, macOS, or Windows with WSL2
- **RAM**: 4 GB minimum, 8 GB recommended
- **Disk Space**: 2 GB for dependencies + project data
- **Network**: Required for initial setup and crawling

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/gander-tools/diff-voyager.git
cd diff-voyager
```

### 2. Install Dependencies

```bash
# Install all dependencies and build shared types
npm install
npm run setup
```

This will:
- Install dependencies for all packages (backend, frontend, shared)
- Build the shared TypeScript types
- Build the backend

### 3. Install Playwright Browsers

Playwright needs browser binaries for page capture:

```bash
npx playwright install
```

This downloads Chromium, Firefox, and WebKit browsers (~500 MB).

**Tip**: To install only Chromium (smaller):
```bash
npx playwright install chromium
```

## Running Diff Voyager

Diff Voyager consists of two parts: the backend API and the frontend UI.

### Start the Backend API

```bash
npm run dev:backend
```

The API server will start at `http://localhost:3000`.

**Output:**
```
Server listening on http://localhost:3000
Swagger UI available at http://localhost:3000/docs
```

### Custom Configuration

Use environment variables to customize the server:

```bash
# Custom port
PORT=3001 npm run dev:backend

# Custom data directory
DATA_DIR=./my-data npm run dev:backend

# Both
PORT=3001 DATA_DIR=./my-data npm run dev:backend
```

**Environment Variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | HTTP server port |
| `DATA_DIR` | ./data | Data storage directory |
| `LOG_LEVEL` | info | Logging level (debug, info, warn, error) |

## First Scan

### 1. Verify Server is Running

```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "ok",
  "version": "0.1.11",
  "timestamp": "2026-01-08T12:00:00Z"
}
```

### 2. Run Your First Scan (Synchronous)

Scan a single page and wait for results:

```bash
curl -X POST http://localhost:3000/api/v1/scans \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "sync": true,
    "name": "My First Project"
  }' | jq
```

**Response:**
```json
{
  "projectId": "550e8400-e29b-41d4-a716-446655440000",
  "runId": "660e8400-e29b-41d4-a716-446655440000",
  "status": "COMPLETED",
  "message": "Scan completed successfully",
  "projectUrl": "/api/v1/projects/550e8400-e29b-41d4-a716-446655440000"
}
```

### 3. View Project Details

```bash
curl http://localhost:3000/api/v1/projects/550e8400-e29b-41d4-a716-446655440000 | jq
```

This returns the project with all pages and snapshots.

### 4. Retrieve Artifacts

Get the screenshot:

```bash
curl http://localhost:3000/api/v1/artifacts/{pageId}/screenshot.png \
  --output screenshot.png
```

Get the HTML:

```bash
curl http://localhost:3000/api/v1/artifacts/{pageId}/page.html \
  --output page.html
```

## Interactive API Documentation

Visit **`http://localhost:3000/docs`** for Swagger UI.

Features:
- Browse all API endpoints
- Try endpoints directly from browser
- View request/response schemas
- See example responses

## Next Steps

### Run a Comparison

After making changes to your website, create a comparison run:

```bash
curl -X POST http://localhost:3000/api/v1/scans \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "sync": true,
    "name": "My First Project"
  }' | jq
```

The system will:
1. Detect this is the same project (based on URL)
2. Create a new comparison run (not a new baseline)
3. Compare against the baseline
4. Generate diffs (when workflow integrated)

### Explore More Options

**Scan with custom viewport:**
```bash
curl -X POST http://localhost:3000/api/v1/scans \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "sync": true,
    "viewport": {
      "width": 1920,
      "height": 1080
    }
  }' | jq
```

**Scan with HAR file collection:**
```bash
curl -X POST http://localhost:3000/api/v1/scans \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "sync": true,
    "collectHar": true
  }' | jq
```

**Asynchronous scan (for large sites):**
```bash
curl -X POST http://localhost:3000/api/v1/scans \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "sync": false,
    "crawl": true
  }' | jq
```

Response includes `taskId` for checking progress:
```bash
curl http://localhost:3000/api/v1/tasks/{taskId} | jq
```

## Troubleshooting

### Port Already in Use

If port 3000 is already in use:

```bash
PORT=3001 npm run dev:backend
```

### Playwright Installation Fails

If `npx playwright install` fails:

1. Check Node.js version: `node --version` (must be 22.x or 24.x)
2. Clear cache: `rm -rf ~/.cache/ms-playwright`
3. Try again: `npx playwright install`

### Permission Denied (Linux)

If you get permission errors:

```bash
# Fix npm global packages
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### Out of Memory

For large crawls, increase Node.js memory:

```bash
NODE_OPTIONS=--max-old-space-size=4096 npm run dev:backend
```

### Database Locked

If SQLite database is locked:

1. Stop all running instances
2. Delete `./data/diff-voyager.db-wal` and `./data/diff-voyager.db-shm`
3. Restart server

## Development Tools

### Run Tests

```bash
# All tests
npm test

# Backend tests only
npm run test:backend

# With coverage
npm run test:coverage:backend

# Watch mode (auto-rerun on changes)
cd packages/backend && npm run test:watch
```

### Linting and Formatting

```bash
# Check code style
npm run lint

# Auto-fix issues
npm run lint:fix

# Format code
npm run format:fix
```

### Database Inspection

Use a SQLite browser to inspect the database:

```bash
# Install sqlite3 CLI
sudo apt install sqlite3  # Ubuntu/Debian
brew install sqlite3      # macOS

# Open database
sqlite3 ./data/diff-voyager.db

# List tables
.tables

# Query projects
SELECT * FROM projects;

# Exit
.quit
```

### Start the Frontend UI

In a separate terminal:

```bash
npm run dev:frontend
```

The frontend development server will start at `http://localhost:5173`.

**Output:**
```
VITE v5.x.x  ready in 123 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Access the Application

Once both servers are running:

- **Frontend UI**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/docs

**Note**: The frontend requires the backend to be running. Start the backend first.

## Current UI Features (Phase 1)

The frontend is currently in Phase 1 (Foundation & Infrastructure). Here's what you'll see:

### What's Working ✅

**Layout & Navigation**:
- Responsive layout with collapsible sidebar
- Top navigation bar with theme and language switchers
- Sidebar menu with icons and route highlighting
- Dynamic breadcrumb navigation
- 11 configured routes (Dashboard, Projects, Runs, Pages, Rules, Settings)

**Theme Support**:
- Light theme
- Dark theme
- Auto theme (follows system preference)
- Theme persistence (saved to localStorage)

**Language Support**:
- English (EN)
- Polish (PL)
- Language switcher in header
- 300+ translation keys
- Language persistence (saved to localStorage)

**Navigation Menu**:
- 📊 Dashboard (/)
- 📁 Projects (/projects)
- 🔄 Runs (via project detail)
- 📝 Rules (/rules)
- ⚙️ Settings (/settings)

### What's Not Yet Implemented ⏳

**Views** (showing placeholders):
- Dashboard statistics and recent projects
- Project list, create, and detail views
- Run create and detail views
- Page detail with diff comparison
- Rules list and create views
- Settings form

**Functionality**:
- No data fetching from backend yet
- No forms for creating projects/runs
- No diff visualization
- No mute rules management

**Coming Next** (Phase 2):
- Dashboard with project statistics
- Project list with search and pagination
- Project creation form
- Project detail with runs list

See [Frontend Status](../features/frontend-status.md) for detailed progress.

## Next Reading

- [Frontend Status](../features/frontend-status.md) - Current UI implementation status
- [Development Workflow](development-workflow.md) - TDD approach and best practices
- [API Overview](../api/overview.md) - Complete API reference
- [Architecture](../architecture/overview.md) - System design and components
