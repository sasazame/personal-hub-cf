import { Moment, CreateMomentDto, UpdateMomentDto, MomentPage } from '@/types/moment';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8787';

export function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
  };
}

// Transform backend moment to frontend format
function transformMoment(backendMoment: Omit<Moment, 'tags'> & { tags?: string | null }): Moment {
  return {
    ...backendMoment,
    tags: backendMoment.tags ? backendMoment.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t) : []
  };
}

export async function fetchMoments(page = 0, size = 20): Promise<MomentPage> {
  const response = await fetch(`${API_BASE_URL}/api/v1/moments?page=${page + 1}&limit=${size}`, {
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch moments: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // Transform backend response to match frontend expectations
  return {
    content: (data.items || []).map(transformMoment),
    totalElements: data.total || 0,
    totalPages: data.totalPages || 0,
    first: page === 0,
    last: (page + 1) >= data.totalPages,
    pageable: {
      pageNumber: page,
      pageSize: size,
      sort: { sorted: false, direction: 'desc', properties: [] }
    }
  };
}

export async function fetchAllMoments(): Promise<Moment[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/moments?limit=1000`, {
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch all moments: ${response.statusText}`);
  }
  
  const data = await response.json();
  return (data.items || []).map(transformMoment);
}

export async function fetchMomentById(id: number): Promise<Moment> {
  const response = await fetch(`${API_BASE_URL}/api/v1/moments/${id}`, {
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch moment: ${response.statusText}`);
  }
  
  const moment = await response.json();
  return transformMoment(moment);
}

export async function searchMoments(query: string, tag?: string): Promise<Moment[]> {
  const params = new URLSearchParams({ search: query });
  if (tag) params.append('tags', tag);
  
  const response = await fetch(`${API_BASE_URL}/api/v1/moments?${params}`, {
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error(`Failed to search moments: ${response.statusText}`);
  }
  
  const data = await response.json();
  return (data.items || []).map(transformMoment);
}

export async function fetchMomentsByTag(tag: string): Promise<Moment[]> {
  const params = new URLSearchParams({ tags: tag });
  const response = await fetch(`${API_BASE_URL}/api/v1/moments?${params}`, {
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch moments by tag: ${response.statusText}`);
  }
  
  const data = await response.json();
  return (data.items || []).map(transformMoment);
}

export async function fetchMomentsByDateRange(startDate: string, endDate: string, page = 0, size = 20): Promise<MomentPage> {
  const params = new URLSearchParams({
    fromDate: startDate,
    toDate: endDate,
    page: (page + 1).toString(),
    limit: size.toString()
  });
  
  const response = await fetch(`${API_BASE_URL}/api/v1/moments?${params}`, {
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch moments by date range: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // Transform backend response to match frontend expectations
  return {
    content: (data.items || []).map(transformMoment),
    totalElements: data.total || 0,
    totalPages: data.totalPages || 0,
    first: page === 0,
    last: (page + 1) >= data.totalPages,
    pageable: {
      pageNumber: page,
      pageSize: size,
      sort: { sorted: false, direction: 'desc', properties: [] }
    }
  };
}

export async function fetchRecentMoments(limit = 10): Promise<Moment[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/moments?limit=${limit}`, {
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch recent moments: ${response.statusText}`);
  }
  
  const data = await response.json();
  return (data.items || []).map(transformMoment);
}

export async function fetchTodaysMoments(): Promise<Moment[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/moments/today`, {
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch today's moments: ${response.statusText}`);
  }
  
  const moments = await response.json();
  return moments.map(transformMoment);
}

export async function fetchMomentTags(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/moments/tags`, {
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch moment tags: ${response.statusText}`);
  }
  
  const tagData = await response.json();
  // Extract just the tag names from the array of {tag, count} objects
  return tagData.map((item: { tag: string; count: number }) => item.tag);
}

export async function fetchDefaultMomentTags(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/moments/tags/default`, {
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch default moment tags: ${response.statusText}`);
  }
  
  const tagData = await response.json();
  // Extract just the tag names from the array of {tag, count} objects
  return tagData.map((item: { tag: string; count: number }) => item.tag);
}

export async function createMoment(data: CreateMomentDto): Promise<Moment> {
  // Convert tags array to comma-separated string for backend
  const payload = {
    content: data.content,
    tags: data.tags ? data.tags.join(',') : undefined
  };
  
  const response = await fetch(`${API_BASE_URL}/api/v1/moments`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
    credentials: 'include'
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to create moment' }));
    throw new Error(error.error || `Failed to create moment: ${response.statusText}`);
  }
  
  const result = await response.json();
  // Backend returns an array with the created moment
  const moment = Array.isArray(result) ? result[0] : result;
  return transformMoment(moment);
}

export async function updateMoment(id: number, data: UpdateMomentDto): Promise<Moment> {
  // Convert tags array to comma-separated string for backend
  const payload = {
    content: data.content,
    tags: data.tags ? data.tags.join(',') : undefined
  };
  
  const response = await fetch(`${API_BASE_URL}/api/v1/moments/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
    credentials: 'include'
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to update moment' }));
    throw new Error(error.error || `Failed to update moment: ${response.statusText}`);
  }
  
  const result = await response.json();
  // Backend returns an array with the updated moment
  const moment = Array.isArray(result) ? result[0] : result;
  return transformMoment(moment);
}

export async function deleteMoment(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/moments/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to delete moment' }));
    throw new Error(error.error || `Failed to delete moment: ${response.statusText}`);
  }
}

export const momentApi = {
  getMoments: async (params?: { page?: number; size?: number; search?: string; tags?: string[] }) => {
    const { page = 0, size = 20, search, tags } = params || {};
    
    if (search) {
      const moments = await searchMoments(search, tags?.[0]);
      return {
        content: moments.slice(page * size, (page + 1) * size),
        totalElements: moments.length,
        totalPages: Math.ceil(moments.length / size),
        first: page === 0,
        last: (page + 1) * size >= moments.length,
        pageable: {
          pageNumber: page,
          pageSize: size,
          sort: { sorted: false, direction: 'desc', properties: [] }
        }
      };
    }
    
    if (tags && tags.length > 0) {
      const moments = await fetchMomentsByTag(tags[0]);
      return {
        content: moments.slice(page * size, (page + 1) * size),
        totalElements: moments.length,
        totalPages: Math.ceil(moments.length / size),
        first: page === 0,
        last: (page + 1) * size >= moments.length,
        pageable: {
          pageNumber: page,
          pageSize: size,
          sort: { sorted: false, direction: 'desc', properties: [] }
        }
      };
    }
    
    return fetchMoments(page, size);
  },
  getTags: fetchMomentTags,
  createMoment,
  updateMoment,
  deleteMoment
};