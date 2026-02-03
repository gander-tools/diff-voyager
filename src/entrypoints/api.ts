import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import Fastify from 'fastify';
import { createProjectsRouter } from '@/api/routers/projects.router';
import { createSnapshotsRouter } from '@/api/routers/snapshots.router';
import { FilesystemProjectRepository } from '@/project/infrastructure/filesystem-project.repository';
import { ProjectService } from '@/project/services/project.service';
import { FilesystemSnapshotRepository } from '@/snapshot/infrastructure/filesystem-snapshot.repository';
import { SnapshotService } from '@/snapshot/services/snapshot.service';

const PORT = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3000;
const HOST = process.env.HOST || '0.0.0.0';
const DATA_DIR = process.env.DATA_DIR || './data';

async function startServer() {
	const fastify = Fastify({
		logger: true,
	});

	// Middleware
	await fastify.register(cors, {
		origin: true,
	});

	await fastify.register(rateLimit, {
		max: 100,
		timeWindow: '1 minute',
	});

	// Initialize repositories
	const projectRepository = new FilesystemProjectRepository(DATA_DIR);
	const snapshotRepository = new FilesystemSnapshotRepository(DATA_DIR);

	// Initialize services
	const projectService = new ProjectService(projectRepository);
	const snapshotService = new SnapshotService(snapshotRepository);

	// Create routers
	const projectsRouter = createProjectsRouter(projectService);
	const snapshotsRouter = createSnapshotsRouter(snapshotService);

	// Routes
	fastify.post('/api/projects', async (request, reply) => {
		const body = request.body as { name: string; url: string; fullScan?: boolean };
		const result = await projectsRouter.create(body);
		return reply.code(201).send(result);
	});

	fastify.get('/api/projects/:identifier', async (request, reply) => {
		const { identifier } = request.params as { identifier: string };
		const result = await projectsRouter.get({ identifier });
		if (!result) {
			return reply.code(404).send({ error: 'Project not found' });
		}
		return reply.send(result);
	});

	fastify.get('/api/projects', async (_request, reply) => {
		const result = await projectsRouter.list();
		return reply.send(result);
	});

	fastify.post('/api/snapshots', async (request, reply) => {
		const body = request.body as { projectId: string; fullScan: boolean };
		const result = await snapshotsRouter.create(body);
		return reply.code(201).send(result);
	});

	// Health check
	fastify.get('/health', async () => {
		return { status: 'ok', timestamp: new Date().toISOString() };
	});

	// Start server
	try {
		await fastify.listen({ port: PORT, host: HOST });
		fastify.log.info(`API server running on http://${HOST}:${PORT}`);
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
}

startServer();
