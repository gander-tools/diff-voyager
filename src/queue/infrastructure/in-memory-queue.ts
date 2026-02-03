import type { Job } from '@/queue/domain/job.entity';
import { JobStatus } from '@/queue/domain/job.entity';

export interface JobFilter {
	status?: JobStatus;
}

export class InMemoryQueue {
	private jobs: Map<string, Job> = new Map();

	async enqueue(job: Job): Promise<string> {
		this.jobs.set(job.id, job);
		return job.id;
	}

	async dequeue(): Promise<Job | null> {
		for (const job of this.jobs.values()) {
			if (job.status === JobStatus.PENDING) {
				job.markAsRunning();
				return job;
			}
		}
		return null;
	}

	async getJob(jobId: string): Promise<Job | null> {
		return this.jobs.get(jobId) ?? null;
	}

	async listJobs(filter?: JobFilter): Promise<Job[]> {
		const allJobs = Array.from(this.jobs.values());

		if (!filter?.status) {
			return allJobs;
		}

		return allJobs.filter((job) => job.status === filter.status);
	}
}
