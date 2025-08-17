import { PomodoroConfig, PomodoroTask, CreatePomodoroTaskRequest, CreatePomodoroSessionRequest, SessionType } from '@/types/pomodoro';

export function prepareSessionData(
  config: PomodoroConfig,
  initialTask?: string,
  currentTasks?: PomodoroTask[],
  sessionType: SessionType = SessionType.WORK
): CreatePomodoroSessionRequest {
  const tasks: CreatePomodoroTaskRequest[] = [];
  
  // Add initial task if provided
  if (initialTask?.trim()) {
    tasks.push({ description: initialTask });
  }
  
  // Add incomplete tasks from current session
  if (currentTasks) {
    const incompleteTasks = getIncompleteTasks(currentTasks);
    tasks.push(...incompleteTasks);
  }
  
  return {
    workDuration: config.workDuration,
    breakDuration: sessionType === SessionType.LONG_BREAK 
      ? config.longBreakDuration 
      : config.shortBreakDuration,
    sessionType,
    tasks
  };
}

export function getIncompleteTasks(tasks: PomodoroTask[]): CreatePomodoroTaskRequest[] {
  return tasks
    .filter(task => !task.completed)
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map(task => ({
      todoId: task.todoId,
      description: task.description
    }));
}