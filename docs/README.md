# Diff Voyager Documentation

Welcome to the Diff Voyager documentation. This guide will help you navigate through the project's architecture, development status, and implementation details.

## Quick Navigation

### Getting Started
- **[Getting Started Guide](guides/getting-started.md)** - Installation, setup, and first steps
- **[Development Workflow](guides/development-workflow.md)** - TDD approach, commit guidelines, and best practices

### Architecture
- **[Architecture Overview](architecture/overview.md)** - High-level system design and monorepo structure
- **[Domain Model](architecture/domain-model.md)** - Core entities and their relationships
- **[Technology Stack](architecture/technology-stack.md)** - Technologies used across all packages

### Development Status
- **[Roadmap](development/roadmap.md)** - Current status, completed work, known issues, and planned features

### API Reference
- **[API Endpoints](api/endpoints.md)** - Complete REST API specification
- **[Types and Schemas](api/types.md)** - TypeScript interfaces and request/response types

### Features
- **[Crawler](features/crawler.md)** - Page capture, browser management, and site crawling
- **[Comparators](features/comparators.md)** - SEO, visual, header, and performance comparison
- **[Task Queue](features/task-queue.md)** - Asynchronous task processing and retry logic

### Guides
- **[Testing Strategy](guides/testing-strategy.md)** - TDD approach, test structure, and coverage

## Documentation Structure

```
docs/
├── README.md (this file)
├── architecture/
│   ├── overview.md
│   ├── domain-model.md
│   └── technology-stack.md
├── development/
│   ├── roadmap.md
│   └── changelog.md
├── api/
│   ├── endpoints.md
│   └── types.md
├── guides/
│   ├── getting-started.md
│   ├── development-workflow.md
│   └── testing-strategy.md
├── features/
│   ├── crawler.md
│   ├── comparators.md
│   └── task-queue.md
└── screenshots/
    └── README.md
```

## Key Resources

- **[Main README](../README.md)** - Project overview and quick start
- **[CLAUDE.md](../CLAUDE.md)** - Development guide for AI-assisted coding
- **[PRD](.claude/PRD.md)** - Complete product requirements document

## Contributing

See [Development Workflow](guides/development-workflow.md) for contribution guidelines and best practices.
