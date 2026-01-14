/**
 * Rule Repository Drizzle Implementation
 * Implements rule data access using Drizzle ORM
 */

import { randomUUID } from 'node:crypto';
import { RuleScope } from '@gander-tools/diff-voyager-shared';
import { and, count, desc, eq } from 'drizzle-orm';
import type { DrizzleDb } from '../drizzle/db.js';
import { rules } from '../drizzle/schema/index.js';
import type { IRuleRepository } from './interfaces/rule-repository.interface.js';
import type { CreateRuleInput, RuleEntity, UpdateRuleInput } from './rule-repository.js';

export class RuleRepositoryDrizzle implements IRuleRepository {
  constructor(private db: DrizzleDb) {}

  async create(input: CreateRuleInput): Promise<RuleEntity> {
    const id = randomUUID();
    const now = new Date().toISOString();

    await this.db.insert(rules).values({
      id,
      projectId: input.projectId || null,
      name: input.name,
      description: input.description || null,
      scope: input.scope,
      active: input.active,
      conditionsJson: JSON.stringify(input.conditions),
      createdAt: now,
      updatedAt: now,
    });

    return {
      id,
      projectId: input.projectId,
      name: input.name,
      description: input.description,
      scope: input.scope,
      active: input.active,
      conditions: input.conditions,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    };
  }

  async findById(id: string): Promise<RuleEntity | null> {
    const rows = await this.db.select().from(rules).where(eq(rules.id, id));

    if (rows.length === 0) {
      return null;
    }

    return this.rowToEntity(rows[0]);
  }

  async findAll(
    options: {
      limit?: number;
      offset?: number;
      projectId?: string;
      scope?: 'global' | 'project';
      active?: boolean;
    } = {},
  ): Promise<{ rules: RuleEntity[]; total: number }> {
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    // Build where conditions
    const whereConditions = [];
    if (options.projectId !== undefined) {
      whereConditions.push(eq(rules.projectId, options.projectId));
    }
    if (options.scope !== undefined) {
      whereConditions.push(eq(rules.scope, options.scope));
    }
    if (options.active !== undefined) {
      whereConditions.push(eq(rules.active, options.active));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get total count
    const countResult = await this.db
      .select({ count: count() })
      .from(rules)
      .where(whereClause);
    const total = countResult[0].count;

    // Get paginated rules (newest first)
    const rows = await this.db
      .select()
      .from(rules)
      .where(whereClause)
      .orderBy(desc(rules.createdAt))
      .limit(limit)
      .offset(offset);

    const ruleEntities = rows.map((row) => this.rowToEntity(row));

    return { rules: ruleEntities, total };
  }

  async update(id: string, input: UpdateRuleInput): Promise<RuleEntity> {
    const now = new Date().toISOString();

    const updateData: Partial<typeof rules.$inferInsert> = {
      updatedAt: now,
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.active !== undefined) updateData.active = input.active;
    if (input.conditions !== undefined) {
      updateData.conditionsJson = JSON.stringify(input.conditions);
    }

    await this.db.update(rules).set(updateData).where(eq(rules.id, id));

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Rule ${id} not found after update`);
    }

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(rules).where(eq(rules.id, id));
    return result.changes > 0;
  }

  /**
   * Convert database row to RuleEntity
   */
  private rowToEntity(row: typeof rules.$inferSelect): RuleEntity {
    return {
      id: row.id,
      projectId: row.projectId || undefined,
      name: row.name,
      description: row.description || undefined,
      scope: row.scope as RuleScope,
      active: Boolean(row.active),
      conditions: JSON.parse(row.conditionsJson),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }
}
