export function parseBaseUrl(input: string): string {
  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    throw new Error(`invalid base-url: ${input}`);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`unsupported base-url scheme: ${parsed.protocol}`);
  }

  return parsed.origin;
}

export function effectiveUrl(baseUrl: string, originalUrl: string): string {
  const original = new URL(originalUrl);
  return baseUrl + original.pathname + original.search + original.hash;
}
