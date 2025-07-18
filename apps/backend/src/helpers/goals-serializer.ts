
interface SerializedGoal {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  targetValue: number | null;
  currentValue: number | null;
  unit: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  [key: string]: string | number | boolean | null;
}

interface GoalRecord {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  targetValue: number | null;
  currentValue: number | null;
  unit: string | null;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function serializeGoal(goal: GoalRecord): SerializedGoal {
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

export function serializeGoals(goals: GoalRecord[]): SerializedGoal[] {
  return goals.map(serializeGoal);
}