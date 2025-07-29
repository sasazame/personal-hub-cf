import axios from 'axios';
import { format, subDays, startOfWeek, startOfMonth, startOfYear } from 'date-fns';

const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8787',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface OverviewData {
  todos: {
    total: number;
    completed: number;
    inProgress: number;
    todo: number;
    completionRate: number;
  };
  goals: {
    total: number;
    active: number;
  };
  pomodoro: {
    totalSessions: number;
    completedSessions: number;
    totalCycles: number;
  };
  events: {
    total: number;
    upcoming: number;
  };
  notes: {
    total: number;
  };
  moments: {
    total: number;
    today: number;
  };
}

export interface ProductivityData {
  completedTodosByDate: Array<{
    date: string;
    count: number;
  }>;
  goalAchievementsByDate: Array<{
    date: string;
    count: number;
  }>;
  pomodoroByDate: Array<{
    date: string;
    sessions: number;
    cycles: number;
    minutes: number;
  }>;
}

export interface HabitsData {
  currentStreak: number;
  longestStreak: number;
  mostProductiveHours: Array<{
    hour: number;
    count: number;
  }>;
  mostProductiveDays: Array<{
    dayOfWeek: number;
    count: number;
  }>;
  activityDates: string[];
}

export interface GoalProgress {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  achievementCount: number;
  totalDays: number;
  elapsedDays: number;
  expectedAchievements: number;
  actualAchievements: number;
  progressPercentage: number;
  isOnTrack: boolean;
}

