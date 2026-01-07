/**
 * URL normalizer for consistent page identification
 */

export class UrlNormalizer {
	private static TRACKING_PARAMS = [
		"utm_source",
		"utm_medium",
		"utm_campaign",
		"utm_term",
		"utm_content",
		"fbclid",
		"gclid",
		"ref",
		"_ga",
	];

	/**
	 * Normalize URL to consistent format for comparison
	 */
	static normalize(urlString: string): string {
		try {
			const url = new URL(urlString);

			// Get path and remove trailing slash (except for root)
			let path = url.pathname;
			if (path !== "/" && path.endsWith("/")) {
				path = path.slice(0, -1);
			}

			// Lowercase the path
			path = path.toLowerCase();

			// Sort and filter query parameters
			const params = new URLSearchParams(url.search);
			const sortedParams = new URLSearchParams();

			// Filter out tracking parameters and sort
			const paramKeys = Array.from(params.keys())
				.filter(
					(key) => !UrlNormalizer.TRACKING_PARAMS.includes(key.toLowerCase()),
				)
				.sort();

			for (const key of paramKeys) {
				const value = params.get(key);
				if (value !== null) {
					sortedParams.set(key, value);
				}
			}

			const queryString = sortedParams.toString();
			return queryString ? `${path}?${queryString}` : path;
		} catch {
			// If URL parsing fails, return as-is lowercase
			return urlString.toLowerCase();
		}
	}

	/**
	 * Extract base URL (origin) from full URL
	 */
	static getOrigin(urlString: string): string {
		try {
			const url = new URL(urlString);
			return url.origin;
		} catch {
			return urlString;
		}
	}

	/**
	 * Check if URL is within same domain
	 */
	static isSameDomain(baseUrl: string, targetUrl: string): boolean {
		try {
			const base = new URL(baseUrl);
			const target = new URL(targetUrl);
			return base.hostname === target.hostname;
		} catch {
			return false;
		}
	}
}
