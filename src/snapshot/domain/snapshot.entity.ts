import { uuidv7 } from 'uuidv7';

export enum SnapshotStatus {
	PENDING = 'PENDING',
	QUEUED = 'QUEUED',
	IN_PROGRESS = 'IN_PROGRESS',
	COMPLETED = 'COMPLETED',
	PARTIAL = 'PARTIAL',
	FAILED = 'FAILED',
}

export interface SnapshotData {
	projectUuid: string;
	fullScan: boolean;
}

export class Snapshot {
	public readonly uuid: string;
	public readonly projectUuid: string;
	public readonly fullScan: boolean;
	public status: SnapshotStatus;
	public readonly createdAt: Date;
	public updatedAt: Date;

	private constructor(data: SnapshotData & { uuid: string; createdAt: Date; updatedAt: Date }) {
		this.uuid = data.uuid;
		this.projectUuid = data.projectUuid;
		this.fullScan = data.fullScan;
		this.status = SnapshotStatus.PENDING;
		this.createdAt = data.createdAt;
		this.updatedAt = data.updatedAt;
	}

	static create(data: SnapshotData): Snapshot {
		const now = new Date();
		return new Snapshot({
			...data,
			uuid: uuidv7(),
			createdAt: now,
			updatedAt: now,
		});
	}

	markAsInProgress(): void {
		this.status = SnapshotStatus.IN_PROGRESS;
		this.updatedAt = new Date();
	}

	markAsCompleted(): void {
		this.status = SnapshotStatus.COMPLETED;
		this.updatedAt = new Date();
	}

	markAsFailed(): void {
		this.status = SnapshotStatus.FAILED;
		this.updatedAt = new Date();
	}

	markAsPartial(): void {
		this.status = SnapshotStatus.PARTIAL;
		this.updatedAt = new Date();
	}
}