export interface AnalyticsData {
  period: 'week' | 'month' | 'year';
  stats: {
    totalTasks: number;
    completedTasks: number;
    totalPomodoros: number;
    totalFocusTime: number;
    totalGoals: number;
    completedGoals: number;
  };
  taskCompletionTrend: Array<{
    date: string;
    completed: number;
    total: number;
  }>;
  pomodoroTrend: Array<{
    date: string;
    sessions: number;
    focusTime: number;
  }>;
  goalProgress: Array<{
    id: number;
    title: string;
    progress: number;
    target: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
}

// Transform backend data to frontend format
function transformToAnalyticsData(
  overview: OverviewData,
  productivity: ProductivityData,
  goals: GoalProgress[],
  period: 'week' | 'month' | 'year'
): AnalyticsData {
  // Generate date range
  const now = new Date();
  let days: number;
  
  switch (period) {
    case 'month':
      days = 30;
      break;
    case 'year':
      days = 365;
      break;
    default: // week
      days = 7;
      break;
  }

  // Create date map for trends
  const dateMap = new Map<string, { completed: number; total: number }>();
  const pomodoroMap = new Map<string, { sessions: number; focusTime: number }>();
  
  // Initialize all dates
  for (let i = 0; i < days; i++) {
    const date = format(subDays(now, days - 1 - i), 'yyyy-MM-dd');
    dateMap.set(date, { completed: 0, total: 0 });
    pomodoroMap.set(date, { sessions: 0, focusTime: 0 });
  }
  
  // Fill in actual data
  productivity.completedTodosByDate.forEach(item => {
    const existing = dateMap.get(item.date);
    if (existing) {
      existing.completed = item.count;
      existing.total += item.count; // For simplicity, assuming completed = total for now
    }
  });
  
  productivity.pomodoroByDate.forEach(item => {
    pomodoroMap.set(item.date, {
      sessions: item.sessions,
      focusTime: item.minutes
    });
  });

  // Transform goal progress
  const goalProgressData = goals.slice(0, 5).map(goal => ({
    id: goal.id,
    title: goal.title,
    progress: goal.actualAchievements,
    target: goal.expectedAchievements || 1
  }));

  return {
    period,
    stats: {
      totalTasks: overview.todos.total,
      completedTasks: overview.todos.completed,
      totalPomodoros: overview.pomodoro.completedSessions,
      totalFocusTime: overview.pomodoro.totalCycles * 25, // Assuming 25 min per cycle
      totalGoals: overview.goals.total,
      completedGoals: goals.filter(g => g.progressPercentage >= 100).length,
    },
    taskCompletionTrend: Array.from(dateMap.entries()).map(([date, data]) => ({
      date,
      completed: data.completed,
      total: data.total || 1, // Avoid division by zero
    })),
    pomodoroTrend: Array.from(pomodoroMap.entries()).map(([date, data]) => ({
      date,
      sessions: data.sessions,
      focusTime: data.focusTime,
    })),
    goalProgress: goalProgressData,
    categoryBreakdown: [
      { category: '仕事', count: 45, percentage: 35 },
      { category: '学習', count: 30, percentage: 23 },
      { category: '健康', count: 25, percentage: 19 },
      { category: '趣味', count: 20, percentage: 15 },
      { category: 'その他', count: 10, percentage: 8 },
    ],
  };
}

export const analyticsApi = {
  getOverview: async (): Promise<OverviewData> => {
    const response = await api.get('/api/v1/analytics/overview');
    return response.data;
  },

  getProductivity: async (fromDate: string, toDate: string): Promise<ProductivityData> => {
    const response = await api.get(`/api/v1/analytics/productivity?fromDate=${fromDate}&toDate=${toDate}`);
    return response.data;
  },

  getHabits: async (days: number = 30): Promise<HabitsData> => {
    const response = await api.get(`/api/v1/analytics/habits?days=${days}`);
    return response.data;
  },

  getGoalsProgress: async (): Promise<GoalProgress[]> => {
    const response = await api.get('/api/v1/analytics/goals-progress');
    return response.data;
  },

  // Composite method that matches the expected interface
  getAnalytics: async (period: 'week' | 'month' | 'year' = 'week'): Promise<AnalyticsData> => {
    const now = new Date();
    let fromDate: string;
    
    switch (period) {
      case 'month':
        fromDate = format(startOfMonth(now), 'yyyy-MM-dd');
        break;
      case 'year':
        fromDate = format(startOfYear(now), 'yyyy-MM-dd');
        break;
      default: // week
        fromDate = format(startOfWeek(now), 'yyyy-MM-dd');
        break;
    }
    
    const toDate = format(now, 'yyyy-MM-dd');
    
    const [overview, productivity, goals] = await Promise.all([
      analyticsApi.getOverview(),
      analyticsApi.getProductivity(fromDate, toDate),
      analyticsApi.getGoalsProgress(),
    ]);
    
    return transformToAnalyticsData(overview, productivity, goals, period);
  },

  getProductivityScore: async (): Promise<{ score: number; factors: Record<string, number> }> => {
    // Calculate based on habits data
    const habits = await analyticsApi.getHabits(7);
    const overview = await analyticsApi.getOverview();
    
    const taskCompletion = overview.todos.total > 0 
      ? Math.round(overview.todos.completionRate * 100)
      : 0;
    
    const consistency = Math.min(100, Math.round((habits.currentStreak / 7) * 100));
    const focusTime = Math.min(100, Math.round((overview.pomodoro.totalCycles * 25) / 840 * 100));
    const goalProgress = 75; // Mock for now
    
    const score = Math.round(
      taskCompletion * 0.3 + 
      consistency * 0.3 + 
      focusTime * 0.2 + 
      goalProgress * 0.2
    );
    
    return {
      score,
      factors: {
        taskCompletion,
        consistency,
        focusTime,
        goalProgress,
      }
    };
  },

  getStreaks: async (): Promise<{ currentStreak: number; longestStreak: number; lastActiveDate: string }> => {
    const habits = await analyticsApi.getHabits(90);
    return {
      currentStreak: habits.currentStreak,
      longestStreak: habits.longestStreak,
      lastActiveDate: habits.activityDates[0] || format(new Date(), 'yyyy-MM-dd'),
    };
  },
};