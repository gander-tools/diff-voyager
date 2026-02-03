import type { ProjectService } from '@/project/services/project.service';

export interface ProjectsRouter {
	create: (input: { name: string; url: string; fullScan?: boolean }) => Promise<{
		uuid: string;
		name: string;
		url: string;
		status: string;
		createdAt: Date;
		updatedAt: Date;
	}>;
	get: (input: { identifier: string }) => Promise<{
		uuid: string;
		name: string;
		url: string;
		status: string;
		createdAt: Date;
		updatedAt: Date;
	} | null>;
	list: () => Promise<{
		projects: Array<{
			uuid: string;
			name: string;
			status: string;
			createdAt: Date;
		}>;
	}>;
}

export function createProjectsRouter(projectService: ProjectService): ProjectsRouter {
	return {
		create: async (input) => {
			return await projectService.create({
				name: input.name,
				url: input.url,
			});
		},

		get: async (input) => {
			return await projectService.findByIdentifier(input.identifier);
		},

		list: async () => {
			const projects = await projectService.listAll();
			return { projects };
		},
	};
}
