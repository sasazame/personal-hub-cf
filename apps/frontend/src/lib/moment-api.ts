import { Moment, CreateMomentDto, UpdateMomentDto, MomentPage } from '@/types/moment';
import { apiClient } from './api-client';
import { AxiosError } from 'axios';

interface ApiErrorResponse {
  error?: string;
  message?: string;
}

// Transform backend moment to frontend format
function transformMoment(backendMoment: Omit<Moment, 'tags'> & { tags?: string | null }): Moment {
  return {
    ...backendMoment,
    tags: backendMoment.tags ? backendMoment.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t) : []
  };
}

export async function fetchMoments(page = 0, size = 20): Promise<MomentPage> {
  const response = await apiClient.get('/api/v1/moments', {
    params: { page: page + 1, limit: size }
  });
  
  const data = response.data;
  
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
  const response = await apiClient.get('/api/v1/moments', {
    params: { limit: 1000 }
  });
  
  const data = response.data;
  return (data.items || []).map(transformMoment);
}

export async function fetchMomentById(id: number): Promise<Moment> {
  const response = await apiClient.get(`/api/v1/moments/${id}`);
  
  const moment = response.data;
  return transformMoment(moment);
}

export async function searchMoments(query: string, tag?: string): Promise<Moment[]> {
  const params: Record<string, string> = { search: query };
  if (tag) params.tags = tag;
  
  const response = await apiClient.get('/api/v1/moments', { params });
  
  const data = response.data;
  return (data.items || []).map(transformMoment);
}

export async function fetchMomentsByTag(tag: string): Promise<Moment[]> {
  const response = await apiClient.get('/api/v1/moments', {
    params: { tags: tag }
  });
  
  const data = response.data;
  return (data.items || []).map(transformMoment);
}

export async function fetchMomentsByDateRange(startDate: string, endDate: string, page = 0, size = 20): Promise<MomentPage> {
  const response = await apiClient.get('/api/v1/moments', {
    params: {
      fromDate: startDate,
      toDate: endDate,
      page: page + 1,
      limit: size
    }
  });
  
  const data = response.data;
  
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
  const response = await apiClient.get('/api/v1/moments', {
    params: { limit }
  });
  
  const data = response.data;
  return (data.items || []).map(transformMoment);
}

export async function fetchTodaysMoments(): Promise<Moment[]> {
  const response = await apiClient.get('/api/v1/moments/today');
  
  const moments = response.data;
  return moments.map(transformMoment);
}

export async function fetchMomentTags(): Promise<string[]> {
  const response = await apiClient.get('/api/v1/moments/tags');
  
  const tagData = response.data;
  // Extract just the tag names from the array of {tag, count} objects
  return tagData.map((item: { tag: string; count: number }) => item.tag);
}

export async function fetchDefaultMomentTags(): Promise<string[]> {
  const response = await apiClient.get('/api/v1/moments/tags/default');
  
  const tagData = response.data;
  // Extract just the tag names from the array of {tag, count} objects
  return tagData.map((item: { tag: string; count: number }) => item.tag);
}

export async function createMoment(data: CreateMomentDto): Promise<Moment> {
  // Convert tags array to comma-separated string for backend
  const payload = {
    content: data.content,
    tags: data.tags ? data.tags.join(',') : undefined
  };
  
  try {
    const response = await apiClient.post('/api/v1/moments', payload);
    const result = response.data;
    // Backend returns an array with the created moment
    const moment = Array.isArray(result) ? result[0] : result;
    return transformMoment(moment);
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const errorMessage = axiosError.response?.data?.error || axiosError.response?.data?.message || 'Failed to create moment';
    throw new Error(errorMessage);
  }
}

export async function updateMoment(id: number, data: UpdateMomentDto): Promise<Moment> {
  // Convert tags array to comma-separated string for backend
  const payload = {
    content: data.content,
    tags: data.tags ? data.tags.join(',') : undefined
  };
  
  try {
    const response = await apiClient.put(`/api/v1/moments/${id}`, payload);
    const result = response.data;
    // Backend returns an array with the updated moment
    const moment = Array.isArray(result) ? result[0] : result;
    return transformMoment(moment);
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const errorMessage = axiosError.response?.data?.error || axiosError.response?.data?.message || 'Failed to update moment';
    throw new Error(errorMessage);
  }
}

export async function deleteMoment(id: number): Promise<void> {
  try {
    await apiClient.delete(`/api/v1/moments/${id}`);
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const errorMessage = axiosError.response?.data?.error || axiosError.response?.data?.message || 'Failed to delete moment';
    throw new Error(errorMessage);
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