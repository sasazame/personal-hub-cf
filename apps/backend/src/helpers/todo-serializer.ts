import type { TodoStatusType, TodoPriorityType, RepeatTypeType } from '@personal-hub/shared';

interface DbTodo {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  dueDate: Date | null;
  parentId: string | null;
  isRepeatable: number | boolean;
  repeatType: string | null;
  repeatInterval: number | null;
  repeatDaysOfWeek: string | null;
  repeatDayOfMonth: number | null;
  repeatEndDate: Date | null;
  originalTodoId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SerializedTodo {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: TodoStatusType;
  priority: TodoPriorityType;
  dueDate: string | null;
  parentId: string | null;
  isRepeatable: boolean;
  repeatType: RepeatTypeType | null;
  repeatInterval: number | null;
  repeatDaysOfWeek: string | null;
  repeatDayOfMonth: number | null;
  repeatEndDate: string | null;
  originalTodoId: string | null;
  createdAt: string;
  updatedAt: string;
}

export function serializeTodo(todo: DbTodo): SerializedTodo {
  return {
    ...todo,
    status: todo.status as TodoStatusType,
    priority: (todo.priority || 'MEDIUM') as TodoPriorityType,
    repeatType: todo.repeatType as RepeatTypeType | null,
    isRepeatable: Boolean(todo.isRepeatable),
    createdAt: todo.createdAt.toISOString(),
    updatedAt: todo.updatedAt.toISOString(),
    dueDate: todo.dueDate ? todo.dueDate.toISOString() : null,
    repeatEndDate: todo.repeatEndDate ? todo.repeatEndDate.toISOString() : null,
  };
}

export function serializeTodos(todos: DbTodo[]): SerializedTodo[] {
  return todos.map(serializeTodo);
}