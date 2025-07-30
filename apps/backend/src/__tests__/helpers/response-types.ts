// Common response types for tests

export interface ErrorResponse {
  error?: string;
  code?: string;
  details?: string;
  fieldErrors?: Record<string, string>;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user?: UserResponse;
}

export interface UserResponse {
  id: string;
  email: string;
  username: string;
  enabled: boolean;
  weekStartDay: number;
  createdAt: string;
  updatedAt: string;
}

export interface TodoResponse {
  id: number;
  userId: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  tags: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NoteResponse {
  id: number;
  userId: string;
  title: string;
  content: string;
  tags: string | null;
  category: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MomentResponse {
  id: number;
  userId: string;
  content: string;
  tags: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EventResponse {
  id: number;
  userId: string;
  title: string;
  description: string | null;
  startDateTime: string;
  endDateTime: string;
  location: string | null;
  reminder: boolean;
  reminderMinutes: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface GoalResponse {
  id: number;
  userId: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  targetValue: number | null;
  currentValue: number | null;
  unit: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GoalAchievementResponse {
  id: number;
  goalId: number;
  achievedDate: string;
  createdAt: string;
}

export interface PomodoroSessionResponse {
  id: number;
  userId: string;
  workDuration: number;
  breakDuration: number;
  completedCycles: number;
  status: string;
  sessionType: string;
  startTime: string;
  endTime: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PomodoroTaskResponse {
  id: number;
  sessionId: number;
  todoId: number | null;
  description: string;
  completed: boolean;
  orderIndex: number;
  createdAt: string;
}

export interface PomodoroConfigResponse {
  userId: string;
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  cyclesBeforeLongBreak: number;
  alarmSound: string;
  alarmVolume: number;
  autoStartBreaks: boolean;
  autoStartWork: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface TagCount {
  tag: string;
  count: number;
}

export interface AnalyticsProductivityResponse {
  totalTodos: number;
  completedTodos: number;
  completionRate: number;
  activeGoals: number;
  totalPomodoros: number;
  pomodoroMinutes: number;
  productivityScore: number;
  streakDays: number;
}

export interface AnalyticsHabitsResponse {
  mostProductiveHour: number | null;
  averageCompletionTime: number | null;
  preferredTags: string[];
  consistencyScore: number;
}

export interface AnalyticsTimeDistributionResponse {
  date: string;
  todoCount: number;
  pomodoroMinutes: number;
}

export interface MessageResponse {
  message: string;
}