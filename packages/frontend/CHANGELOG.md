# Changelog

## [0.1.15](https://github.com/gander-tools/diff-voyager/compare/diff-voyager-frontend-v0.1.14...diff-voyager-frontend-v0.1.15) (2026-01-12)


### Features

* **frontend:** implement RunCreateView for issue [#186](https://github.com/gander-tools/diff-voyager/issues/186) ([f23a141](https://github.com/gander-tools/diff-voyager/commit/f23a14139a0cc08a14ad2757a6df9bde84a9e71b))
* **frontend:** implement RunDetailView for issue [#187](https://github.com/gander-tools/diff-voyager/issues/187) ([78b5840](https://github.com/gander-tools/diff-voyager/commit/78b58402f99307e3bfe47b2ee8095bef749c6159))
* **frontend:** implement RunForm component with loading and error states ([9536ba2](https://github.com/gander-tools/diff-voyager/commit/9536ba2827864856caebc092c8a0d3e21db0b6eb))
* **frontend:** implement RunListView for issue [#185](https://github.com/gander-tools/diff-voyager/issues/185) ([c7278e9](https://github.com/gander-tools/diff-voyager/commit/c7278e93c66e561969ab4fe070c00a015b64b64f))
* **frontend:** implement RunProgress component for issue [#191](https://github.com/gander-tools/diff-voyager/issues/191) ([9dd1f6b](https://github.com/gander-tools/diff-voyager/commit/9dd1f6bccad9b0a05afeed3284c2bfa5eada9ccd))
* **frontend:** implement RunStatistics component for issue [#192](https://github.com/gander-tools/diff-voyager/issues/192) ([950c914](https://github.com/gander-tools/diff-voyager/commit/950c914d9db3621e1c1b2ef33c75903ad2466a21))
* **frontend:** implement RunStatusBadge component with proper types and animation ([bfe19fe](https://github.com/gander-tools/diff-voyager/commit/bfe19fe058155332cea272772454122bba173526)), closes [#190](https://github.com/gander-tools/diff-voyager/issues/190)
* **frontend:** refactor RunCard to use shared API types ([#188](https://github.com/gander-tools/diff-voyager/issues/188)) ([d8694cc](https://github.com/gander-tools/diff-voyager/commit/d8694ccef29cf23d0f2bab5582f7a6b1f037d7db))
* **frontend:** refactor RunCard to use shared API types ([#188](https://github.com/gander-tools/diff-voyager/issues/188)) ([7f20ebe](https://github.com/gander-tools/diff-voyager/commit/7f20ebe73fe54dd71cbf1ad0c58e4ec835641e03))

## [0.1.14](https://github.com/gander-tools/diff-voyager/compare/diff-voyager-frontend-v0.1.13...diff-voyager-frontend-v0.1.14) (2026-01-11)


### Features

* **frontend:** migrate getPageDiff and listRunPages to [@ts-rest](https://github.com/ts-rest) ([dafdd7a](https://github.com/gander-tools/diff-voyager/commit/dafdd7ad93cff4d5cfe071016d3d10098b41a01a))


### Bug Fixes

* **frontend:** make project name optional and reorder form fields ([533666c](https://github.com/gander-tools/diff-voyager/commit/533666cb13d3d7a41d41515ec667f44c8d2b5da7))

## [0.1.13](https://github.com/gander-tools/diff-voyager/compare/diff-voyager-frontend-v0.1.12...diff-voyager-frontend-v0.1.13) (2026-01-11)


### Bug Fixes

* **frontend:** only set Content-Type header when request has body ([f56196d](https://github.com/gander-tools/diff-voyager/commit/f56196da420c07d652ef489546bd2eff1cb5cbd0))

## [0.1.12](https://github.com/gander-tools/diff-voyager/compare/diff-voyager-frontend-v0.1.11...diff-voyager-frontend-v0.1.12) (2026-01-11)


### Features

* **frontend:** add retry functionality UI for failed pages ([6f4fa06](https://github.com/gander-tools/diff-voyager/commit/6f4fa06e72ed7ea688fedf20a7615e07850aada9))


### Bug Fixes

* **backend,frontend:** fix re-scan not starting and incorrect status codes ([f7d072b](https://github.com/gander-tools/diff-voyager/commit/f7d072b56f8f1687f9c10aeed1363e8a4ae62da3))
* **frontend:** add missing NNotificationProvider to App.vue ([1d0878f](https://github.com/gander-tools/diff-voyager/commit/1d0878f82d4a52add550cbc049f2f9323c2f21f2))
* resolve Biome lint errors in retry functionality ([fb5cb75](https://github.com/gander-tools/diff-voyager/commit/fb5cb75275f76e5ec554936bfbfca37e96f1010a))

## [0.1.11](https://github.com/gander-tools/diff-voyager/compare/diff-voyager-frontend-v0.1.10...diff-voyager-frontend-v0.1.11) (2026-01-09)


### Bug Fixes

* **frontend:** downgrade zod to v3 for vee-validate compatibility ([7fc585b](https://github.com/gander-tools/diff-voyager/commit/7fc585b12583b4743ced8f4d6c08562c697c358f))
* **frontend:** resolve component type errors after dependency updates ([3459140](https://github.com/gander-tools/diff-voyager/commit/345914098a31609ebdb59e26b18d6ea30c8a27e8))
* **frontend:** resolve vue-tsc type-check errors for production build ([107e014](https://github.com/gander-tools/diff-voyager/commit/107e014e6d2a3a2c8e22035df4ee5f6da6bf6017))
* **frontend:** simplify ofetch type handling for compatibility ([6ee02be](https://github.com/gander-tools/diff-voyager/commit/6ee02be23090016149b25343fae2a3b5d0fffe8a))
* **frontend:** update vue-i18n API usage for v11 compatibility ([bad6de3](https://github.com/gander-tools/diff-voyager/commit/bad6de3f41cd0b5a0a0ef2a3167c6a6cab2a648e))

## [0.1.10](https://github.com/gander-tools/diff-voyager/compare/diff-voyager-frontend-v0.1.9...diff-voyager-frontend-v0.1.10) (2026-01-09)


### Features

* **frontend:** integrate vee-validate with Zod for form validation ([147312a](https://github.com/gander-tools/diff-voyager/commit/147312ae073734107b1b5280eafae4ad3ab74a08))


### Bug Fixes

* **frontend:** correct route parameter names for project views ([ace8491](https://github.com/gander-tools/diff-voyager/commit/ace8491bd414d99cc9ec404e364510517d182af1))
* **frontend:** remove non-null assertion operators ([ed9cd07](https://github.com/gander-tools/diff-voyager/commit/ed9cd0783c684120c7586428c4203f5d4dbcc6f4))

## [0.1.9](https://github.com/gander-tools/diff-voyager/compare/diff-voyager-frontend-v0.1.8...diff-voyager-frontend-v0.1.9) (2026-01-09)


### Features

* **frontend:** add Zod validation schemas for project creation ([ba2ded7](https://github.com/gander-tools/diff-voyager/commit/ba2ded7287b694a216ac44dad01619936f2a7861))
* **frontend:** implement DashboardView with statistics ([98d17cd](https://github.com/gander-tools/diff-voyager/commit/98d17cd180328a2cac765677dbaaa923951617d2))
* **frontend:** implement ProjectCard component ([774ebdb](https://github.com/gander-tools/diff-voyager/commit/774ebdb4339f4aee81b33e1b46cbe4127c2d4f41))
* **frontend:** implement ProjectCreateView with project creation flow ([777445b](https://github.com/gander-tools/diff-voyager/commit/777445bc105b7374b83d6b216fa5c9d66b23411b))
* **frontend:** implement ProjectDetailView with full project information ([f8f1d9b](https://github.com/gander-tools/diff-voyager/commit/f8f1d9b90d6391e2e3d52a181673335bfaddf87c))
* **frontend:** implement ProjectForm with multi-step wizard ([26faf26](https://github.com/gander-tools/diff-voyager/commit/26faf26930839146d1fe055d30662245a2bcbdf9))
* **frontend:** implement ProjectListView with pagination ([5825b22](https://github.com/gander-tools/diff-voyager/commit/5825b22550fede2f5d957c87fff9801644aa5466))
* **frontend:** implement projectsStore with full CRUD operations ([138adc3](https://github.com/gander-tools/diff-voyager/commit/138adc3f74164aa0070856daf23c6a6f8f61d4fb))
* **frontend:** implement ProjectStatistics component ([87ffac6](https://github.com/gander-tools/diff-voyager/commit/87ffac617d11ee804a12988dcd69089138f213de))
* **frontend:** implement ProjectStatusBadge component ([50a5a00](https://github.com/gander-tools/diff-voyager/commit/50a5a006c735ec11493834d5c46e2a19af75a14d))

## [0.1.8](https://github.com/gander-tools/diff-voyager/compare/diff-voyager-frontend-v0.1.7...diff-voyager-frontend-v0.1.8) (2026-01-09)


### Features

* **frontend:** add type-safe Vue Router helpers ([0e9ac2a](https://github.com/gander-tools/diff-voyager/commit/0e9ac2aeda081c1db1361544e65e306807c8de77))
* **frontend:** install @ts-rest/core for type-safe API client ([c7b03a6](https://github.com/gander-tools/diff-voyager/commit/c7b03a641d6bb43120b7b37c40e31a7eb3275aab))
* **frontend:** integrate [@ts-rest](https://github.com/ts-rest) client in API services ([9b8aea1](https://github.com/gander-tools/diff-voyager/commit/9b8aea16777be8826957e535875bfecf59f8f41f))

## [0.1.7](https://github.com/gander-tools/diff-voyager/compare/diff-voyager-frontend-v0.1.6...diff-voyager-frontend-v0.1.7) (2026-01-08)


### Bug Fixes

* **frontend:** add biome-ignore comments for Vue template usage ([ad61c56](https://github.com/gander-tools/diff-voyager/commit/ad61c5667bf0cace429115093d99f02a616ce4d1))
* **frontend:** add missing Vue 3 component imports ([2210817](https://github.com/gander-tools/diff-voyager/commit/2210817d78780004d6828b98d88cafd5af5a8ffb))
* **frontend:** add Naive UI imports to common components ([b35a25c](https://github.com/gander-tools/diff-voyager/commit/b35a25c3c04c392e28768661ad814f863f83ea24))
* **frontend:** install missing @vicons/tabler dependency ([6780008](https://github.com/gander-tools/diff-voyager/commit/67800089de10b9290ba04ca8f652c1388676eadc))

## [0.1.6](https://github.com/gander-tools/diff-voyager/compare/diff-voyager-frontend-v0.1.5...diff-voyager-frontend-v0.1.6) (2026-01-08)


### Bug Fixes

* **frontend:** disable Biome noUnusedVariables/noUnusedImports for Vue files ([c9a4486](https://github.com/gander-tools/diff-voyager/commit/c9a44860ddc5b471a3732c857b96a59fdaefa76c))

## [0.1.5](https://github.com/gander-tools/diff-voyager/compare/diff-voyager-frontend-v0.1.4...diff-voyager-frontend-v0.1.5) (2026-01-08)


### Features

* add common UI components with Naive UI ([1796812](https://github.com/gander-tools/diff-voyager/commit/1796812442d1fc9da647604145a0844a1dead73a))
* add i18n with English and Polish translations ([9dd4ac8](https://github.com/gander-tools/diff-voyager/commit/9dd4ac898a3e81f7b7ebb73601d746397ca90b78))
* **frontend:** configure Vue Router with all application routes ([ea41690](https://github.com/gander-tools/diff-voyager/commit/ea416900f6ab829bab62a3b8d30151cf5b4dbf0b))
* implement layout components with responsive design ([9e8c1e5](https://github.com/gander-tools/diff-voyager/commit/9e8c1e50a3d80098b2085864e6b5f221d5c48149))
* implement Pinia stores for state management ([ff8c176](https://github.com/gander-tools/diff-voyager/commit/ff8c17693579008c94558aa7947f0ef963aed3eb))
* implement typed API client with error handling ([16ca943](https://github.com/gander-tools/diff-voyager/commit/16ca94378dd747482e039ef4e9446e5e4968e6d2))

## [0.1.4](https://github.com/gander-tools/diff-voyager/compare/diff-voyager-frontend-v0.1.3...diff-voyager-frontend-v0.1.4) (2026-01-08)


### Features

* **ci:** add test coverage reporting for all packages ([a8bd155](https://github.com/gander-tools/diff-voyager/commit/a8bd1554c016bb396f25e2784e9bf14bac418238))

## [0.1.3](https://github.com/gander-tools/diff-voyager/compare/diff-voyager-frontend-v0.1.2...diff-voyager-frontend-v0.1.3) (2026-01-08)


### Features

* **frontend:** add TypeScript and build configuration ([5472180](https://github.com/gander-tools/diff-voyager/commit/547218057abb557cf8c8c76e6cf69d95956ca148))
* **frontend:** add Vue 3 dependencies and build scripts ([b4b7d6b](https://github.com/gander-tools/diff-voyager/commit/b4b7d6b614ac00d48fbf3f7998c85b3f6f3a897d))
* **frontend:** implement Vue 3 application skeleton ([f8de748](https://github.com/gander-tools/diff-voyager/commit/f8de748b30583535821a057d335e25f6ba58f4ab))

## [0.1.2](https://github.com/gander-tools/diff-voyager/compare/diff-voyager-frontend-v0.1.1...diff-voyager-frontend-v0.1.2) (2026-01-07)


### Features

* **backend:** implement minimal API structure ([#46](https://github.com/gander-tools/diff-voyager/issues/46)) ([90ee11b](https://github.com/gander-tools/diff-voyager/commit/90ee11b65770a9f4764227926925c3494e8344e9))
* **config:** configure Biome for monorepo structure ([a2befa0](https://github.com/gander-tools/diff-voyager/commit/a2befa0f1d27a50a373fcc49a352b32311289739))


### Bug Fixes

* **lint:** fix TypeScript any type and unused variables ([7403d7a](https://github.com/gander-tools/diff-voyager/commit/7403d7a2dcdbcecd3303457539f377dfb5b41d44))

## [0.1.1](https://github.com/gander-tools/diff-voyager/compare/diff-voyager-frontend-v0.1.0...diff-voyager-frontend-v0.1.1) (2026-01-05)


### Bug Fixes

* **deps:** update dependency pinia to v3 ([254b7a0](https://github.com/gander-tools/diff-voyager/commit/254b7a01e33e94578fd681ef1c27d15a5cbd423d))

## 0.1.0 (2026-01-05)


### Features

* **shared:** add README with package overview and usage ([#30](https://github.com/gander-tools/diff-voyager/issues/30)) ([2612d8a](https://github.com/gander-tools/diff-voyager/commit/2612d8a40380e8b54941ecb183c909a063fd438e))
