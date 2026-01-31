/**
 * Zod validation schemas for forms
 * Used for client-side validation with type inference
 */

import { DiffType, RuleScope } from '@gander-tools/diff-voyager-shared';
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

/**
 * Schema for a single rule condition
 * Each condition filters diffs based on type and optional selectors/patterns
 */
export const ruleConditionSchema = z.object({
  diffType: z.nativeEnum(DiffType, {
    errorMap: () => ({ message: 'Please select a diff type' }),
  }),
  cssSelector: z.string().trim().optional(),
  xpathSelector: z.string().trim().optional(),
  fieldPattern: z.string().trim().optional(),
  headerName: z.string().trim().optional(),
  valuePattern: z.string().trim().optional(),
});

/**
 * Type inference from schema
 */
export type RuleConditionInput = z.infer<typeof ruleConditionSchema>;

/**
 * Schema for rule condition builder
 * Supports multiple conditions with AND/OR logic
 */
export const ruleConditionBuilderSchema = z.object({
  operator: z.enum(['AND', 'OR']).default('AND'),
  conditions: z.array(ruleConditionSchema).min(1, 'At least one condition is required'),
});

/**
 * Type inference from schema
 */
export type RuleConditionBuilderInput = z.infer<typeof ruleConditionBuilderSchema>;

/**
 * Schema for creating a new mute rule
 * Includes name, description, scope, and conditions
 */
export const createRuleSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Maximum 100 characters'),
  description: z.string().trim().max(500, 'Maximum 500 characters').optional(),
  scope: z.nativeEnum(RuleScope, {
    errorMap: () => ({ message: 'Please select a scope' }),
  }),
  active: z.boolean().default(true),
  conditions: ruleConditionBuilderSchema,
});

/**
 * Type inference from schema
 */
export type CreateRuleInput = z.infer<typeof createRuleSchema>;

/**
 * Schema for application settings
 * Manages default values for scans, appearance, and general configuration
 */
export const settingsSchema = z.object({
  // General settings
  language: z.enum(['en', 'pl']).default('en'),
  dataDirectory: z.string().trim().optional(),

  // Default scan settings
  defaultViewport: z
    .object({
      width: z.number().int().min(320).max(3840),
      height: z.number().int().min(240).max(2160),
    })
    .default({ width: 1920, height: 1080 }),

  defaultVisualDiffThreshold: z.number().min(0).max(1).default(0.01),
  defaultMaxPages: z.number().int().min(1).max(10000).default(100),
  defaultCollectHar: z.boolean().default(false),
  defaultWaitAfterLoad: z.number().int().min(0).max(30000).default(1000),

  // Appearance settings
  theme: z.enum(['light', 'dark', 'auto']).default('auto'),
  compactMode: z.boolean().default(false),
});

/**
 * Type inference from schema
 */
export type SettingsInput = z.infer<typeof settingsSchema>;
