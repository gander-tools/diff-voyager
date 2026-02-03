import { uuidv7 } from 'uuidv7';

export enum ProjectStatus {
	CREATED = 'CREATED',
	QUEUED = 'QUEUED',
	RUNNING = 'RUNNING',
	PROCESSING = 'PROCESSING',
	COMPLETED = 'COMPLETED',
	FAILED = 'FAILED',
	CANCELLED = 'CANCELLED',
}

export interface ProjectData {
	name: string;
	url: string;
}

export class Project {
	public readonly uuid: string;
	public readonly name: string;
	public readonly url: string;
	public status: ProjectStatus;
	public readonly createdAt: Date;
	public updatedAt: Date;

	private constructor(data: ProjectData & { uuid: string; createdAt: Date; updatedAt: Date }) {
		this.uuid = data.uuid;
		this.name = data.name;
		this.url = data.url;
		this.status = ProjectStatus.CREATED;
		this.createdAt = data.createdAt;
		this.updatedAt = data.updatedAt;
	}

	static create(data: ProjectData): Project {
		// Validate name
		if (!data.name || data.name.trim().length === 0) {
			throw new Error('Name is required');
		}

		if (data.name.length > 100) {
			throw new Error('Name must be 100 characters or less');
		}

		if (!/^[a-zA-Z0-9-_]+$/.test(data.name)) {
			throw new Error('Name must be alphanumeric with dashes and underscores only');
		}

		// Validate URL
		let parsedUrl: URL;
		try {
			parsedUrl = new URL(data.url);
		} catch {
			throw new Error('Invalid URL format');
		}

		if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
			throw new Error('URL must use http or https protocol');
		}

		const now = new Date();
		return new Project({
			...data,
			uuid: uuidv7(),
			createdAt: now,
			updatedAt: now,
		});
	}

	updateStatus(status: ProjectStatus): void {
		this.status = status;
		this.updatedAt = new Date();
	}
}
