import { Snapshot } from '@/snapshot/domain/snapshot.entity';
import type { FilesystemSnapshotRepository } from '@/snapshot/infrastructure/filesystem-snapshot.repository';

export interface CreateSnapshotInput {
	projectId: string;
	fullScan: boolean;
}

export class SnapshotService {
	constructor(private readonly repository: FilesystemSnapshotRepository) {}

	async create(input: CreateSnapshotInput) {
		const snapshot = Snapshot.create({
			projectUuid: input.projectId,
			fullScan: input.fullScan,
		});

		await this.repository.save(input.projectId, snapshot);

		return {
			snapshotUuid: snapshot.uuid,
			projectUuid: snapshot.projectUuid,
			status: snapshot.status,
		};
	}
}
