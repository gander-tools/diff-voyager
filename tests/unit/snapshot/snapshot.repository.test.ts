/**
 * Snapshot Module - FilesystemSnapshotRepository
 * Testing Methodology: Chicago School (using real filesystem with temp directory)
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { Snapshot, SnapshotStatus } from '@/snapshot/domain/snapshot.entity';
import { FilesystemSnapshotRepository } from '@/snapshot/infrastructure/filesystem-snapshot.repository';

describe('FilesystemSnapshotRepository', () => {
	let repository: FilesystemSnapshotRepository;
	let testDataDir: string;

	beforeEach(() => {
		testDataDir = join(process.cwd(), 'data-test', `test-${Date.now()}`);
		mkdirSync(testDataDir, { recursive: true });
		repository = new FilesystemSnapshotRepository(testDataDir);
	});

	afterEach(() => {
		if (existsSync(testDataDir)) {
			rmSync(testDataDir, { recursive: true, force: true });
		}
	});

	test('saves snapshot metadata to filesystem', async () => {
		const snapshot = Snapshot.create({
			projectUuid: 'project-123',
			fullScan: false,
		});

		await repository.save('project-123', snapshot);

		const snapshotDir = join(testDataDir, 'projects', 'project-123', 'snapshots', snapshot.uuid);
		const indexFile = join(snapshotDir, 'index.json');

		expect(existsSync(snapshotDir)).toBe(true);
		expect(existsSync(indexFile)).toBe(true);
	});

	test('finds snapshot by UUID', async () => {
		const snapshot = Snapshot.create({
			projectUuid: 'project-123',
			fullScan: false,
		});
		await repository.save('project-123', snapshot);

		const found = await repository.findByUuid('project-123', snapshot.uuid);

		expect(found).not.toBeNull();
		expect(found?.uuid).toBe(snapshot.uuid);
		expect(found?.projectUuid).toBe('project-123');
		expect(found?.status).toBe(SnapshotStatus.PENDING);
	});

	test('returns null when snapshot not found', async () => {
		const found = await repository.findByUuid('project-123', 'non-existent');

		expect(found).toBeNull();
	});

	test('lists all snapshots for project', async () => {
		const snapshot1 = Snapshot.create({
			projectUuid: 'project-123',
			fullScan: false,
		});
		const snapshot2 = Snapshot.create({
			projectUuid: 'project-123',
			fullScan: true,
		});

		await repository.save('project-123', snapshot1);
		await repository.save('project-123', snapshot2);

		const snapshots = await repository.listByProject('project-123');

		expect(snapshots).toHaveLength(2);
		expect(snapshots.map((s) => s.uuid)).toContain(snapshot1.uuid);
		expect(snapshots.map((s) => s.uuid)).toContain(snapshot2.uuid);
	});

	test('updates existing snapshot', async () => {
		const snapshot = Snapshot.create({
			projectUuid: 'project-123',
			fullScan: false,
		});
		await repository.save('project-123', snapshot);

		snapshot.markAsInProgress();
		await repository.save('project-123', snapshot);

		const found = await repository.findByUuid('project-123', snapshot.uuid);

		expect(found?.status).toBe(SnapshotStatus.IN_PROGRESS);
	});
});
