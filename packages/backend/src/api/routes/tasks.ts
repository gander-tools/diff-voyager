/**
 * Task status API routes
 */

import type { Database } from 'better-sqlite3';
import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { TaskQueue } from '../../queue/task-queue.js';
import { DATABASE_READ_RATE_LIMIT } from '../middleware/rate-limiting.js';

interface TaskRoutesOptions extends FastifyPluginOptions {
  db: Database;
}

/**
 * Register task status routes
 */
export async function registerTaskRoutes(
  app: FastifyInstance,
  options: TaskRoutesOptions,
): Promise<void> {
  const { db } = options;
  const taskQueue = new TaskQueue(db);

  /**
   * GET /tasks/:taskId
   *
   * Get the status and details of a specific task
   */
  app.get(
    '/tasks/:taskId',
    {
      config: DATABASE_READ_RATE_LIMIT,
      schema: {
        tags: ['tasks'],
        description: 'Get task status and details',
        params: {
          type: 'object',
          properties: {
            taskId: {
              type: 'string',
              format: 'uuid',
              description: 'Task ID',
            },
          },
          required: ['taskId'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              type: { type: 'string' },
              status: {
                type: 'string',
                enum: ['pending', 'processing', 'completed', 'failed'],
              },
              priority: {
                type: 'string',
                enum: ['low', 'normal', 'high'],
              },
              payload: { type: 'object' },
              attempts: { type: 'number' },
              maxAttempts: { type: 'number' },
              error: { type: 'string', nullable: true },
              createdAt: { type: 'string', format: 'date-time' },
              startedAt: { type: 'string', format: 'date-time', nullable: true },
              completedAt: {
                type: 'string',
                format: 'date-time',
                nullable: true,
              },
            },
            required: [
              'id',
              'type',
              'status',
              'priority',
              'payload',
              'attempts',
              'maxAttempts',
              'createdAt',
            ],
          },
          404: {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { taskId } = request.params as { taskId: string };

      // Find task
      const task = taskQueue.findById(taskId);

      if (!task) {
        return reply.code(404).send({
          error: {
            code: 'NOT_FOUND',
            message: 'Task not found',
          },
        });
      }

      // Return task details
      return reply.send({
        id: task.id,
        type: task.type,
        status: task.status,
        priority: task.priority,
        payload: task.payload,
        attempts: task.attempts,
        maxAttempts: task.maxAttempts,
        error: task.error ?? null,
        createdAt: task.createdAt.toISOString(),
        startedAt: task.startedAt ? task.startedAt.toISOString() : null,
        completedAt: task.completedAt ? task.completedAt.toISOString() : null,
      });
    },
  );
}
