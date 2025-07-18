import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

// React Query hooks
export const useEvents = (params?: ListEventsQuery) => {
  return useQuery({
    queryKey: ['events', params],
    queryFn: () => eventsApi.list(params),
  });
};

export const useEvent = (id: string) => {
  return useQuery({
    queryKey: ['events', id],
    queryFn: () => eventsApi.get(id),
    enabled: !!id,
  });
};

export const useCreateEventMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: eventsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
};

export const useUpdateEventMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEventRequest }) => eventsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['events', id] });
    },
  });
};

export const useDeleteEventMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: eventsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
};