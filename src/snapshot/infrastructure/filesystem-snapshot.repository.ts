import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Snapshot, type SnapshotStatus } from '@/snapshot/domain/snapshot.entity';

interface SnapshotJson {
	uuid: string;
	projectUuid: string;
	fullScan: boolean;
	status: SnapshotStatus;
	createdAt: string;
	updatedAt: string;
}

export class FilesystemSnapshotRepository {
	constructor(private readonly baseDir: string) {}

	async save(projectUuid: string, snapshot: Snapshot): Promise<void> {
		const snapshotDir = join(this.baseDir, 'projects', projectUuid, 'snapshots', snapshot.uuid);
		mkdirSync(snapshotDir, { recursive: true });

		const snapshotData: SnapshotJson = {
			uuid: snapshot.uuid,
			projectUuid: snapshot.projectUuid,
			fullScan: snapshot.fullScan,
			status: snapshot.status,
			createdAt: snapshot.createdAt.toISOString(),
			updatedAt: snapshot.updatedAt.toISOString(),
		};

		const indexFile = join(snapshotDir, 'index.json');
		writeFileSync(indexFile, JSON.stringify(snapshotData, null, 2), 'utf-8');
	}

	async findByUuid(projectUuid: string, snapshotUuid: string): Promise<Snapshot | null> {
		const indexFile = join(
			this.baseDir,
			'projects',
			projectUuid,
			'snapshots',
			snapshotUuid,
			'index.json',
		);

		if (!existsSync(indexFile)) {
			return null;
		}

		const data = JSON.parse(readFileSync(indexFile, 'utf-8')) as SnapshotJson;
		return this.hydrate(data);
	}

	async listByProject(projectUuid: string): Promise<Snapshot[]> {
		const snapshotsDir = join(this.baseDir, 'projects', projectUuid, 'snapshots');

		if (!existsSync(snapshotsDir)) {
			return [];
		}

		const snapshotDirs = readdirSync(snapshotsDir);
		const snapshots: Snapshot[] = [];

		for (const dir of snapshotDirs) {
			const indexFile = join(snapshotsDir, dir, 'index.json');
			if (existsSync(indexFile)) {
				const data = JSON.parse(readFileSync(indexFile, 'utf-8')) as SnapshotJson;
				snapshots.push(this.hydrate(data));
			}
		}

		return snapshots;
	}

	private hydrate(data: SnapshotJson): Snapshot {
		const snapshot = Object.create(Snapshot.prototype);
		snapshot.uuid = data.uuid;
		snapshot.projectUuid = data.projectUuid;
		snapshot.fullScan = data.fullScan;
		snapshot.status = data.status;
		snapshot.createdAt = new Date(data.createdAt);
		snapshot.updatedAt = new Date(data.updatedAt);
		return snapshot;
	}
}
