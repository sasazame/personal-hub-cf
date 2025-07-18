import { apiClient } from './api';
import type { 
  DashboardStats, 
  DashboardActivity, 
  DashboardQuery 
} from '@personal-hub/shared';

export const dashboardApi = {
  async getStats(query?: DashboardQuery): Promise<DashboardStats> {
    const params = new URLSearchParams();
    if (query?.activityLimit) params.append('activityLimit', query.activityLimit.toString());
    if (query?.recentItemsLimit) params.append('recentItemsLimit', query.recentItemsLimit.toString());
    
    const response = await apiClient.get<DashboardStats>(`/dashboard/stats?${params}`);
    return response.data;
  },

  async getActivity(query?: DashboardQuery): Promise<DashboardActivity> {
    const params = new URLSearchParams();
    if (query?.activityLimit) params.append('activityLimit', query.activityLimit.toString());
    
    const response = await apiClient.get<DashboardActivity>(`/dashboard/activity?${params}`);
    return response.data;
  }
};