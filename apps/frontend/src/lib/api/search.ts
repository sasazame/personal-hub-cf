import { apiClient } from '../api';
import type { SearchRequest, SearchResponse } from '@personal-hub/shared';

export const searchApi = {
  search: async (params: SearchRequest): Promise<SearchResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('query', params.query);
    queryParams.append('limit', params.limit?.toString() || '20');
    queryParams.append('offset', params.offset?.toString() || '0');
    
    if (params.types && params.types.length > 0) {
      params.types.forEach(type => queryParams.append('types', type));
    }
    
    const response = await apiClient.get<SearchResponse>(`/api/search?${queryParams.toString()}`);
    return response.data;
  },
};