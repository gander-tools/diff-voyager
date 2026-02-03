/**
 * Queue Module - InMemoryQueue Implementation
 * Testing Methodology: Chicago School (using real queue instance)
 */

import { beforeEach, describe, expect, test } from 'bun:test';
import { Job, JobStatus, JobType } from '@/queue/domain/job.entity';
import { InMemoryQueue } from '@/queue/infrastructure/in-memory-queue';

describe('InMemoryQueue', () => {
	let queue: InMemoryQueue;

	beforeEach(() => {
		queue = new InMemoryQueue();
	});

	test('enqueues job and returns job ID', async () => {
		const job = Job.create({
			type: JobType.SNAPSHOT_SINGLE,
			payload: { url: 'https://example.com' },
		});

		const jobId = await queue.enqueue(job);

		expect(jobId).toBe(job.id);
		expect(jobId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
	});

	test('dequeues pending job and marks as running', async () => {
		const job = Job.create({
			type: JobType.SNAPSHOT_SINGLE,
			payload: { url: 'https://example.com' },
		});
		await queue.enqueue(job);

		const dequeuedJob = await queue.dequeue();

		expect(dequeuedJob).not.toBeNull();
		expect(dequeuedJob?.id).toBe(job.id);
		expect(dequeuedJob?.status).toBe(JobStatus.RUNNING);
	});

	test('returns null when queue is empty', async () => {
		const job = await queue.dequeue();

		expect(job).toBeNull();
	});

	test('retrieves job by ID', async () => {
		const job = Job.create({
			type: JobType.SNAPSHOT_SINGLE,
			payload: { url: 'https://example.com' },
		});
		await queue.enqueue(job);

		const retrievedJob = await queue.getJob(job.id);

		expect(retrievedJob).not.toBeNull();
		expect(retrievedJob?.id).toBe(job.id);
		expect(retrievedJob?.payload).toEqual({ url: 'https://example.com' });
	});

	test('returns null for non-existent job ID', async () => {
		const job = await queue.getJob('non-existent-id');

		expect(job).toBeNull();
	});

	test('lists all jobs', async () => {
		const job1 = Job.create({
			type: JobType.SNAPSHOT_SINGLE,
			payload: { url: 'https://example1.com' },
		});
		const job2 = Job.create({
			type: JobType.SNAPSHOT_CRAWL,
			payload: { url: 'https://example2.com' },
		});

		await queue.enqueue(job1);
		await queue.enqueue(job2);

		const jobs = await queue.listJobs();

		expect(jobs).toHaveLength(2);
		expect(jobs.map((j) => j.id)).toContain(job1.id);
		expect(jobs.map((j) => j.id)).toContain(job2.id);
	});

	test('filters jobs by status', async () => {
		const job1 = Job.create({
			type: JobType.SNAPSHOT_SINGLE,
			payload: { url: 'https://example1.com' },
		});
		const job2 = Job.create({
			type: JobType.SNAPSHOT_SINGLE,
			payload: { url: 'https://example2.com' },
		});

		await queue.enqueue(job1);
		await queue.enqueue(job2);
		await queue.dequeue(); // job1 becomes RUNNING

		const pendingJobs = await queue.listJobs({ status: JobStatus.PENDING });
		const runningJobs = await queue.listJobs({ status: JobStatus.RUNNING });

		expect(pendingJobs).toHaveLength(1);
		expect(pendingJobs[0].id).toBe(job2.id);
		expect(runningJobs).toHaveLength(1);
		expect(runningJobs[0].id).toBe(job1.id);
	});

	test('does not dequeue already running jobs', async () => {
		const job = Job.create({
			type: JobType.SNAPSHOT_SINGLE,
			payload: { url: 'https://example.com' },
		});
		await queue.enqueue(job);

		const firstDequeue = await queue.dequeue();
		const secondDequeue = await queue.dequeue();

		expect(firstDequeue?.id).toBe(job.id);
		expect(secondDequeue).toBeNull();
	});
});
