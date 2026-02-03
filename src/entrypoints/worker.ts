#!/usr/bin/env bun

import { JobType } from '@/queue/domain/job.entity';
import { InMemoryQueue } from '@/queue/infrastructure/in-memory-queue';

const POLL_INTERVAL = process.env.POLL_INTERVAL
	? Number.parseInt(process.env.POLL_INTERVAL, 10)
	: 5000;

class Worker {
	private isRunning = false;

	constructor(private readonly queue: InMemoryQueue) {}

	async start() {
		this.isRunning = true;
		console.log('Worker started, polling every', POLL_INTERVAL, 'ms');

		while (this.isRunning) {
			await this.processNextJob();
			await this.sleep(POLL_INTERVAL);
		}
	}

	stop() {
		this.isRunning = false;
		console.log('Worker stopped');
	}

	private async processNextJob() {
		const job = await this.queue.dequeue();

		if (!job) {
			// No jobs available
			return;
		}

		console.log(`Processing job ${job.id} (${job.type})`);

		try {
			// Simulate job processing
			if (job.type === JobType.SNAPSHOT_SINGLE) {
				await this.processSingleSnapshot(job.payload);
			} else if (job.type === JobType.SNAPSHOT_CRAWL) {
				await this.processFullCrawl(job.payload);
			}

			job.markAsCompleted();
			console.log(`Job ${job.id} completed`);
		} catch (error) {
			console.error(`Job ${job.id} failed:`, error);

			if (job.canRetry()) {
				job.markForRetry();
				console.log(`Job ${job.id} will be retried (attempt ${job.retryCount}/${job.maxRetries})`);
			} else {
				job.markAsFailed();
				console.log(`Job ${job.id} failed after ${job.maxRetries} retries`);
			}
		}
	}

	private async processSingleSnapshot(payload: unknown) {
		// Placeholder for Playwright single page snapshot
		console.log('Processing single snapshot:', payload);
		await this.sleep(100); // Simulate work
	}

	private async processFullCrawl(payload: unknown) {
		// Placeholder for Crawlee full site crawl
		console.log('Processing full crawl:', payload);
		await this.sleep(200); // Simulate work
	}

	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

// Start worker
const queue = new InMemoryQueue();
const worker = new Worker(queue);

// Graceful shutdown
process.on('SIGINT', () => {
	console.log('Received SIGINT, shutting down gracefully...');
	worker.stop();
	process.exit(0);
});

process.on('SIGTERM', () => {
	console.log('Received SIGTERM, shutting down gracefully...');
	worker.stop();
	process.exit(0);
});

worker.start().catch((error) => {
	console.error('Worker error:', error);
	process.exit(1);
});
