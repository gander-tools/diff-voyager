import type { SnapshotService } from '@/snapshot/services/snapshot.service';

export interface SnapshotsRouter {
	create: (input: { projectId: string; fullScan: boolean }) => Promise<{
		snapshotUuid: string;
		projectUuid: string;
		status: string;
	}>;
}

export function createSnapshotsRouter(snapshotService: SnapshotService): SnapshotsRouter {
	return {
		create: async (input) => {
			return await snapshotService.create({
				projectId: input.projectId,
				fullScan: input.fullScan,
			});
		},
	};
}
