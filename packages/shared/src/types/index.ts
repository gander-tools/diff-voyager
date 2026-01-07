import type {
	DiffSeverity,
	DiffStatus,
	DiffType,
	PageStatus,
	RuleScope,
	RunProfile,
	RunStatus,
} from "../enums/index.js";

/**
 * Project - represents a migration effort with baseline and comparison runs
 */
export interface Project {
	id: string;
	name: string;
	description?: string;
	baseUrl: string;
	createdAt: Date;
	updatedAt: Date;
	config: ProjectConfig;
}

/**
 * Project configuration
 */
export interface ProjectConfig {
	crawl: CrawlConfig;
	runProfile: RunProfile;
	ignoreFilters: IgnoreFilters;
	viewport: ViewportConfig;
	thresholds: ThresholdConfig;
}

/**
 * Crawl configuration
 */
export interface CrawlConfig {
	baseUrl: string;
	scopeRules: ScopeRules;
	maxPages?: number;
	maxDurationMs?: number;
	maxConcurrency?: number;
	maxRetries?: number;
}

/**
 * Scope rules for crawling
 */
export interface ScopeRules {
	includeDomains: string[];
	includeSubdomains: boolean;
	excludePatterns: string[];
	includePatterns?: string[];
}

/**
 * Ignore filters for comparison
 */
export interface IgnoreFilters {
	cssSelectors: string[];
	xpathSelectors: string[];
	httpHeaders: string[];
	anonymizeFields: string[];
}

/**
 * Viewport configuration for screenshots
 */
export interface ViewportConfig {
	width: number;
	height: number;
	deviceScaleFactor?: number;
}

/**
 * Threshold configuration for diff detection
 */
export interface ThresholdConfig {
	visualDiffPercentage: number;
	performanceLoadTimeIncreaseMs?: number;
	performanceRequestCountIncrease?: number;
	performanceSizeIncreaseBytes?: number;
}

/**
 * Baseline - immutable reference snapshot of a project
 */
export interface Baseline {
	id: string;
	projectId: string;
	createdAt: Date;
	runId: string; // Reference to the run that created the baseline
	pageCount: number;
	config: ProjectConfig; // Snapshot of config at baseline creation
}

/**
 * Run - a comparison crawl against the baseline
 */
export interface Run {
	id: string;
	projectId: string;
	baselineId: string;
	status: RunStatus;
	createdAt: Date;
	startedAt?: Date;
	completedAt?: Date;
	interruptedAt?: Date;
	config: RunConfig;
	statistics: RunStatistics;
}

/**
 * Run configuration
 */
export interface RunConfig {
	profile: RunProfile;
	viewport: ViewportConfig;
	captureHar: boolean;
	captureScreenshots: boolean;
	generateDiffImages: boolean;
}

/**
 * Run statistics
 */
export interface RunStatistics {
	totalPages: number;
	completedPages: number;
	errorPages: number;
	unchangedPages: number;
	changedPages: number;
	criticalDifferences: number;
	acceptedDifferences: number;
	mutedDifferences: number;
}

/**
 * Page - normalized page identifier within a project
 */
export interface Page {
	id: string;
	projectId: string;
	normalizedUrl: string;
	originalUrl: string;
	createdAt: Date;
}

/**
 * Page snapshot - complete capture of a page at a specific point in time
 */
export interface PageSnapshot {
	id: string;
	pageId: string;
	runId: string;
	status: PageStatus;
	capturedAt: Date;
	httpStatus: number;
	redirectChain?: Redirect[];
	html: string;
	htmlHash: string;
	httpHeaders: Record<string, string>;
	seoData: SeoData;
	performance?: PerformanceData;
	artifacts: ArtifactReferences;
	error?: string;
}

/**
 * HTTP redirect information
 */
export interface Redirect {
	from: string;
	to: string;
	status: number;
}

/**
 * SEO metadata extracted from a page
 */
export interface SeoData {
	title?: string;
	metaDescription?: string;
	canonical?: string;
	robots?: string;
	h1?: string[];
	h2?: string[];
	openGraph?: Record<string, string>;
	twitterCard?: Record<string, string>;
	lang?: string;
}

/**
 * Performance data and metrics
 */
export interface PerformanceData {
	loadTimeMs: number;
	requestCount: number;
	totalSizeBytes: number;
	resourceTimings?: ResourceTiming[];
}

/**
 * Resource timing information
 */
export interface ResourceTiming {
	url: string;
	type: string;
	durationMs: number;
	sizeBytes: number;
}

/**
 * References to stored artifacts
 */
export interface ArtifactReferences {
	screenshotPath?: string;
	harPath?: string;
	diffImagePath?: string;
}

/**
 * Diff - comparison result between baseline and run for a page
 */
export interface Diff {
	id: string;
	pageId: string;
	runId: string;
	baselineSnapshotId: string;
	runSnapshotId: string;
	createdAt: Date;
	changes: Change[];
	summary: DiffSummary;
}

/**
 * Individual change detected in a diff
 */
export interface Change {
	id: string;
	type: DiffType;
	severity: DiffSeverity;
	status: DiffStatus;
	description: string;
	details: ChangeDetails;
	mutedByRuleId?: string;
	acceptedAt?: Date;
	acceptedBy?: string;
}

/**
 * Details of a specific change
 */
export interface ChangeDetails {
	field?: string;
	oldValue?: unknown;
	newValue?: unknown;
	selector?: string;
	xpath?: string;
	metadata?: Record<string, unknown>;
}

/**
 * Summary of all changes in a diff
 */
export interface DiffSummary {
	totalChanges: number;
	criticalChanges: number;
	acceptedChanges: number;
	mutedChanges: number;
	changesByType: Record<DiffType, number>;
	visualDiffPercentage?: number;
	visualDiffPixels?: number;
	thresholdExceeded: boolean;
}

/**
 * Mute rule - defines which differences to ignore
 */
export interface MuteRule {
	id: string;
	projectId?: string;
	name: string;
	description?: string;
	scope: RuleScope;
	active: boolean;
	createdAt: Date;
	updatedAt: Date;
	conditions: RuleCondition[];
}

/**
 * Condition for a mute rule
 */
export interface RuleCondition {
	diffType: DiffType;
	cssSelector?: string;
	xpathSelector?: string;
	fieldPattern?: string;
	headerName?: string;
	valuePattern?: string;
}

/**
 * Export manifest for project data
 */
export interface ExportManifest {
	version: string;
	exportedAt: Date;
	project: Project;
	baseline: Baseline;
	runs: Run[];
	pages: Page[];
	snapshots: PageSnapshot[];
	diffs: Diff[];
	muteRules: MuteRule[];
}
