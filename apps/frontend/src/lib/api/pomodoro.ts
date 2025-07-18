import { api } from '../api';
import type {
  CreateSessionRequest,
  UpdateSessionRequest,
  ListSessionsQuery,
  SessionResponse,
  ConfigResponse,
  UpdateConfigRequest,
  SessionStatsResponse,
  SessionsListResponse,
} from '@personal-hub/shared';

export const pomodoroApi = {
  // Config
  getConfig: () => api.get<ConfigResponse>('/api/pomodoro/config'),
  
  updateConfig: (data: UpdateConfigRequest) =>
    api.put<ConfigResponse>('/api/pomodoro/config', data),

  // Sessions
  createSession: (data: CreateSessionRequest) =>
    api.post<SessionResponse>('/api/pomodoro/sessions', data),

  getSessions: (params: ListSessionsQuery) =>
    api.get<SessionsListResponse>('/api/pomodoro/sessions', { params }),

  getSession: (id: string) =>
    api.get<SessionResponse>(`/api/pomodoro/sessions/${id}`),

  updateSession: (id: string, data: UpdateSessionRequest) =>
    api.put<SessionResponse>(`/api/pomodoro/sessions/${id}`, data),

  getActiveSession: () =>
    api.get<SessionResponse>('/api/pomodoro/sessions/active'),

  // Stats
  getStats: (days = 7) =>
    api.get<SessionStatsResponse>('/api/pomodoro/stats', { params: { days } }),
};