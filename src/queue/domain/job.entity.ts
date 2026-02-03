import { uuidv7 } from 'uuidv7';

export enum JobStatus {
	PENDING = 'PENDING',
	RUNNING = 'RUNNING',
	COMPLETED = 'COMPLETED',
	FAILED = 'FAILED',
	RETRYING = 'RETRYING',
	CANCELLED = 'CANCELLED',
}

export enum JobType {
	SNAPSHOT_SINGLE = 'SNAPSHOT_SINGLE',
	SNAPSHOT_CRAWL = 'SNAPSHOT_CRAWL',
}

export interface JobData {
	type: JobType;
	payload: unknown;
	maxRetries?: number;
}

export class Job {
	public readonly id: string;
	public readonly type: JobType;
	public status: JobStatus;
	public readonly payload: unknown;
	public retryCount: number;
	public readonly maxRetries: number;
	public readonly createdAt: Date;
	public updatedAt: Date;

	private constructor(data: JobData & { id: string; createdAt: Date; updatedAt: Date }) {
		this.id = data.id;
		this.type = data.type;
		this.status = JobStatus.PENDING;
		this.payload = data.payload;
		this.retryCount = 0;
		this.maxRetries = data.maxRetries ?? 3;
		this.createdAt = data.createdAt;
		this.updatedAt = data.updatedAt;
	}

	static create(data: JobData): Job {
		const now = new Date();
		return new Job({
			...data,
			id: uuidv7(),
			createdAt: now,
			updatedAt: now,
		});
	}

	markAsRunning(): void {
		this.status = JobStatus.RUNNING;
		this.updatedAt = new Date();
	}

	markAsCompleted(): void {
		this.status = JobStatus.COMPLETED;
		this.updatedAt = new Date();
	}

	markAsFailed(): void {
		this.status = JobStatus.FAILED;
		this.updatedAt = new Date();
	}

	markForRetry(): void {
		this.retryCount++;
		this.status = JobStatus.RETRYING;
		this.updatedAt = new Date();
	}

	canRetry(): boolean {
		return this.retryCount < this.maxRetries;
	}
}
