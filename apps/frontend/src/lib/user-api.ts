import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8787',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
    const response = await api.get('/users/profile');
    return response.data;
  },

  updateProfile: async (data: UpdateProfileDto): Promise<UserProfile> => {
    const response = await api.put('/users/profile', data);
    return response.data;
  },

  uploadAvatar: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await api.post('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updatePassword: async (data: UpdatePasswordDto): Promise<void> => {
    await api.put('/users/password', data);
  },

  getSettings: async (): Promise<UserSettings> => {
    const response = await api.get('/users/settings');
    return response.data;
  },

  updateSettings: async (settings: Partial<UserSettings>): Promise<UserSettings> => {
    const response = await api.put('/users/settings', settings);
    return response.data;
  },

  deleteAccount: async (password: string): Promise<void> => {
    await api.delete('/users/account', { data: { password } });
  },
};