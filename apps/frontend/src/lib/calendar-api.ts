import { apiClient } from './api-client';
import { 
  CalendarEvent, 
  CreateCalendarEventDto, 
  UpdateCalendarEventDto,
  EventFilters 
} from '@/types/calendar';

// const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8787';

export async function getCalendarEvents(filters?: EventFilters): Promise<CalendarEvent[]> {
  const params = new URLSearchParams();
  
  if (filters) {
    if (filters.year) params.append('year', filters.year.toString());
    if (filters.month) params.append('month', filters.month.toString());
    const fromDate = filters.fromDate || filters.startDate;
    const toDate = filters.toDate || filters.endDate;
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    if (filters.search) params.append('search', filters.search);
    if (filters.category) params.append('category', filters.category);
  }
  
  const queryString = params.toString();
  const url = `/api/v1/events${queryString ? `?${queryString}` : ''}`;
  
  const response = await apiClient.get<CalendarEvent[]>(url);
  return response.data;
}

export async function getCalendarEvent(id: number): Promise<CalendarEvent> {
  const response = await apiClient.get<CalendarEvent>(`/api/v1/events/${id}`);
  return response.data;
}

export async function createCalendarEvent(data: CreateCalendarEventDto): Promise<CalendarEvent> {
  const response = await apiClient.post<CalendarEvent>('/api/v1/events', data);
  return response.data;
}

export async function updateCalendarEvent(id: number, data: UpdateCalendarEventDto): Promise<CalendarEvent> {
  const response = await apiClient.put<CalendarEvent>(`/api/v1/events/${id}`, data);
  return response.data;
}

export async function deleteCalendarEvent(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/events/${id}`);
}

export async function syncWithGoogleCalendar(): Promise<{ synced: number; failed: number }> {
  const response = await apiClient.post<{ synced: number; failed: number }>('/api/v1/events/sync');
  return response.data;
}

interface GoogleCalendar {
  id: string;
  name: string;
  primary?: boolean;
}

export async function getGoogleCalendarSettings(): Promise<{ enabled: boolean; calendars: GoogleCalendar[] }> {
  const response = await apiClient.get<{ enabled: boolean; calendars: GoogleCalendar[] }>('/api/v1/events/google/settings');
  return response.data;
}

export async function updateGoogleCalendarSettings(settings: { enabled: boolean; calendarId?: string }): Promise<void> {
  await apiClient.put('/api/v1/events/google/settings', settings);
}

export const calendarApi = {
  getEvents: getCalendarEvents,
  getEvent: getCalendarEvent,
  createEvent: createCalendarEvent,
  updateEvent: updateCalendarEvent,
  deleteEvent: deleteCalendarEvent,
  syncWithGoogle: syncWithGoogleCalendar,
  getGoogleSettings: getGoogleCalendarSettings,
  updateGoogleSettings: updateGoogleCalendarSettings
};
