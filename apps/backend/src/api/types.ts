/**
 * API Request/Response Types
 */

// Common
export interface PaginationQuery {
  limit?: string;
  offset?: string;
}

export interface DateRangeQuery {
  fromDate?: string;
  toDate?: string;
  from?: string;
  to?: string;
  startDate?: string;
  endDate?: string;
}

// Auth
export interface RegisterBody {
  email: string;
  password: string;
  username: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface RefreshTokenBody {
  refreshToken: string;
}

// Todos
export interface TodoQuery extends PaginationQuery {
  status?: string;
  priority?: string;
  tag?: string;
}

export interface CreateTodoBody {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  tags?: string;
}

export interface UpdateTodoBody {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  tags?: string;
}

// Notes
export interface NoteQuery extends PaginationQuery {
  tag?: string;
  category?: string;
  search?: string;
}

export interface CreateNoteBody {
  title: string;
  content: string;
  tags?: string;
  category?: string;
}

export interface UpdateNoteBody {
  title?: string;
  content?: string;
  tags?: string;
  category?: string;
}

// Moments
export interface MomentQuery extends PaginationQuery {
  tag?: string;
}

export interface CreateMomentBody {
  content: string;
  tags?: string;
}

export interface UpdateMomentBody {
  content?: string;
  tags?: string;
}

// Events
export interface EventQuery extends PaginationQuery, DateRangeQuery {}

export interface CreateEventBody {
  title: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  location?: string;
  reminder?: boolean;
  reminderMinutes?: number;
}

export interface UpdateEventBody {
  title?: string;
  description?: string;
  startDateTime?: string;
  endDateTime?: string;
  location?: string;
  reminder?: boolean;
  reminderMinutes?: number;
}

// Goals
export interface GoalQuery extends PaginationQuery {
  active?: string;
}

export interface CreateGoalBody {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  isActive?: boolean;
}

export interface UpdateGoalBody {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  isActive?: boolean;
}

export interface CreateGoalAchievementBody {
  achievedDate: string;
}

// Pomodoro
export type PomodoroSessionQuery = PaginationQuery;

export interface CreatePomodoroSessionBody {
  workDuration: number;
  breakDuration: number;
  sessionType?: string;
  tasks?: Array<{
    todoId?: number;
    description: string;
    orderIndex: number;
  }>;
}

export interface UpdatePomodoroSessionBody {
  status?: string;
  completedCycles?: number;
  endTime?: string;
}

export interface UpdatePomodoroTaskBody {
  completed: boolean;
}

export interface UpdatePomodoroConfigBody {
  workDuration?: number;
  shortBreakDuration?: number;
  longBreakDuration?: number;
  cyclesBeforeLongBreak?: number;
  alarmSound?: string;
  alarmVolume?: number;
  autoStartBreaks?: boolean;
  autoStartWork?: boolean;
}

// Analytics
export interface AnalyticsProductivityQuery {
  fromDate: string;
  toDate: string;
}

export interface AnalyticsHabitsQuery {
  days?: string;
}

export interface AnalyticsTimeDistributionQuery {
  days?: string;
}

// Users
export interface UpdateUserBody {
  username?: string;
  weekStartDay?: number;
}

export interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}