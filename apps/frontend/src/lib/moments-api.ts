import { api } from './api';
import type {
  CreateMomentInput,
  UpdateMomentInput,
  MomentQuery,
  MomentResponse,
} from '@personal-hub/shared';

interface MomentsListResponse {
  items: MomentResponse[];
  total: number;
  limit: number;
  offset: number;
}

export const momentsApi = {
  list: async (query?: MomentQuery): Promise<MomentsListResponse> => {
    const response = await api.get('/api/moments', { params: query });
    return response.data;
  },

  get: async (id: string): Promise<MomentResponse> => {
    const response = await api.get(`/api/moments/${id}`);
    return response.data;
  },

  create: async (data: CreateMomentInput): Promise<MomentResponse> => {
    const response = await api.post('/api/moments', data);
    return response.data;
  },

  update: async (id: string, data: UpdateMomentInput): Promise<MomentResponse> => {
    const response = await api.patch(`/api/moments/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/moments/${id}`);
  },
};