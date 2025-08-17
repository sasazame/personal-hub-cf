import { PomodoroConfig, PomodoroTask, CreatePomodoroTaskRequest, CreatePomodoroSessionRequest } from '@/types/pomodoro';

export function prepareSessionData(
  config: PomodoroConfig,
  initialTask?: string,
  currentTasks?: PomodoroTask[],
  sessionType: string = 'WORK'
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
    breakDuration: config.shortBreakDuration,
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