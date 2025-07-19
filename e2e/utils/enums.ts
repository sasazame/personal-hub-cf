// Shared enum definitions for E2E tests
// These mirror the enums from @personal-hub/shared but are defined locally
// to avoid module resolution issues in Playwright tests

export const GoalTypes = {
  ANNUAL: 'ANNUAL',
  MONTHLY: 'MONTHLY',
  WEEKLY: 'WEEKLY',
  DAILY: 'DAILY',
} as const;

export const GoalStatuses = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type GoalType = typeof GoalTypes[keyof typeof GoalTypes];
export type GoalStatus = typeof GoalStatuses[keyof typeof GoalStatuses];