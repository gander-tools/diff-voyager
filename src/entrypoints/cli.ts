#!/usr/bin/env bun

import { Command } from 'commander';

const DEFAULT_API_URL = process.env.API_URL || 'http://localhost:3000';

class ApiClient {
	constructor(private readonly baseUrl: string) {}

	async createProject(data: { name: string; url: string; fullScan?: boolean }) {
		const response = await fetch(`${this.baseUrl}/api/projects`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`API error: ${response.statusText}`);
		}

		return await response.json();
	}

	async getProject(identifier: string) {
		const response = await fetch(`${this.baseUrl}/api/projects/${identifier}`);

		if (response.status === 404) {
			return null;
		}

		if (!response.ok) {
			throw new Error(`API error: ${response.statusText}`);
		}

		return await response.json();
	}

	async listProjects() {
		const response = await fetch(`${this.baseUrl}/api/projects`);

		if (!response.ok) {
			throw new Error(`API error: ${response.statusText}`);
		}

		return await response.json();
	}

	async createSnapshot(data: { projectId: string; fullScan: boolean }) {
		const response = await fetch(`${this.baseUrl}/api/snapshots`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`API error: ${response.statusText}`);
		}

		return await response.json();
	}
}

const program = new Command();

program
	.name('console')
	.description('Diff Voyager CLI - Visual regression testing platform')
	.version('0.1.0')
	.option('--api <url>', 'API server URL', DEFAULT_API_URL);

// Project commands
const projectCmd = program.command('project').description('Manage projects');

projectCmd
	.command('create <name> <url>')
	.description('Create a new project')
	.option('--full', 'Crawl entire domain')
	.option('--single', 'Single page snapshot (default)')
	.action(async (name: string, url: string, options: { full?: boolean; single?: boolean }) => {
		const apiUrl = program.opts().api || DEFAULT_API_URL;
		const client = new ApiClient(apiUrl);

		try {
			const result = await client.createProject({
				name,
				url,
				fullScan: !!options.full,
			});

			console.log('Project created successfully:');
			console.log(JSON.stringify(result, null, 2));
		} catch (error) {
			console.error('Error creating project:', error);
			process.exit(1);
		}
	});

projectCmd
	.command('get <identifier>')
	.description('Get project by UUID or name')
	.action(async (identifier: string) => {
		const apiUrl = program.opts().api || DEFAULT_API_URL;
		const client = new ApiClient(apiUrl);

		try {
			const result = await client.getProject(identifier);

			if (!result) {
				console.error('Project not found:', identifier);
				process.exit(1);
			}

			console.log(JSON.stringify(result, null, 2));
		} catch (error) {
			console.error('Error fetching project:', error);
			process.exit(1);
		}
	});

projectCmd
	.command('list')
	.description('List all projects')
	.action(async () => {
		const apiUrl = program.opts().api || DEFAULT_API_URL;
		const client = new ApiClient(apiUrl);

		try {
			const result = await client.listProjects();

			if (result.projects.length === 0) {
				console.log('No projects found.');
				return;
			}

			console.log(`Found ${result.projects.length} project(s):`);
			console.log(JSON.stringify(result.projects, null, 2));
		} catch (error) {
			console.error('Error listing projects:', error);
			process.exit(1);
		}
	});

// Snapshot commands
const snapshotCmd = program.command('snapshot').description('Manage snapshots');

snapshotCmd
	.command('create <project>')
	.description('Create a new snapshot for a project')
	.option('--full', 'Crawl entire domain')
	.option('--single', 'Single page snapshot (default)')
	.action(async (project: string, options: { full?: boolean; single?: boolean }) => {
		const apiUrl = program.opts().api || DEFAULT_API_URL;
		const client = new ApiClient(apiUrl);

		try {
			const result = await client.createSnapshot({
				projectId: project,
				fullScan: !!options.full,
			});

			console.log('Snapshot queued successfully:');
			console.log(JSON.stringify(result, null, 2));
		} catch (error) {
			console.error('Error creating snapshot:', error);
			process.exit(1);
		}
	});

program.parse();
