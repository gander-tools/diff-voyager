/**
 * Zod validation schemas for forms
 * Used for client-side validation with type inference
 */

import { z } from 'zod';

/**
 * Schema for creating a new project
 * Matches backend API expectations with additional client-side validation
 */
export const createProjectSchema = z.object({
  // Basic info
  name: z.string().trim().max(100, 'Maximum 100 characters').optional(),
  url: z.string().url('Invalid URL format'),
  description: z.string().max(500, 'Maximum 500 characters').optional(),

  // Crawl settings
  crawl: z.boolean().default(false),
  maxPages: z.number().int().min(1, 'validation.minValue').optional(),

  // Run profile
  viewport: z
    .object({
      width: z.number().int().min(320).max(3840),
      height: z.number().int().min(240).max(2160),
    })
    .default({ width: 1920, height: 1080 }),

  collectHar: z.boolean().default(false),
  waitAfterLoad: z.number().int().min(0).max(30000).default(1000),
  visualDiffThreshold: z.number().min(0).max(1).default(0.01),
});

/**
 * Type inference from schema
 */
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

/**
 * Schema for creating a new run
 * Matches backend API expectations for creating a comparison run
 */
export const createRunSchema = z.object({
  // URL to scan
  url: z.string().url('Invalid URL format'),

  // Run profile
  viewport: z
    .object({
      width: z.number().int().min(320).max(3840),
      height: z.number().int().min(240).max(2160),
    })
    .default({ width: 1920, height: 1080 }),

  collectHar: z.boolean().default(false),
  waitAfterLoad: z.number().int().min(0).max(30000).default(1000),
});

/**
 * Type inference from schema
 */
export type CreateRunInput = z.infer<typeof createRunSchema>;
