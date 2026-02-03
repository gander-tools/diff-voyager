import type { Project } from './project.entity';

export interface ProjectRepository {
	save(project: Project): Promise<void>;
	findByUuid(uuid: string): Promise<Project | null>;
	findByName(name: string): Promise<Project | null>;
	listAll(): Promise<Project[]>;
}
