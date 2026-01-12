/**
 * Type utilities for ofetch API client
 *
 * This file provides type-safe wrappers around ofetch's response handling,
 * working around limitations in ofetch's type system where the generic
 * parameter doesn't properly infer from the responseType option.
 */

/**
 * ofetch response type mapping
 *
 * Maps responseType values to their corresponding TypeScript types.
 * Based on ofetch's internal ResponseType interface.
 */
export interface ResponseTypeMap {
  blob: Blob;
  text: string;
  arrayBuffer: ArrayBuffer;
  stream: ReadableStream<Uint8Array>;
  json: unknown; // Default type
}

/**
 * Type-safe wrapper for ofetch calls with explicit response types
 *
 * This function solves the issue where ofetch's generic parameter doesn't
 * properly narrow the return type based on the responseType option.
 *
 * Instead of:
 * ```typescript
 * // Type error: Promise<Blob> is not assignable to Promise<unknown>
 * return apiClient<Blob>('/image.png', { responseType: 'blob' }) as any;
 * ```
 *
 * Use:
 * ```typescript
 * // Type-safe: explicitly maps 'blob' -> Blob
 * return fetchAs('blob', apiClient('/image.png', { responseType: 'blob' }));
 * ```
 *
 * @param responseType - The expected response type ('blob', 'text', etc.)
 * @param fetcher - The ofetch promise to wrap
 * @returns Promise with properly typed response
 *
 * @example
 * ```typescript
 * export function getScreenshot(pageId: string): Promise<Blob> {
 *   return fetchAs(
 *     'blob',
 *     apiClient(`/artifacts/${pageId}/screenshot`, { responseType: 'blob' })
 *   );
 * }
 * ```
 */
export function fetchAs<R extends keyof ResponseTypeMap>(
  _responseType: R,
  fetcher: Promise<unknown>,
): Promise<ResponseTypeMap[R]> {
  // The cast is safe because:
  // 1. We've explicitly specified _responseType in the caller
  // 2. ofetch will return the correct type at runtime
  // 3. We're trading one unsafe cast for a type-safe API
  return fetcher as Promise<ResponseTypeMap[R]>;
}

/**
 * Type-safe headers for ofetch
 *
 * Represents the various header formats that ofetch and Fetch API accept.
 */
export type SafeHeaders = Record<string, string> | HeadersInit;

/**
 * Merge headers safely, handling conditional properties
 *
 * This utility solves the type incompatibility issue when conditionally
 * merging headers for ofetch. The conditional spread creates a union type
 * that TypeScript can't prove is compatible with HeadersInit.
 *
 * @param headerSources - Variable number of header objects to merge
 * @returns Merged headers as a plain Record<string, string>
 *
 * @example
 * ```typescript
 * // Instead of:
 * options.headers = {
 *   ...(typeof headers === 'object' ? headers : {}),
 *   ...(shouldSet ? { 'Content-Type': 'application/json' } : {}),
 * } as any;
 *
 * // Use:
 * options.headers = mergeHeaders(
 *   typeof headers === 'object' ? headers : undefined,
 *   shouldSet ? { 'Content-Type': 'application/json' } : undefined
 * );
 * ```
 */
export function mergeHeaders(...headerSources: Array<SafeHeaders | undefined>): HeadersInit {
  const result: Record<string, string> = {};

  for (const headers of headerSources) {
    if (!headers) continue;

    if (headers instanceof Headers) {
      // Handle Headers object from Fetch API
      headers.forEach((value, key) => {
        result[key] = value;
      });
    } else if (Array.isArray(headers)) {
      // Handle array of [key, value] tuples
      for (const [key, value] of headers) {
        result[key] = value;
      }
    } else if (typeof headers === 'object') {
      // Handle plain object
      Object.assign(result, headers);
    }
  }

  return result;
}
