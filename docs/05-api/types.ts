/**
 * Personal Hub API Types
 * 
 * These types match the backend API responses exactly.
 * Import these types in your frontend code for type safety.
 */

// Common Types
export interface ApiError {
  code: string;
  message: string;
  details: Record<string, any> | null;
  timestamp: string;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

// Auth Types
export interface User {
  id: string;
  username: string;
  email: string;
  weekStartDay: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

// Todo Types
export type TodoStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Todo {
  id: string;
  title: string;
  description: string | null;
  status: TodoStatus;
  priority: Priority;
  dueDate: string | null;
  tags: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoRequest {
  title: string;
  description?: string;
  status?: TodoStatus;
  priority?: Priority;
  dueDate?: string;
  tags?: string;
}

export interface UpdateTodoRequest {
  title?: string;
  description?: string;
  status?: TodoStatus;
  priority?: Priority;
  dueDate?: string;
  tags?: string;
}

export interface TodoFilters extends PaginationParams {
  status?: TodoStatus;
  priority?: Priority;
  tag?: string;
}

// Note Types
export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string | null;
  category: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteRequest {
  title: string;
  content: string;
  tags?: string;
  category?: string;
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
  tags?: string;
  category?: string;
}

export interface NoteFilters extends PaginationParams {
  tag?: string;
  category?: string;
  search?: string;
}

// Moment Types
export interface Moment {
  id: string;
  content: string;
  tags: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMomentRequest {
  content: string;
  tags?: string;
}

export interface UpdateMomentRequest {
  content?: string;
  tags?: string;
}

export interface MomentFilters extends PaginationParams {
  tag?: string;
}

// Event Types
export interface Event {
  id: string;
  title: string;
  description: string | null;
  startDateTime: string;
  endDateTime: string;
  location: string | null;
  reminder: boolean;
  reminderMinutes: number | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  location?: string;
  reminder?: boolean;
  reminderMinutes?: number;
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  startDateTime?: string;
  endDateTime?: string;
  location?: string;
  reminder?: boolean;
  reminderMinutes?: number;
}

export interface EventFilters extends PaginationParams {
  from?: string;
  to?: string;
}

export interface EventRangeParams {
  startDate: string;
  endDate: string;
}

// Goal Types
export interface Goal {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  targetValue: number | null;
  currentValue: number | null;
  unit: string | null;
  isActive: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalRequest {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  isActive?: boolean;
}

export interface UpdateGoalRequest {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  isActive?: boolean;
}

export interface GoalAchievement {
  id: string;
  goalId: string;
  achievedDate: string;
  createdAt: string;
}

export interface CreateGoalAchievementRequest {
  achievedDate: string;
}

export interface GoalFilters extends PaginationParams {
  active?: boolean;
}

// Pomodoro Types
export type PomodoroStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export interface PomodoroTask {
  id: string;
  sessionId: string;
  todoId: number | null;
  description: string;
  orderIndex: number;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PomodoroSession {
  id: string;
  userId: string;
  startTime: string;
  endTime: string | null;
  workDuration: number;
  breakDuration: number;
  status: PomodoroStatus;
  sessionType: string | null;
  completedCycles: number;
  tasks?: PomodoroTask[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePomodoroSessionRequest {
  workDuration: number;
  breakDuration: number;
  sessionType?: string;
  tasks?: Array<{
    todoId?: number;
    description: string;
    orderIndex: number;
  }>;
}

export interface UpdatePomodoroSessionRequest {
  status?: PomodoroStatus;
  completedCycles?: number;
  endTime?: string;
}

export interface UpdatePomodoroTaskRequest {
  completed: boolean;
}

export interface PomodoroConfig {
  id?: string;
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  cyclesBeforeLongBreak: number;
  alarmSound: string;
  alarmVolume: number;
  autoStartBreaks: boolean;
  autoStartWork: boolean;
}

export interface PomodoroStats {
  totalSessions: number;
  completedSessions: number;
  totalCycles: number;
  totalWorkMinutes: number;
  averageCyclesPerSession: number;
}

// Analytics Types
export interface AnalyticsOverview {
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
  id: string;
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

export interface TagAnalytics {
  tags: Array<{
    tag: string;
    notes: number;
    moments: number;
    total: number;
  }>;
  totalUniqueTags: number;
  mostUsedTag: {
    tag: string;
    notes: number;
    moments: number;
    total: number;
  } | null;
}

export interface TimeDistribution {
  hourlyDistribution: Array<{
    hour: number;
    todos: number;
  }>;
  weekdayDistribution: Array<{
    dayOfWeek: number;
    todos: number;
  }>;
}

// User Types
export interface UpdateUserRequest {
  username?: string;
  weekStartDay?: number;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// API Client Helper Types
export interface ApiResponse<T> {
  data: T;
  error?: ApiError;
}

export interface ApiListResponse<T> {
  data: T[];
  total?: number;
  error?: ApiError;
}