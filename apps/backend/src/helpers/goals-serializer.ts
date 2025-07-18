import type { GoalWithProgress } from '@personal-hub/shared';

interface SerializedGoal {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  targetValue: number;
  currentValue: number;
  unit: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export function serializeGoal(goal: any): SerializedGoal {
  return {
    id: goal.id,
    title: goal.title,
    description: goal.description,
    type: goal.type,
    status: goal.status,
    targetValue: goal.targetValue,
    currentValue: goal.currentValue,
    unit: goal.unit,
    startDate: goal.startDate ? goal.startDate.toISOString() : null,
    endDate: goal.endDate ? goal.endDate.toISOString() : null,
    createdAt: goal.createdAt.toISOString(),
    updatedAt: goal.updatedAt.toISOString(),
  };
}

export function serializeGoals(goals: any[]): SerializedGoal[] {
  return goals.map(serializeGoal);
}