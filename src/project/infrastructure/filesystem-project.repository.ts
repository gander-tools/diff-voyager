import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Project, type ProjectStatus } from '@/project/domain/project.entity';
import type { ProjectRepository } from '@/project/domain/project.repository.interface';

interface ProjectJson {
	uuid: string;
	name: string;
	url: string;
	status: ProjectStatus;
	createdAt: string;
	updatedAt: string;
}

export class FilesystemProjectRepository implements ProjectRepository {
	private readonly projectsDir: string;

	constructor(baseDir: string) {
		this.projectsDir = join(baseDir, 'projects');
	}

	async save(project: Project): Promise<void> {
		const projectDir = join(this.projectsDir, project.uuid);
		mkdirSync(projectDir, { recursive: true });

		const projectData: ProjectJson = {
			uuid: project.uuid,
			name: project.name,
			url: project.url,
			status: project.status,
			createdAt: project.createdAt.toISOString(),
			updatedAt: project.updatedAt.toISOString(),
		};

		const projectFile = join(projectDir, 'project.json');
		writeFileSync(projectFile, JSON.stringify(projectData, null, 2), 'utf-8');
	}

	async findByUuid(uuid: string): Promise<Project | null> {
		const projectFile = join(this.projectsDir, uuid, 'project.json');

		if (!existsSync(projectFile)) {
			return null;
		}

		const data = JSON.parse(readFileSync(projectFile, 'utf-8')) as ProjectJson;
		return this.hydrate(data);
	}

	async findByName(name: string): Promise<Project | null> {
		const projects = await this.listAll();
		return projects.find((p) => p.name === name) ?? null;
	}

	async listAll(): Promise<Project[]> {
		if (!existsSync(this.projectsDir)) {
			return [];
		}

		const projectDirs = readdirSync(this.projectsDir);
		const projects: Project[] = [];

		for (const dir of projectDirs) {
			const projectFile = join(this.projectsDir, dir, 'project.json');
			if (existsSync(projectFile)) {
				const data = JSON.parse(readFileSync(projectFile, 'utf-8')) as ProjectJson;
				projects.push(this.hydrate(data));
			}
		}

		return projects;
	}

	private hydrate(data: ProjectJson): Project {
		// Use reflection to bypass private constructor
		const project = Object.create(Project.prototype);
		project.uuid = data.uuid;
		project.name = data.name;
		project.url = data.url;
		project.status = data.status;
		project.createdAt = new Date(data.createdAt);
		project.updatedAt = new Date(data.updatedAt);
		return project;
	}
}
