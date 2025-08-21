export interface PomodoroSession {
  id: string;
  userId: string;
  startTime?: string;
  endTime?: string;
  workDuration: number;
  breakDuration: number;
  completedCycles: number;
  status: string;
  sessionType: string;
  tasks?: PomodoroTask[];
  createdAt: string;
  updatedAt: string;
}

export enum SessionStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum SessionType {
  WORK = 'WORK',
  SHORT_BREAK = 'SHORT_BREAK',
  LONG_BREAK = 'LONG_BREAK'
}

export interface PomodoroTask {
  id: string;
  sessionId: string;
  todoId?: number;
  description: string;
  completed: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface PomodoroConfig {
  readonly id?: string;
  readonly userId?: string;
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  cyclesBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartWork: boolean;
  soundEnabled: boolean;
  alarmVolume: number;
  alarmSound: string;
  carryOverIncompleteTasks: boolean;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

export interface CreatePomodoroSessionRequest {
  workDuration: number;
  breakDuration: number;
  sessionType?: SessionType;
  tasks?: CreatePomodoroTaskRequest[];
}

export interface CreatePomodoroTaskRequest {
  todoId?: number;
  description: string;
}

export interface UpdatePomodoroSessionRequest {
  action: SessionAction;
  sessionType?: SessionType;
}

export enum SessionAction {
  START = 'START',
  PAUSE = 'PAUSE',
  RESUME = 'RESUME',
  COMPLETE = 'COMPLETE',
  CANCEL = 'CANCEL',
  SWITCH_TYPE = 'SWITCH_TYPE'
}

export interface UpdatePomodoroTaskRequest {
  completed: boolean;
}

export interface UpdatePomodoroConfigRequest {
  workDuration?: number;
  shortBreakDuration?: number;
  longBreakDuration?: number;
  cyclesBeforeLongBreak?: number;
  alarmSound?: string;
  alarmVolume?: number;
  autoStartBreaks?: boolean;
  autoStartWork?: boolean;
  soundEnabled?: boolean;
  carryOverIncompleteTasks?: boolean;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}