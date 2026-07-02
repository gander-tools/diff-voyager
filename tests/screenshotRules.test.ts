import { describe, expect, it } from 'vitest';
import { resolveScreenshotRules } from '../src/screenshotRules';

describe('resolveScreenshotRules', () => {
  it('matches "*" catch-all against any url (V39)', () => {
    const result = resolveScreenshotRules(
      { hide: { '*': ['.cookie-banner'] } },
      ['https://example.com/a'],
    );

    expect(result.hide).toEqual(['.cookie-banner']);
  });

  it('unions and dedups selectors across multiple matching globs (V39)', () => {
    const result = resolveScreenshotRules(
      {
        hide: {
          'https://example.com/**': ['.ad', '.shared'],
          'https://example.com/*': ['.banner', '.shared'],
        },
      },
      ['https://example.com/a'],
    );

    expect(result.hide.sort()).toEqual(['.ad', '.banner', '.shared']);
  });

  it('matches when only the first candidate url (sourceUrl) matches (V39 match-any)', () => {
    const result = resolveScreenshotRules(
      { mark: { 'https://source.example.com/*': ['.price'] } },
      ['https://source.example.com/a', 'https://cdn.example.com/a'],
    );

    expect(result.mark).toEqual(['.price']);
  });

  it('matches when only the second candidate url (effective url) matches (V39 match-any)', () => {
    const result = resolveScreenshotRules(
      { mark: { 'https://cdn.example.com/*': ['.price'] } },
      ['https://source.example.com/a', 'https://cdn.example.com/a'],
    );

    expect(result.mark).toEqual(['.price']);
  });

  it('returns empty hide/mark when no glob matches', () => {
    const result = resolveScreenshotRules(
      { hide: { '/other/*': ['.x'] }, mark: { '/other/*': ['.y'] } },
      ['https://example.com/a'],
    );

    expect(result).toEqual({ hide: [], mark: [] });
  });

  it('returns empty hide/mark when rules is undefined', () => {
    expect(resolveScreenshotRules(undefined, ['https://example.com/a'])).toEqual({
      hide: [],
      mark: [],
    });
  });
});
