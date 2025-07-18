import { apiClient } from '../api';
import type {
  CreateNoteRequest,
  UpdateNoteRequest,
  ListNotesQuery,
  NoteResponse,
  NotesListResponse,
} from '@personal-hub/shared';

export const notesApi = {
  list: async (params?: ListNotesQuery): Promise<NotesListResponse> => {
    const response = await apiClient.get<NotesListResponse>('/api/notes', { params });
    return response.data;
  },

  get: async (id: string): Promise<NoteResponse> => {
    const response = await apiClient.get<NoteResponse>(`/api/notes/${id}`);
    return response.data;
  },

  create: async (data: CreateNoteRequest): Promise<NoteResponse> => {
    const response = await apiClient.post<NoteResponse>('/api/notes', data);
    return response.data;
  },

  update: async (id: string, data: UpdateNoteRequest): Promise<NoteResponse> => {
    const response = await apiClient.put<NoteResponse>(`/api/notes/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/notes/${id}`);
  },
};