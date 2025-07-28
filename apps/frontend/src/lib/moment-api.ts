import { Moment, CreateMomentDto, UpdateMomentDto, MomentFilters, MomentPage } from '@/types/moment';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787';

export function getAuthHeaders() {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

export async function fetchMoments(page = 0, size = 20): Promise<MomentPage> {
  const response = await fetch(`${API_BASE_URL}/api/v1/moments?page=${page}&size=${size}`, {
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch moments: ${response.statusText}`);
  }
  
  return response.json();
}

export async function fetchAllMoments(): Promise<Moment[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/moments/all`, {
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch all moments: ${response.statusText}`);
  }
  
  return response.json();
}

export async function fetchMomentById(id: number): Promise<Moment> {
  const response = await fetch(`${API_BASE_URL}/api/v1/moments/${id}`, {
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch moment: ${response.statusText}`);
  }
  
  return response.json();
}

export async function searchMoments(query: string, tag?: string): Promise<Moment[]> {
  const params = new URLSearchParams({ query });
  if (tag) params.append('tag', tag);
  
  const response = await fetch(`${API_BASE_URL}/api/v1/moments/search?${params}`, {
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    throw new Error(`Failed to search moments: ${response.statusText}`);
  }
  
  return response.json();
}

export async function fetchMomentsByTag(tag: string): Promise<Moment[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/moments/tag/${encodeURIComponent(tag)}`, {
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch moments by tag: ${response.statusText}`);
  }
  
  return response.json();
}

export async function fetchMomentsByDateRange(startDate: string, endDate: string, page = 0, size = 20): Promise<MomentPage> {
  const params = new URLSearchParams({
    startDate,
    endDate,
    page: page.toString(),
    size: size.toString()
  });
  
  const response = await fetch(`${API_BASE_URL}/api/v1/moments/range?${params}`, {
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch moments by date range: ${response.statusText}`);
  }
  
  return response.json();
}

export async function fetchRecentMoments(limit = 10): Promise<Moment[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/moments/recent?limit=${limit}`, {
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch recent moments: ${response.statusText}`);
  }
  
  return response.json();
}

export async function fetchTodaysMoments(): Promise<Moment[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/moments/today`, {
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch today's moments: ${response.statusText}`);
  }
  
  return response.json();
}

export async function fetchMomentTags(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/moments/tags`, {
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch moment tags: ${response.statusText}`);
  }
  
  return response.json();
}

export async function fetchDefaultMomentTags(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/moments/tags/default`, {
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch default moment tags: ${response.statusText}`);
  }
  
  return response.json();
}

export async function createMoment(data: CreateMomentDto): Promise<Moment> {
  const response = await fetch(`${API_BASE_URL}/api/v1/moments`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to create moment' }));
    throw new Error(error.error || `Failed to create moment: ${response.statusText}`);
  }
  
  return response.json();
}

export async function updateMoment(id: number, data: UpdateMomentDto): Promise<Moment> {
  const response = await fetch(`${API_BASE_URL}/api/v1/moments/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to update moment' }));
    throw new Error(error.error || `Failed to update moment: ${response.statusText}`);
  }
  
  return response.json();
}

export async function deleteMoment(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/moments/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to delete moment' }));
    throw new Error(error.error || `Failed to delete moment: ${response.statusText}`);
  }
}