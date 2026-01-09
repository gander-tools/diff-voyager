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
  name: z.string().trim().min(1, 'validation.required').max(100, 'validation.maxLength'),
  url: z.string().url('validation.invalidUrl'),
  description: z.string().max(500, 'validation.maxLength').optional(),

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
