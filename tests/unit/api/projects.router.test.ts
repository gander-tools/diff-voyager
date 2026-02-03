/**
 * API Module - Projects Router
 * Testing Methodology: London School (mocked services - complex setup for real services)
 */

import { beforeEach, describe, expect, test } from 'bun:test';
import { createProjectsRouter } from '@/api/routers/projects.router';
import { ProjectStatus } from '@/project/domain/project.entity';

// Mock services
const mockProjectService = {
	create: async (data: { name: string; url: string }) => ({
		uuid: 'test-uuid-123',
		name: data.name,
		url: data.url,
		status: ProjectStatus.CREATED,
		createdAt: new Date(),
		updatedAt: new Date(),
	}),
	findByIdentifier: async (identifier: string) => {
		if (identifier === 'existing-project') {
			return {
				uuid: 'test-uuid-123',
				name: 'existing-project',
				url: 'https://example.com',
				status: ProjectStatus.COMPLETED,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
		}
		return null;
	},
	listAll: async () => [
		{
			uuid: 'uuid-1',
			name: 'project-1',
			status: ProjectStatus.CREATED,
			createdAt: new Date(),
		},
		{
			uuid: 'uuid-2',
			name: 'project-2',
			status: ProjectStatus.RUNNING,
			createdAt: new Date(),
		},
	],
};

describe('Projects Router', () => {
	let router: ReturnType<typeof createProjectsRouter>;

	beforeEach(() => {
		router = createProjectsRouter(mockProjectService as any);
	});

	test('create endpoint returns project data', async () => {
		const result = await router.create({
			name: 'test-project',
			url: 'https://example.com',
			fullScan: false,
		});

		expect(result.uuid).toBe('test-uuid-123');
		expect(result.name).toBe('test-project');
		expect(result.url).toBe('https://example.com');
		expect(result.status).toBe(ProjectStatus.CREATED);
	});

	test('get endpoint returns project by identifier', async () => {
		const result = await router.get({
			identifier: 'existing-project',
		});

		expect(result).not.toBeNull();
		expect(result?.name).toBe('existing-project');
		expect(result?.status).toBe(ProjectStatus.COMPLETED);
	});

	test('get endpoint returns null for non-existent project', async () => {
		const result = await router.get({
			identifier: 'non-existent',
		});

		expect(result).toBeNull();
	});

	test('list endpoint returns all projects', async () => {
		const result = await router.list();

		expect(result.projects).toHaveLength(2);
		expect(result.projects[0].name).toBe('project-1');
		expect(result.projects[1].name).toBe('project-2');
	});
});
