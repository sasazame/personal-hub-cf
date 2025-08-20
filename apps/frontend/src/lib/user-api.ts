import { apiClient } from './api-client';

// Base path for all user API endpoints
const USERS_BASE = '/api/v1/users';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'ja' | 'en';
  timezone: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  pomodoroSound: boolean;
  pomodoroVolume: number;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  weekStartsOn: 0 | 1 | 6; // Sunday, Monday, Saturday
}

export interface FeaturePreferences {
  todos: boolean;
  goals: boolean;
  pomodoro: boolean;
  calendar: boolean;
  notes: boolean;
  moments: boolean;
  analytics: boolean;
}

export interface UpdateProfileDto {
  username?: string;
  email?: string;
  bio?: string;
  avatar?: string;
}

export interface UpdatePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export const userApi = {
  getProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get(`${USERS_BASE}/profile`);
    return response.data;
  },

  updateProfile: async (data: UpdateProfileDto): Promise<UserProfile> => {
    const response = await apiClient.put(`${USERS_BASE}/profile`, data);
    return response.data;
  },

  uploadAvatar: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    // Let axios set the Content-Type header with proper boundary for FormData
    const response = await apiClient.post(`${USERS_BASE}/avatar`, formData);
    return response.data;
  },

  updatePassword: async (data: UpdatePasswordDto): Promise<void> => {
    await apiClient.put(`${USERS_BASE}/password`, data);
  },

  getSettings: async (): Promise<UserSettings> => {
    const response = await apiClient.get(`${USERS_BASE}/settings`);
    return response.data;
  },

  updateSettings: async (settings: Partial<UserSettings>): Promise<UserSettings> => {
    const response = await apiClient.put(`${USERS_BASE}/settings`, settings);
    return response.data;
  },

  deleteAccount: async (password: string): Promise<void> => {
    await apiClient.delete(`${USERS_BASE}/account`, { data: { password } });
  },

  getFeaturePreferences: async (): Promise<FeaturePreferences> => {
    const response = await apiClient.get(`${USERS_BASE}/feature-preferences`);
    return response.data;
  },

  updateFeaturePreferences: async (preferences: Partial<FeaturePreferences>): Promise<FeaturePreferences> => {
    const response = await apiClient.put(`${USERS_BASE}/feature-preferences`, preferences);
    return response.data;
  },
};