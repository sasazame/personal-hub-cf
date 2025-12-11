import { apiClient } from './api-client'
import { TimelineEntry, TimelineFilters } from '@/types/timeline'

export async function getTimelineEntries(filters?: TimelineFilters): Promise<TimelineEntry[]> {
  const params = new URLSearchParams()
  if (filters?.fromDate) params.append('fromDate', filters.fromDate)
  if (filters?.toDate) params.append('toDate', filters.toDate)
  if (filters?.search) params.append('search', filters.search)
  if (filters?.category) params.append('category', filters.category)
  if (filters?.tag) params.append('tag', filters.tag)
  const query = params.toString()
  const url = `/api/v1/timeline${query ? `?${query}` : ''}`
  const res = await apiClient.get<TimelineEntry[]>(url)
  return res.data
}

export async function createTimelineEntry(data: TimelineEntry): Promise<TimelineEntry> {
  const res = await apiClient.post<TimelineEntry>('/api/v1/timeline', data)
  return res.data
}

export async function updateTimelineEntry(id: number, data: Partial<TimelineEntry>): Promise<TimelineEntry> {
  const res = await apiClient.put<TimelineEntry>(`/api/v1/timeline/${id}`, data)
  return res.data
}

export async function deleteTimelineEntry(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/timeline/${id}`)
}

export async function importEventToTimeline(eventId: number): Promise<TimelineEntry> {
  const res = await apiClient.post<TimelineEntry>(`/api/v1/timeline/import/${eventId}`)
  return res.data
}

export const timelineApi = {
  getTimelineEntries,
  createTimelineEntry,
  updateTimelineEntry,
  deleteTimelineEntry,
  importEventToTimeline,
}
