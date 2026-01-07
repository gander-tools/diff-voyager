/**
 * HTML fixtures barrel export
 */

import * as baseline from "./baseline.js";
import * as edgeCases from "./edge-cases.js";
import * as seoChanges from "./seo-changes.js";

export const HTML_FIXTURES = {
	baseline: {
		simple: baseline.BASELINE_SIMPLE,
		withLinks: baseline.BASELINE_WITH_LINKS,
		minimal: baseline.BASELINE_MINIMAL,
	},
	seoChanges: {
		titleChanged: seoChanges.SEO_TITLE_CHANGED,
		descriptionChanged: seoChanges.SEO_DESCRIPTION_CHANGED,
		canonicalChanged: seoChanges.SEO_CANONICAL_CHANGED,
		robotsChanged: seoChanges.SEO_ROBOTS_CHANGED,
		h1Changed: seoChanges.SEO_H1_CHANGED,
		h1Missing: seoChanges.SEO_H1_MISSING,
		langChanged: seoChanges.SEO_LANG_CHANGED,
		titleMissing: seoChanges.SEO_TITLE_MISSING,
	},
	edgeCases: {
		empty: edgeCases.EMPTY_DOCUMENT,
		malformed: edgeCases.MALFORMED_HTML,
		unicode: edgeCases.UNICODE_CONTENT,
		large: edgeCases.LARGE_DOCUMENT,
		noMetaTags: edgeCases.NO_META_TAGS,
		multipleH1: edgeCases.MULTIPLE_H1,
	},
};

export { baseline, seoChanges, edgeCases };
