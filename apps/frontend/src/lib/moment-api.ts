import { Moment, CreateMomentDto, UpdateMomentDto, MomentPage } from '@/types/moment';
import { apiClient } from './api-client';
import { AxiosError } from 'axios';

interface ApiErrorResponse {
  error?: string;
  message?: string;
}

// Transform backend moment to frontend format
function transformMoment(backendMoment: Omit<Moment, 'tags'> & { tags?: string | string[] | null }): Moment {
  // Handle both string and string[] formats defensively
  const tags = Array.isArray(backendMoment.tags)
    ? backendMoment.tags
    : typeof backendMoment.tags === 'string'
    ? backendMoment.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t)
    : [];
  
  return {
    ...backendMoment,
    tags
  };
}

/**
 * Fetch paginated moments with optional filters
 * @param page - Page number (0-indexed)
 * @param size - Number of items per page
 * @param opts - Optional filters (search, tags)
 * @returns Promise with paginated moments
 */
export async function fetchMoments(
  page = 0, 
  size = 20,
  opts: { search?: string; tags?: string[] } = {}
): Promise<MomentPage> {
  // Validate input parameters
  if (page < 0) {
    throw new Error('Page number must be non-negative');
  }
  if (size < 1 || size > 100) {
    throw new Error('Page size must be between 1 and 100');
  }
  
  try {
    const params: Record<string, string | number> = { page: page + 1, limit: size };
    if (opts.search) params.search = opts.search;
    if (opts.tags?.length) params.tags = opts.tags.join(',');
    
    const response = await apiClient.get('/api/v1/moments', { params });
    
    const data = response.data ?? {};
    const items = Array.isArray(data.items) ? data.items : [];
    const numericTotal = Number.isFinite(Number(data.total)) ? Number(data.total) : undefined;
    const numericTotalPages =
      Number.isFinite(Number(data.totalPages)) && Number(data.totalPages) > 0
        ? Number(data.totalPages)
        : undefined;
    const totalElements = numericTotal ?? items.length;
    const totalPages = numericTotalPages ?? Math.ceil(totalElements / size);
    const isDerivedTotals = numericTotal === undefined && numericTotalPages === undefined;
    const isLast = totalPages === 0 ? true : (isDerivedTotals ? items.length < size : (page + 1) >= totalPages);
    
    // Transform backend response to match frontend expectations
    return {
      content: items.map(transformMoment),
      totalElements,
      totalPages,
      first: page === 0,
      last: isLast,
      pageable: {
        pageNumber: page,
        pageSize: size,
        sort: { sorted: false, direction: 'desc', properties: [] }
      }
    };
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const errorMessage = axiosError.response?.data?.error || axiosError.response?.data?.message || 'Failed to fetch moments';
    throw new Error(errorMessage);
  }
}

/**
 * Fetch all moments (up to 1000)
 * @returns Promise with array of all moments
 */
export async function fetchAllMoments(): Promise<Moment[]> {
  try {
    const response = await apiClient.get('/api/v1/moments', {
      params: { limit: 1000 }
    });
    
    const data = response.data ?? {};
    const items = Array.isArray(data.items) ? data.items : [];
    return items.map(transformMoment);
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const errorMessage = axiosError.response?.data?.error || axiosError.response?.data?.message || 'Failed to fetch all moments';
    throw new Error(errorMessage);
  }
}

/**
 * Fetch a single moment by ID
 * @param id - Moment ID
 * @returns Promise with the moment
 */
export async function fetchMomentById(id: number): Promise<Moment> {
  // Validate input parameter
  if (!Number.isInteger(id) || id < 1) {
    throw new Error('Moment ID must be a positive integer');
  }
  
  try {
    const response = await apiClient.get(`/api/v1/moments/${id}`);
    
    const moment = response.data;
    return transformMoment(moment);
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const errorMessage = axiosError.response?.data?.error || axiosError.response?.data?.message || 'Failed to fetch moment';
    throw new Error(errorMessage);
  }
}

/**
 * Search moments by query and optional tag
 * @param query - Search query string
 * @param tag - Optional tag filter
 * @returns Promise with array of matching moments
 */
