/**
 * Project Module - Project Entity
 * Testing Methodology: Chicago School (using real Project instances)
 */

import { describe, expect, test } from 'bun:test';
import { Project, ProjectStatus } from '@/project/domain/project.entity';

describe('Project Entity', () => {
	test('creates project with valid data', () => {
		const project = Project.create({
			name: 'my-website',
			url: 'https://example.com',
		});

		expect(project.uuid).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
		);
		expect(project.name).toBe('my-website');
		expect(project.url).toBe('https://example.com');
		expect(project.status).toBe(ProjectStatus.CREATED);
		expect(project.createdAt).toBeInstanceOf(Date);
		expect(project.updatedAt).toBeInstanceOf(Date);
	});

	test('validates name format - rejects invalid characters', () => {
		expect(() => {
			Project.create({
				name: 'invalid name!',
				url: 'https://example.com',
			});
		}).toThrow('Name must be alphanumeric with dashes and underscores only');
	});

	test('validates name format - accepts valid characters', () => {
		const project = Project.create({
			name: 'valid-name_123',
			url: 'https://example.com',
		});

		expect(project.name).toBe('valid-name_123');
	});

	test('validates name is required', () => {
		expect(() => {
			Project.create({
				name: '',
				url: 'https://example.com',
			});
		}).toThrow('Name is required');
	});

	test('validates name length - rejects too long', () => {
		expect(() => {
			Project.create({
				name: 'a'.repeat(101),
				url: 'https://example.com',
			});
		}).toThrow('Name must be 100 characters or less');
	});

	test('validates URL format', () => {
		expect(() => {
			Project.create({
				name: 'test',
				url: 'not-a-url',
			});
		}).toThrow('Invalid URL format');
	});

	test('validates URL requires http/https protocol', () => {
		expect(() => {
			Project.create({
				name: 'test',
				url: 'ftp://example.com',
			});
		}).toThrow('URL must use http or https protocol');
	});

	test('updates project status', () => {
		const project = Project.create({
			name: 'test',
			url: 'https://example.com',
		});
		const initialUpdatedAt = project.updatedAt;

		project.updateStatus(ProjectStatus.RUNNING);

		expect(project.status).toBe(ProjectStatus.RUNNING);
		expect(project.updatedAt.getTime()).toBeGreaterThanOrEqual(initialUpdatedAt.getTime());
	});
});
