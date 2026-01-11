import { apiContract } from '@gander-tools/diff-voyager-shared';
import { initClient } from '@ts-rest/core';
import { ofetch } from 'ofetch';

/**
 * API Error class with status code and message
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Rate limit error class
 */
export class RateLimitError extends ApiError {
  constructor(
    message: string,
    public retryAfter?: number,
  ) {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

/**
 * Base API client configuration
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

/**
 * Retry configuration for rate limiting
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
};

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Calculate exponential backoff delay
 */
const getRetryDelay = (attempt: number): number => {
  const delay = RETRY_CONFIG.initialDelay * RETRY_CONFIG.backoffMultiplier ** (attempt - 1);
  return Math.min(delay, RETRY_CONFIG.maxDelay);
};

/**
 * Base fetch client with error handling and retries
 */
export const apiClient = ofetch.create({
  baseURL: API_BASE_URL,

  // Request interceptor
  onRequest({ options }) {
    // Add default headers
    const headers = options.headers || {};

    // Only set Content-Type if body is present (avoid Fastify error for void bodies)
    const shouldSetContentType = options.body !== undefined && options.body !== null;

    // biome-ignore lint/suspicious/noExplicitAny: ofetch headers type compatibility
    options.headers = {
      ...(typeof headers === 'object' ? headers : {}),
      ...(shouldSetContentType ? { 'Content-Type': 'application/json' } : {}),
    } as any;
  },

  // Response interceptor for error handling
  async onResponseError({ response, options: _options }) {
    const statusCode = response.status;
    const url = response.url;

    // Handle rate limiting with retry
    if (statusCode === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const retryAfterMs = retryAfter ? Number.parseInt(retryAfter, 10) * 1000 : undefined;

      throw new RateLimitError(`Rate limit exceeded for ${url}`, retryAfterMs);
    }

    // Handle other HTTP errors
    // response._data contains the parsed response body
    const errorData = response._data as { message?: string; error?: string } | undefined;
    const errorMessage =
      errorData?.message || errorData?.error || response.statusText || `HTTP ${statusCode} error`;

    throw new ApiError(errorMessage, statusCode, response._data);
  },
});

/**
 * Fetch with automatic retry on rate limit errors
 */
export async function fetchWithRetry<T>(
  url: string,
  // biome-ignore lint/suspicious/noExplicitAny: ofetch type compatibility wrapper
  options?: any,
  maxRetries = RETRY_CONFIG.maxRetries,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await apiClient<T>(url, options);
    } catch (error) {
      lastError = error as Error;

      // Only retry on rate limit errors
      if (error instanceof RateLimitError && attempt <= maxRetries) {
        // Use Retry-After header if available, otherwise exponential backoff
        const delay = error.retryAfter || getRetryDelay(attempt);

        console.warn(`Rate limited. Retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);

        await sleep(delay);
        continue;
      }

      // Don't retry other errors
      throw error;
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError;
}

/**
 * Type-safe GET request
 */
export function get<T>(
  url: string,
  // biome-ignore lint/suspicious/noExplicitAny: ofetch type compatibility wrapper
  options?: any,
): Promise<T> {
  return fetchWithRetry<T>(url, { ...options, method: 'GET' });
}

/**
 * Type-safe POST request
 */
export function post<T>(
  url: string,
  body?: unknown,
  // biome-ignore lint/suspicious/noExplicitAny: ofetch type compatibility wrapper
  options?: any,
): Promise<T> {
  return fetchWithRetry<T>(url, {
    ...options,
    method: 'POST',
    body,
  });
}

/**
 * Type-safe PUT request
 */
export function put<T>(
  url: string,
  body?: unknown,
  // biome-ignore lint/suspicious/noExplicitAny: ofetch type compatibility wrapper
  options?: any,
): Promise<T> {
  return fetchWithRetry<T>(url, {
    ...options,
    method: 'PUT',
    body,
  });
}

/**
 * Type-safe DELETE request
 */
export function del<T>(
  url: string,
  // biome-ignore lint/suspicious/noExplicitAny: ofetch type compatibility wrapper
  options?: any,
): Promise<T> {
  return fetchWithRetry<T>(url, { ...options, method: 'DELETE' });
}

/**
 * @ts-rest API client (type-safe, auto-generated from API contract)
 *
 * This client provides:
 * - Compile-time type safety for all API calls
 * - Automatic URL generation from contract
 * - Request/response validation with Zod
 * - Integration with existing retry logic
 *
 * Example usage:
 * ```typescript
 * const result = await tsRestClient.createScan({
 *   body: { url: 'https://example.com', sync: true }
 * });
 * ```
 */
export const tsRestClient = initClient(apiContract, {
  baseUrl: API_BASE_URL,
  baseHeaders: {},
  api: async ({ path, method, headers, body }) => {
    // Use ofetch.raw() to get status code along with body
    try {
      const rawResponse = await apiClient.raw(path, {
        method,
        headers,
        body,
      });

      return {
        status: rawResponse.status,
        body: rawResponse._data,
        headers: rawResponse.headers,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        return {
          status: error.statusCode || 500,
          body: error.response || { message: error.message },
          headers: new Headers(),
        };
      }
      throw error;
    }
  },
});