export async function searchMoments(query: string, tag?: string): Promise<Moment[]> {
  // Validate input parameters
  if (!query || query.trim().length === 0) {
    throw new Error('Search query cannot be empty');
  }
  
  try {
    // delegate to the normalized pagination path; first page, default size
    const page = await fetchMoments(0, 20, { search: query, tags: tag ? [tag] : undefined });
    return page.content;
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const errorMessage = axiosError.response?.data?.error || axiosError.response?.data?.message || 'Failed to search moments';
    throw new Error(errorMessage);
  }
}

/**
 * Fetch moments by tag
 * @param tag - Tag to filter by
 * @returns Promise with array of moments with the specified tag
 */
export async function fetchMomentsByTag(tag: string): Promise<Moment[]> {
  // Validate input parameter
  if (!tag || tag.trim().length === 0) {
    throw new Error('Tag cannot be empty');
  }
  
  try {
    const page = await fetchMoments(0, 20, { tags: [tag] });
    return page.content;
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const errorMessage = axiosError.response?.data?.error || axiosError.response?.data?.message || 'Failed to fetch moments by tag';
    throw new Error(errorMessage);
  }
}

/**
 * Fetch moments within a date range
 * @param startDate - Start date (ISO format)
 * @param endDate - End date (ISO format)
 * @param page - Page number (0-indexed)
 * @param size - Number of items per page
 * @returns Promise with paginated moments
 */
export async function fetchMomentsByDateRange(startDate: string, endDate: string, page = 0, size = 20): Promise<MomentPage> {
  try {
    const response = await apiClient.get('/api/v1/moments', {
      params: {
        fromDate: startDate,
        toDate: endDate,
        page: page + 1,
        limit: size
      }
    });
    
    const data = response.data ?? {};
    const items = Array.isArray(data.items) ? data.items : [];
    const numericTotal = Number.isFinite(Number(data.total)) ? Number(data.total) : undefined;
    const numericTotalPages =
      Number.isFinite(Number(data.totalPages)) && Number(data.totalPages) > 0
        ? Number(data.totalPages)
        : undefined;
    const totalElements = numericTotal ?? items.length;
    const totalPages = numericTotalPages ?? Math.ceil(totalElements / size);
    const isDerivedTotals = numericTotal === undefined && numericTotalPages === undefined;
    const isLast = totalPages === 0 ? true : (isDerivedTotals ? items.length < size : (page + 1) >= totalPages);
    
    // Transform backend response to match frontend expectations
    return {
      content: items.map(transformMoment),
      totalElements,
      totalPages,
      first: page === 0,
      last: isLast,
      pageable: {
        pageNumber: page,
        pageSize: size,
        sort: { sorted: false, direction: 'desc', properties: [] }
      }
    };
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const errorMessage = axiosError.response?.data?.error || axiosError.response?.data?.message || 'Failed to fetch moments by date range';
    throw new Error(errorMessage);
  }
}

/**
 * Fetch recent moments
 * @param limit - Maximum number of moments to fetch
 * @returns Promise with array of recent moments
 */
export async function fetchRecentMoments(limit = 10): Promise<Moment[]> {
  // Validate input parameter
  if (limit < 1 || limit > 100) {
    throw new Error('Limit must be between 1 and 100');
  }
  
  try {
    const response = await apiClient.get('/api/v1/moments', {
      params: { limit }
    });
    
    const data = response.data ?? {};
    const items = Array.isArray(data.items) ? data.items : [];
    return items.map(transformMoment);
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const errorMessage = axiosError.response?.data?.error || axiosError.response?.data?.message || 'Failed to fetch recent moments';
    throw new Error(errorMessage);
  }
}

/**
 * Fetch today's moments
 * @returns Promise with array of today's moments
 */
export async function fetchTodaysMoments(): Promise<Moment[]> {
  try {
    const response = await apiClient.get('/api/v1/moments/today');
    
    const raw = response.data;
    const moments = Array.isArray(raw) ? raw : (raw?.items ?? []);
    return moments.map(transformMoment);
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const errorMessage = axiosError.response?.data?.error || axiosError.response?.data?.message || 'Failed to fetch today\'s moments';
    throw new Error(errorMessage);
  }
}

/**
 * Fetch all available moment tags
 * @returns Promise with array of tag names
 */
