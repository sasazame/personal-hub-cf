import { apiClient } from './api';
import type {
  Goal,
  CreateGoalInput,
  UpdateGoalInput,
  GoalProgressInput,
  GoalQuery,
  PaginatedGoals,
  GoalWithProgress,
  GoalProgressType,
} from '@personal-hub/shared';

export const goalApi = {
  async create(data: CreateGoalInput): Promise<Goal> {
    const response = await apiClient.post<Goal>('/goals', data);
    return response.data;
  },

  async list(params?: Partial<GoalQuery>): Promise<PaginatedGoals> {
    const response = await apiClient.get<PaginatedGoals>('/goals', { params });
    return response.data;
  },

  async get(id: string): Promise<GoalWithProgress> {
    const response = await apiClient.get<GoalWithProgress>(`/goals/${id}`);
    return response.data;
  },

  async update(id: string, data: UpdateGoalInput): Promise<Goal> {
    const response = await apiClient.put<Goal>(`/goals/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/goals/${id}`);
  },

  async addProgress(id: string, data: GoalProgressInput): Promise<GoalProgressType> {
    const response = await apiClient.post<GoalProgressType>(`/goals/${id}/progress`, data);
    return response.data;
  },

  async deleteProgress(goalId: string, progressId: string): Promise<void> {
    await apiClient.delete(`/goals/${goalId}/progress/${progressId}`);
  },
};