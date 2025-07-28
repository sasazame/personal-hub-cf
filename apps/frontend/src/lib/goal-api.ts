import { apiClient } from './api-client';
import { 
  Goal, 
  CreateGoalDto, 
  UpdateGoalDto,
  GoalProgress,
  RecordProgressDto,
  ToggleAchievementResponse,
  GoalWithStatus
} from '@/types/goal';

export async function getGoals(date?: string, filter?: string): Promise<GoalWithStatus[]> {
  const params = new URLSearchParams();
  if (date) params.append('date', date);
  if (filter) params.append('filter', filter);
  
  const queryString = params.toString();
  const url = `/api/v1/goals${queryString ? `?${queryString}` : ''}`;
  
  const response = await apiClient.get<GoalWithStatus[]>(url);
  return response.data;
}

export async function getGoal(id: number): Promise<Goal> {
  const response = await apiClient.get<Goal>(`/api/v1/goals/${id}`);
  return response.data;
}

export async function createGoal(data: CreateGoalDto): Promise<Goal> {
  const response = await apiClient.post<Goal>('/api/v1/goals', data);
  return response.data;
}

export async function updateGoal(id: number, data: UpdateGoalDto): Promise<Goal> {
  const response = await apiClient.put<Goal>(`/api/v1/goals/${id}`, data);
  return response.data;
}

export async function deleteGoal(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/goals/${id}`);
}

export async function getGoalProgress(goalId: number): Promise<GoalProgress[]> {
  const response = await apiClient.get<GoalProgress[]>(`/api/v1/goals/${goalId}/progress`);
  return response.data;
}

export async function recordProgress(goalId: number, data: RecordProgressDto): Promise<GoalProgress> {
  const response = await apiClient.post<GoalProgress>(`/api/v1/goals/${goalId}/progress`, data);
  return response.data;
}

export async function toggleAchievement(goalId: number, date: string): Promise<ToggleAchievementResponse> {
  const response = await apiClient.post<ToggleAchievementResponse>(
    `/api/v1/goals/${goalId}/toggle-achievement`,
    { date }
  );
  return response.data;
}

export async function getGoalStats(goalId: number): Promise<any> {
  const response = await apiClient.get<any>(`/api/v1/goals/${goalId}/stats`);
  return response.data;
}

export const goalApi = {
  getGoals,
  getGoal,
  createGoal,
  updateGoal,
  deleteGoal,
  getProgress: getGoalProgress,
  recordProgress,
  toggleAchievement,
  getStats: getGoalStats
};