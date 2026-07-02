import micromatch from 'micromatch';
import type { Config } from './types';

type Rules = NonNullable<NonNullable<Config['screenshot']>['rules']>;

function matchSelectors(ruleMap: Record<string, string[]> | undefined, urls: string[]): string[] {
  if (!ruleMap) {
    return [];
  }

  const selectors = new Set<string>();
  for (const [glob, sels] of Object.entries(ruleMap)) {
    if (glob === '*' || urls.some((url) => micromatch.isMatch(url, glob))) {
      for (const sel of sels) {
        selectors.add(sel);
      }
    }
  }

  return [...selectors];
}

export function resolveScreenshotRules(
  rules: Rules | undefined,
  candidateUrls: string[],
): { hide: string[]; mark: string[] } {
  return {
    hide: matchSelectors(rules?.hide, candidateUrls),
    mark: matchSelectors(rules?.mark, candidateUrls),
  };
}
