# @gander-tools/diff-voyager-frontend

Vue.js frontend UI for Diff Voyager - a local website version comparison tool.

> **Note**: This package is under development. The UI is planned but not yet fully implemented.

## Overview

This package provides the web-based user interface for Diff Voyager:
- Project and run management
- Visual diff viewer
- SEO and HTML comparison results
- Performance metrics dashboard
- Diff acceptance and muting workflows

## Planned Features

- **Project Management**: Create and configure crawling projects
- **Run Comparison**: View baseline vs. run differences
- **Visual Diff**: Side-by-side screenshot comparison with highlighting
- **SEO Analysis**: Meta tags, canonical URLs, robots directives
- **Performance Tracking**: Load times, request counts, asset sizes
- **Diff Workflow**: Accept, mute, or filter differences

## Technology Stack

- **Framework**: Vue.js 3 with TypeScript
- **State Management**: Pinia
- **Routing**: Vue Router
- **Build Tool**: Vite
- **Package Manager**: bun (preferred) or npm
- **Testing**: Vitest (unit), Playwright (e2e)

## Requirements

- Node.js v22 or v24
- npm v10 or v11 (or bun)

## Installation

```bash
# Using bun (recommended)
bun install

# Or using npm
npm install
```

## Development

### Start Development Server

```bash
# Using bun
bun run dev

# Or using npm
npm run dev
```

The development server will start at `http://localhost:5173`.

### Building

```bash
# Using bun
bun run build

# Or using npm
npm run build
```

### Type Checking

```bash
bun run type-check
```

### Testing

```bash
# Run unit tests
bun test

# Run unit tests in watch mode
bun run test:watch

# Run e2e tests
bun run test:e2e
```

### Linting and Formatting

```bash
# Check code
bun run lint

# Format code
bun run format
```

## Project Structure

```
src/
├── components/     # Reusable Vue components
├── views/          # Page components
├── stores/         # Pinia state management
├── router/         # Vue Router configuration
├── assets/         # Static assets
└── App.vue         # Root component

tests/              # Test files
├── unit/           # Unit tests
└── e2e/            # End-to-end tests
```

## License

GPL-3.0 - See [LICENSE](./LICENSE) file.
