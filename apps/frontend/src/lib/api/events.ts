import {
  type CreateEventRequest,
  type UpdateEventRequest,
  type ListEventsQuery,
  type EventResponse,
  type EventsListResponse,
} from '@personal-hub/shared';
import { apiClient } from '../api';

export const eventsApi = {
  list: async (params?: ListEventsQuery): Promise<EventsListResponse> => {
    const response = await apiClient.get<EventsListResponse>('/api/events', { params });
    return response.data;
  },

  get: async (id: string): Promise<EventResponse> => {
    const response = await apiClient.get<EventResponse>(`/api/events/${id}`);
    return response.data;
  },

  create: async (event: CreateEventRequest): Promise<EventResponse> => {
    const response = await apiClient.post<EventResponse>('/api/events', event);
    return response.data;
  },

  update: async (id: string, updates: UpdateEventRequest): Promise<EventResponse> => {
    const response = await apiClient.put<EventResponse>(`/api/events/${id}`, updates);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/events/${id}`);
  },
};