import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/analytics-api';

export function useAnalytics(period: 'week' | 'month' | 'year' = 'week') {
  return useQuery({
    queryKey: ['analytics', period],
    queryFn: () => analyticsApi.getAnalytics(period),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useProductivityScore() {
  return useQuery({
    queryKey: ['productivity-score'],
    queryFn: () => analyticsApi.getProductivityScore(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useStreaks() {
  return useQuery({
    queryKey: ['streaks'],
    queryFn: () => analyticsApi.getStreaks(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}