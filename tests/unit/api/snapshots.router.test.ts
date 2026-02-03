/**
 * API Module - Snapshots Router
 * Testing Methodology: London School (mocked services)
 */

import { beforeEach, describe, expect, test } from 'bun:test';
import { createSnapshotsRouter } from '@/api/routers/snapshots.router';

// Mock services
const mockSnapshotService = {
	create: async (data: { projectId: string; fullScan: boolean }) => ({
		snapshotUuid: 'snapshot-uuid-123',
		projectUuid: data.projectId,
		status: 'PENDING',
	}),
};

describe('Snapshots Router', () => {
	let router: ReturnType<typeof createSnapshotsRouter>;

	beforeEach(() => {
		router = createSnapshotsRouter(mockSnapshotService as any);
	});

	test('create endpoint queues new snapshot', async () => {
		const result = await router.create({
			projectId: 'project-123',
			fullScan: false,
		});

		expect(result.snapshotUuid).toBe('snapshot-uuid-123');
		expect(result.projectUuid).toBe('project-123');
		expect(result.status).toBe('PENDING');
	});

	test('create endpoint supports fullScan option', async () => {
		const result = await router.create({
			projectId: 'project-123',
			fullScan: true,
		});

		expect(result.snapshotUuid).toBe('snapshot-uuid-123');
	});
});