export async function fetchMomentTags(): Promise<string[]> {
  try {
    const response = await apiClient.get('/api/v1/moments/tags');
    
    const raw = response.data;
    const items = Array.isArray(raw) ? raw : (raw?.items ?? []);
    // Accept either "string" or "{ tag, count }" item shapes
    return items
      .map((item: { tag: string; count?: number } | string) =>
        typeof item === 'string' ? item : item?.tag
      )
      .filter((t: unknown): t is string => typeof t === 'string' && t.trim().length > 0);
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const errorMessage = axiosError.response?.data?.error || axiosError.response?.data?.message || 'Failed to fetch moment tags';
    throw new Error(errorMessage);
  }
}

/**
 * Fetch default moment tags
 * @returns Promise with array of default tag names
 */
export async function fetchDefaultMomentTags(): Promise<string[]> {
  try {
    const response = await apiClient.get('/api/v1/moments/tags/default');
    
    const raw = response.data;
    const items = Array.isArray(raw) ? raw : (raw?.items ?? []);
    // Accept either "string" or "{ tag, count }" item shapes
    return items
      .map((item: { tag: string; count?: number } | string) =>
        typeof item === 'string' ? item : item?.tag
      )
      .filter((t: unknown): t is string => typeof t === 'string' && t.trim().length > 0);
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const errorMessage = axiosError.response?.data?.error || axiosError.response?.data?.message || 'Failed to fetch default moment tags';
    throw new Error(errorMessage);
  }
}

/**
 * Create a new moment
 * @param data - Moment creation data
 * @returns Promise with the created moment
 */
export async function createMoment(data: CreateMomentDto): Promise<Moment> {
  // Validate input data
  if (!data.content || data.content.trim().length === 0) {
    throw new Error('Moment content cannot be empty');
  }
  
  // Convert tags array to comma-separated string for backend
  const normalizedTags = (data.tags ?? []).map((t: string) => t?.trim()).filter(Boolean);
  const payload = {
    content: data.content,
    tags: normalizedTags.length ? normalizedTags.join(',') : undefined
  };
  
  try {
    const response = await apiClient.post('/api/v1/moments', payload);
    const result = response.data;
    // Backend returns an array with the created moment
    const moment = Array.isArray(result) ? result[0] : result;
    if (!moment) {
      throw new Error('Unexpected API response: missing created moment');
    }
    return transformMoment(moment);
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const errorMessage = axiosError.response?.data?.error || axiosError.response?.data?.message || 'Failed to create moment';
    throw new Error(errorMessage);
  }
}

/**
 * Update an existing moment
 * @param id - Moment ID
 * @param data - Moment update data
 * @returns Promise with the updated moment
 */
export async function updateMoment(id: number, data: UpdateMomentDto): Promise<Moment> {
  // Validate input parameters
  if (!Number.isInteger(id) || id < 1) {
    throw new Error('Moment ID must be a positive integer');
  }
  if (data.content !== undefined && data.content.trim().length === 0) {
    throw new Error('Moment content cannot be empty');
  }
  
  // Convert tags array to comma-separated string for backend
  const normalizedTags = (data.tags ?? []).map((t: string) => t?.trim()).filter(Boolean);
  const payload = {
    content: data.content,
    tags: normalizedTags.length ? normalizedTags.join(',') : undefined
  };
  
  try {
    const response = await apiClient.put(`/api/v1/moments/${id}`, payload);
    const result = response.data;
    // Backend returns an array with the updated moment
    const moment = Array.isArray(result) ? result[0] : result;
    if (!moment) {
      throw new Error('Unexpected API response: missing updated moment');
    }
    return transformMoment(moment);
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const errorMessage = axiosError.response?.data?.error || axiosError.response?.data?.message || 'Failed to update moment';
    throw new Error(errorMessage);
  }
}

/**
 * Delete a moment
 * @param id - Moment ID
 * @returns Promise that resolves when deletion is complete
 */
export async function deleteMoment(id: number): Promise<void> {
  // Validate input parameter
  if (!Number.isInteger(id) || id < 1) {
    throw new Error('Moment ID must be a positive integer');
  }
  
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
    
    // Use server-side pagination for all cases
    return fetchMoments(page, size, { search, tags });
  },
  getTags: fetchMomentTags,
  createMoment,
  updateMoment,
  deleteMoment
};