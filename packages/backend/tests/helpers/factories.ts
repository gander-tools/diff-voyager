/**
 * Factory functions for creating test data
 */

import { randomUUID } from "node:crypto";
import type {
	Page,
	Project,
	ProjectConfig,
	Run,
	RunConfig,
	RunStatistics,
	SeoData,
	ViewportConfig,
} from "@gander-tools/diff-voyager-shared";
import { RunProfile, RunStatus } from "@gander-tools/diff-voyager-shared";

export function createProject(overrides: Partial<Project> = {}): Project {
	return {
		id: randomUUID(),
		name: "Test Project",
		baseUrl: "http://localhost:3456",
		createdAt: new Date(),
		updatedAt: new Date(),
		config: createProjectConfig(),
		...overrides,
	};
}

export function createProjectConfig(
	overrides: Partial<ProjectConfig> = {},
): ProjectConfig {
	return {
		crawl: {
			baseUrl: "http://localhost:3456",
			scopeRules: {
				includeDomains: ["localhost"],
				includeSubdomains: false,
				excludePatterns: [],
			},
		},
		runProfile: RunProfile.VISUAL_SEO,
		ignoreFilters: {
			cssSelectors: [],
			xpathSelectors: [],
			httpHeaders: [],
			anonymizeFields: [],
		},
		viewport: { width: 1920, height: 1080 },
		thresholds: {
			visualDiffPercentage: 0.01,
		},
		...overrides,
	};
}

export function createRun(overrides: Partial<Run> = {}): Run {
	return {
		id: randomUUID(),
		projectId: randomUUID(),
		baselineId: randomUUID(),
		status: RunStatus.NEW,
		createdAt: new Date(),
		config: createRunConfig(),
		statistics: createRunStatistics(),
		...overrides,
	};
}

export function createRunConfig(overrides: Partial<RunConfig> = {}): RunConfig {
	return {
		profile: RunProfile.VISUAL_SEO,
		viewport: { width: 1920, height: 1080 },
		captureHar: false,
		captureScreenshots: true,
		generateDiffImages: true,
		...overrides,
	};
}

export function createRunStatistics(
	overrides: Partial<RunStatistics> = {},
): RunStatistics {
	return {
		totalPages: 0,
		completedPages: 0,
		errorPages: 0,
		unchangedPages: 0,
		changedPages: 0,
		criticalDifferences: 0,
		acceptedDifferences: 0,
		mutedDifferences: 0,
		...overrides,
	};
}

export function createPage(overrides: Partial<Page> = {}): Page {
	return {
		id: randomUUID(),
		projectId: randomUUID(),
		normalizedUrl: "/test-page",
		originalUrl: "http://localhost:3456/test-page",
		createdAt: new Date(),
		...overrides,
	};
}

export function createSeoData(overrides: Partial<SeoData> = {}): SeoData {
	return {
		title: "Test Page Title",
		metaDescription: "Test description",
		canonical: "http://localhost:3456/test-page",
		robots: "index, follow",
		h1: ["Main Heading"],
		h2: [],
		lang: "en",
		...overrides,
	};
}

export function createViewport(
	overrides: Partial<ViewportConfig> = {},
): ViewportConfig {
	return {
		width: 1920,
		height: 1080,
		...overrides,
	};
}
