import { describe, expect, it } from 'vitest';

describe('Frontend Setup', () => {
  it('should have correct environment configuration', () => {
    // Verify API base URL is configured
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    expect(apiBaseUrl).toBeDefined();
    expect(apiBaseUrl).toContain('/api/v1');
  });

  it('should be able to import shared types', async () => {
    // Verify we can import from shared package
    const shared = await import('@gander-tools/diff-voyager-shared');
    expect(shared).toBeDefined();
    expect(shared.RunStatus).toBeDefined();
    // RunStatus is an enum, so check it has the expected values
    expect(Object.values(shared.RunStatus)).toContain('new');
  });
});
