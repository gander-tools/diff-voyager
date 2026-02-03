/**
 * Queue Module - Job Entity
 * Testing Methodology: Chicago School (using real Job instances)
 */

import { describe, expect, test } from 'bun:test';
import { Job, JobStatus, JobType } from '@/queue/domain/job.entity';

describe('Job Entity', () => {
	test('creates job with valid data', () => {
		const job = Job.create({
			type: JobType.SNAPSHOT_SINGLE,
			payload: { projectId: 'test-123', url: 'https://example.com' },
		});

		expect(job.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
		expect(job.type).toBe(JobType.SNAPSHOT_SINGLE);
		expect(job.status).toBe(JobStatus.PENDING);
		expect(job.payload).toEqual({ projectId: 'test-123', url: 'https://example.com' });
		expect(job.retryCount).toBe(0);
		expect(job.maxRetries).toBe(3);
		expect(job.createdAt).toBeInstanceOf(Date);
		expect(job.updatedAt).toBeInstanceOf(Date);
	});

	test('transitions to RUNNING status', () => {
		const job = Job.create({
			type: JobType.SNAPSHOT_SINGLE,
			payload: { url: 'https://example.com' },
		});
		const initialUpdatedAt = job.updatedAt;

		job.markAsRunning();

		expect(job.status).toBe(JobStatus.RUNNING);
		expect(job.updatedAt.getTime()).toBeGreaterThanOrEqual(initialUpdatedAt.getTime());
	});

	test('marks job as completed', () => {
		const job = Job.create({
			type: JobType.SNAPSHOT_SINGLE,
			payload: { url: 'https://example.com' },
		});
		job.markAsRunning();

		job.markAsCompleted();

		expect(job.status).toBe(JobStatus.COMPLETED);
	});

	test('marks job as failed', () => {
		const job = Job.create({
			type: JobType.SNAPSHOT_SINGLE,
			payload: { url: 'https://example.com' },
		});
		job.markAsRunning();

		job.markAsFailed();

		expect(job.status).toBe(JobStatus.FAILED);
	});

	test('increments retry count when marking for retry', () => {
		const job = Job.create({
			type: JobType.SNAPSHOT_SINGLE,
			payload: { url: 'https://example.com' },
		});
		job.markAsRunning();

		job.markForRetry();

		expect(job.status).toBe(JobStatus.RETRYING);
		expect(job.retryCount).toBe(1);
	});

	test('checks if job can be retried', () => {
		const job = Job.create({
			type: JobType.SNAPSHOT_SINGLE,
			payload: { url: 'https://example.com' },
			maxRetries: 2,
		});

		expect(job.canRetry()).toBe(true);

		job.markForRetry();
		expect(job.canRetry()).toBe(true);

		job.markForRetry();
		expect(job.canRetry()).toBe(false);
	});
});
