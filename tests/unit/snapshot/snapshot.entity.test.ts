/**
 * Snapshot Module - Snapshot Entity
 * Testing Methodology: Chicago School (using real Snapshot instances)
 */

import { describe, expect, test } from 'bun:test';
import { Snapshot, SnapshotStatus } from '@/snapshot/domain/snapshot.entity';

describe('Snapshot Entity', () => {
	test('creates snapshot with valid data', () => {
		const snapshot = Snapshot.create({
			projectUuid: 'project-123',
			fullScan: false,
		});

		expect(snapshot.uuid).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
		);
		expect(snapshot.projectUuid).toBe('project-123');
		expect(snapshot.fullScan).toBe(false);
		expect(snapshot.status).toBe(SnapshotStatus.PENDING);
		expect(snapshot.createdAt).toBeInstanceOf(Date);
		expect(snapshot.updatedAt).toBeInstanceOf(Date);
	});

	test('creates full scan snapshot', () => {
		const snapshot = Snapshot.create({
			projectUuid: 'project-123',
			fullScan: true,
		});

		expect(snapshot.fullScan).toBe(true);
	});

	test('transitions to IN_PROGRESS status', () => {
		const snapshot = Snapshot.create({
			projectUuid: 'project-123',
			fullScan: false,
		});

		snapshot.markAsInProgress();

		expect(snapshot.status).toBe(SnapshotStatus.IN_PROGRESS);
	});

	test('marks snapshot as completed', () => {
		const snapshot = Snapshot.create({
			projectUuid: 'project-123',
			fullScan: false,
		});
		snapshot.markAsInProgress();

		snapshot.markAsCompleted();

		expect(snapshot.status).toBe(SnapshotStatus.COMPLETED);
	});

	test('marks snapshot as failed', () => {
		const snapshot = Snapshot.create({
			projectUuid: 'project-123',
			fullScan: false,
		});
		snapshot.markAsInProgress();

		snapshot.markAsFailed();

		expect(snapshot.status).toBe(SnapshotStatus.FAILED);
	});

	test('marks snapshot as partial (completed with errors)', () => {
		const snapshot = Snapshot.create({
			projectUuid: 'project-123',
			fullScan: false,
		});
		snapshot.markAsInProgress();

		snapshot.markAsPartial();

		expect(snapshot.status).toBe(SnapshotStatus.PARTIAL);
	});
});
