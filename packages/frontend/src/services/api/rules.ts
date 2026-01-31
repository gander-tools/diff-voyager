/**
 * Rules API Service
 * Type-safe API client for rule management
 */

import type { apiContract, DiffType, RuleScope } from '@gander-tools/diff-voyager-shared';
import type { ClientInferResponseBody } from '@ts-rest/core';
import { tsRestClient } from './client';

export type Rule = ClientInferResponseBody<typeof apiContract.getRule, 200>;
export type CreateRuleInput = ClientInferResponseBody<typeof apiContract.createRule, 201>;

export const rulesApi = {
  /**
   * List all rules with optional filtering
   */
  async listRules(params?: {
    limit?: number;
    offset?: number;
    projectId?: string;
    scope?: RuleScope;
    active?: boolean;
  }) {
    const response = await tsRestClient.listRules({
      query: params || {},
    });

    if (response.status !== 200) {
      throw new Error('Failed to fetch rules');
    }

    return response.body;
  },

  /**
   * Get a single rule by ID
   */
  async getRule(ruleId: string) {
    const response = await tsRestClient.getRule({
      params: { ruleId },
    });

    if (response.status !== 200) {
      throw new Error('Failed to fetch rule');
    }

    return response.body;
  },

  /**
   * Create a new rule
   */
  async createRule(input: {
    projectId?: string;
    name: string;
    description?: string;
    scope: RuleScope;
    active: boolean;
    conditions: Array<{
      diffType: DiffType;
      cssSelector?: string;
      xpathSelector?: string;
      fieldPattern?: string;
      headerName?: string;
      valuePattern?: string;
    }>;
  }) {
    const response = await tsRestClient.createRule({
      body: input,
    });

    if (response.status !== 201) {
      throw new Error('Failed to create rule');
    }

    return response.body;
  },

  /**
   * Update an existing rule
   */
  async updateRule(
    ruleId: string,
    input: {
      name?: string;
      description?: string;
      active?: boolean;
      conditions?: Array<{
        diffType: DiffType;
        cssSelector?: string;
        xpathSelector?: string;
        fieldPattern?: string;
        headerName?: string;
        valuePattern?: string;
      }>;
    },
  ) {
    const response = await tsRestClient.updateRule({
      params: { ruleId },
      body: input,
    });

    if (response.status !== 200) {
      throw new Error('Failed to update rule');
    }

    return response.body;
  },

  /**
   * Delete a rule by ID
   */
  async deleteRule(ruleId: string) {
    const response = await tsRestClient.deleteRule({
      params: { ruleId },
      body: undefined,
    });

    if (response.status !== 204) {
      throw new Error('Failed to delete rule');
    }
  },
};
