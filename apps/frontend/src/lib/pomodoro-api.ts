import axios from 'axios';
import { apiClient } from './api-client';
import { 
  PomodoroSession, 
  PomodoroTask,
  PomodoroConfig,
  CreatePomodoroSessionRequest,
  CreatePomodoroTaskRequest,
  UpdatePomodoroSessionRequest,
  UpdatePomodoroTaskRequest,
  UpdatePomodoroConfigRequest,
  PaginatedResponse
} from '@/types/pomodoro';

export async function getPomodoroSessions(page = 0, size = 20): Promise<PaginatedResponse<PomodoroSession>> {
  const response = await apiClient.get<PaginatedResponse<PomodoroSession>>(
    `/api/v1/pomodoro/sessions?page=${page}&size=${size}`
  );
  return response.data;
}

export async function getActiveSession(): Promise<PomodoroSession | null> {
  try {
    const response = await apiClient.get<PomodoroSession>('/api/v1/pomodoro/sessions/active');
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function createPomodoroSession(data: CreatePomodoroSessionRequest): Promise<PomodoroSession> {
  const response = await apiClient.post<PomodoroSession>('/api/v1/pomodoro/sessions', data);
  return response.data;
}

export async function updatePomodoroSession(
  sessionId: string, 
  data: UpdatePomodoroSessionRequest
): Promise<PomodoroSession> {
  const response = await apiClient.put<PomodoroSession>(`/api/v1/pomodoro/sessions/${sessionId}`, data);
  return response.data;
}

export async function createPomodoroTask(
  sessionId: string,
  data: CreatePomodoroTaskRequest
): Promise<PomodoroTask> {
  const response = await apiClient.post<PomodoroTask>(
    `/api/v1/pomodoro/sessions/${sessionId}/tasks`,
    data
  );
  return response.data;
}

export async function updatePomodoroTask(
  sessionId: string,
  taskId: string,
  data: UpdatePomodoroTaskRequest
): Promise<PomodoroTask> {
  const response = await apiClient.put<PomodoroTask>(
    `/api/v1/pomodoro/sessions/${sessionId}/tasks/${taskId}`,
    data
  );
  return response.data;
}

export async function deletePomodoroTask(sessionId: string, taskId: string): Promise<void> {
  await apiClient.delete(`/api/v1/pomodoro/sessions/${sessionId}/tasks/${taskId}`);
}

export async function getPomodoroConfig(): Promise<PomodoroConfig> {
  const response = await apiClient.get<PomodoroConfig>('/api/v1/pomodoro/config');
  return response.data;
}

export async function updatePomodoroConfig(data: UpdatePomodoroConfigRequest): Promise<PomodoroConfig> {
  const response = await apiClient.put<PomodoroConfig>('/api/v1/pomodoro/config', data);
  return response.data;
}

interface PomodoroStats {
  totalSessions: number;
  completedSessions: number;
  totalCycles: number;
  totalWorkTime: number;
  averageSessionDuration: number;
  completionRate: number;
  dailyStats?: Array<{
    date: string;
    sessions: number;
    cycles: number;
    workTime: number;
  }>;
}

export async function getSessionStats(period?: string): Promise<PomodoroStats> {
  const params = period ? `?period=${period}` : '';
  const response = await apiClient.get<PomodoroStats>(`/api/v1/pomodoro/stats${params}`);
  return response.data;
}

export const pomodoroApi = {
  getSessions: getPomodoroSessions,
  getActiveSession,
  createSession: createPomodoroSession,
  updateSession: updatePomodoroSession,
  createTask: createPomodoroTask,
  updateTask: updatePomodoroTask,
  deleteTask: deletePomodoroTask,
  getConfig: getPomodoroConfig,
  updateConfig: updatePomodoroConfig,
  getStats: getSessionStats
};