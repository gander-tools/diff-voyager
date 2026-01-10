/**
 * Snapshots API Service
 */

import { tsRestClient } from './client';

/**
 * Retry capturing a failed snapshot
 */
export async function retrySnapshot(snapshotId: string) {
  const result = await tsRestClient.retrySnapshot({
    params: { snapshotId },
    body: undefined,
  });

  if (result.status === 202) {
    return result.body;
  }

  const errorBody = result.body as { error?: { message?: string } };
  throw new Error(errorBody.error?.message || 'Failed to retry snapshot');
}
