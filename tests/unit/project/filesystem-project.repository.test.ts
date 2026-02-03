/**
 * Project Module - FilesystemProjectRepository
 * Testing Methodology: Chicago School (using real filesystem operations with temp directory)
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { Project, ProjectStatus } from '@/project/domain/project.entity';
import { FilesystemProjectRepository } from '@/project/infrastructure/filesystem-project.repository';

describe('FilesystemProjectRepository', () => {
	let repository: FilesystemProjectRepository;
	let testDataDir: string;

	beforeEach(() => {
		testDataDir = join(process.cwd(), 'data-test', `test-${Date.now()}`);
		mkdirSync(testDataDir, { recursive: true });
		repository = new FilesystemProjectRepository(testDataDir);
	});

	afterEach(() => {
		if (existsSync(testDataDir)) {
			rmSync(testDataDir, { recursive: true, force: true });
		}
	});

	test('saves project to filesystem', async () => {
		const project = Project.create({
			name: 'test-project',
			url: 'https://example.com',
		});

		await repository.save(project);

		const projectDir = join(testDataDir, 'projects', project.uuid);
		const projectFile = join(projectDir, 'project.json');

		expect(existsSync(projectFile)).toBe(true);
	});

	test('finds project by UUID', async () => {
		const project = Project.create({
			name: 'test-project',
			url: 'https://example.com',
		});
		await repository.save(project);

		const found = await repository.findByUuid(project.uuid);

		expect(found).not.toBeNull();
		expect(found?.uuid).toBe(project.uuid);
		expect(found?.name).toBe('test-project');
		expect(found?.url).toBe('https://example.com');
		expect(found?.status).toBe(ProjectStatus.CREATED);
	});

	test('returns null when project UUID not found', async () => {
		const found = await repository.findByUuid('non-existent-uuid');

		expect(found).toBeNull();
	});

	test('finds project by name', async () => {
		const project = Project.create({
			name: 'unique-name',
			url: 'https://example.com',
		});
		await repository.save(project);

		const found = await repository.findByName('unique-name');

		expect(found).not.toBeNull();
		expect(found?.name).toBe('unique-name');
	});

	test('returns null when project name not found', async () => {
		const found = await repository.findByName('non-existent-name');

		expect(found).toBeNull();
	});

	test('lists all projects', async () => {
		const project1 = Project.create({
			name: 'project-1',
			url: 'https://example1.com',
		});
		const project2 = Project.create({
			name: 'project-2',
			url: 'https://example2.com',
		});

		await repository.save(project1);
		await repository.save(project2);

		const projects = await repository.listAll();

		expect(projects).toHaveLength(2);
		expect(projects.map((p) => p.name)).toContain('project-1');
		expect(projects.map((p) => p.name)).toContain('project-2');
	});

	test('updates existing project', async () => {
		const project = Project.create({
			name: 'test-project',
			url: 'https://example.com',
		});
		await repository.save(project);

		project.updateStatus(ProjectStatus.RUNNING);
		await repository.save(project);

		const found = await repository.findByUuid(project.uuid);

		expect(found?.status).toBe(ProjectStatus.RUNNING);
	});
});
