import { Project } from '@/project/domain/project.entity';
import type { ProjectRepository } from '@/project/domain/project.repository.interface';

export interface CreateProjectInput {
	name: string;
	url: string;
}

export class ProjectService {
	constructor(private readonly repository: ProjectRepository) {}

	async create(input: CreateProjectInput) {
		const project = Project.create({
			name: input.name,
			url: input.url,
		});

		await this.repository.save(project);

		return {
			uuid: project.uuid,
			name: project.name,
			url: project.url,
			status: project.status,
			createdAt: project.createdAt,
			updatedAt: project.updatedAt,
		};
	}

	async findByIdentifier(identifier: string) {
		// Try UUID first
		let project = await this.repository.findByUuid(identifier);

		// Fall back to name
		if (!project) {
			project = await this.repository.findByName(identifier);
		}

		if (!project) {
			return null;
		}

		return {
			uuid: project.uuid,
			name: project.name,
			url: project.url,
			status: project.status,
			createdAt: project.createdAt,
			updatedAt: project.updatedAt,
		};
	}

	async listAll() {
		const projects = await this.repository.listAll();

		return projects.map((project) => ({
			uuid: project.uuid,
			name: project.name,
			status: project.status,
			createdAt: project.createdAt,
		}));
	}
}
