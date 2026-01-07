# Changelog

## [0.1.4](https://github.com/gander-tools/diff-voyager/compare/diff-voyager-backend-v0.1.3...diff-voyager-backend-v0.1.4) (2026-01-07)


### Features

* **backend:** add support for multiple comparison runs per project ([fd5e079](https://github.com/gander-tools/diff-voyager/commit/fd5e079a9add2b506d50869d7f047248c36a6ec7))
* **backend:** add task queue table migration and types ([a92dc7d](https://github.com/gander-tools/diff-voyager/commit/a92dc7d3ac9fe0284bc98a2f51608b9f599db341))
* **backend:** implement PageTaskQueue for batch operations ([26ec8cb](https://github.com/gander-tools/diff-voyager/commit/26ec8cb612e57d198262e9253b2485dea91fb3ba))
* **backend:** implement retry logic and stale task recovery ([e7a49df](https://github.com/gander-tools/diff-voyager/commit/e7a49dff1a74f2f5d680700455159d990025ee4c))
* **backend:** implement TaskProcessor and progress tracking ([0da285d](https://github.com/gander-tools/diff-voyager/commit/0da285dcd4ed9ef3abc1efabee1fe296f1e5a7b3))
* **backend:** implement TaskQueue.complete() and fail() methods ([c9b697e](https://github.com/gander-tools/diff-voyager/commit/c9b697ef71a6585ff1adfb3e005c58e93cfc3df4))
* **backend:** implement TaskQueue.dequeue() method ([70451d1](https://github.com/gander-tools/diff-voyager/commit/70451d1f8ab3df0f281c03237b15a9cdf630014b))
* **backend:** implement TaskQueue.enqueue() method ([d6a58cf](https://github.com/gander-tools/diff-voyager/commit/d6a58cfe7e1a9c4b2374c0061b97f5fc383cc1c1))


### Bug Fixes

* **backend:** resolve Biome lint issues in queue implementation ([17fa1a5](https://github.com/gander-tools/diff-voyager/commit/17fa1a5e33555a52b2dc94f1394ca40955baed21))

## [0.1.3](https://github.com/gander-tools/diff-voyager/compare/diff-voyager-backend-v0.1.2...diff-voyager-backend-v0.1.3) (2026-01-07)


### Bug Fixes

* **tests:** use PLAYWRIGHT_AVAILABLE for conditional test skipping ([#63](https://github.com/gander-tools/diff-voyager/issues/63)) ([9c947e7](https://github.com/gander-tools/diff-voyager/commit/9c947e7d68c52828f23e42839cbce6075f71163e))

## [0.1.2](https://github.com/gander-tools/diff-voyager/compare/diff-voyager-backend-v0.1.1...diff-voyager-backend-v0.1.2) (2026-01-07)


### Features

* **backend:** add Swagger UI for API documentation ([e7754e0](https://github.com/gander-tools/diff-voyager/commit/e7754e0eb6e6c3126c7370eff1c612edf274e92a))
* **backend:** implement minimal API structure ([#46](https://github.com/gander-tools/diff-voyager/issues/46)) ([90ee11b](https://github.com/gander-tools/diff-voyager/commit/90ee11b65770a9f4764227926925c3494e8344e9))
* **config:** configure Biome for monorepo structure ([a2befa0](https://github.com/gander-tools/diff-voyager/commit/a2befa0f1d27a50a373fcc49a352b32311289739))


### Bug Fixes

* **deps:** update dependency better-sqlite3 to v12 ([519bb4c](https://github.com/gander-tools/diff-voyager/commit/519bb4c299a03a7aa745e276b19dedddfb3c0390))
* **lint:** fix TypeScript any type and unused variables ([7403d7a](https://github.com/gander-tools/diff-voyager/commit/7403d7a2dcdbcecd3303457539f377dfb5b41d44))
* **tests:** prefix unused PLAYWRIGHT_AVAILABLE with underscore ([085851c](https://github.com/gander-tools/diff-voyager/commit/085851c5eeee0b1de8eef5fda58708b5a5583c71))

## [0.1.1](https://github.com/gander-tools/diff-voyager/compare/diff-voyager-backend-v0.1.0...diff-voyager-backend-v0.1.1) (2026-01-05)


### Bug Fixes

* **deps:** update dependency pixelmatch to v7 ([02b6f2e](https://github.com/gander-tools/diff-voyager/commit/02b6f2e0c1e4f4617f15e3909312b984f366ff6d))

## 0.1.0 (2026-01-05)


### Features

* **shared:** add README with package overview and usage ([#30](https://github.com/gander-tools/diff-voyager/issues/30)) ([2612d8a](https://github.com/gander-tools/diff-voyager/commit/2612d8a40380e8b54941ecb183c909a063fd438e))
