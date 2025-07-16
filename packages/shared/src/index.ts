// Export user types
export { userSchema, type User } from './types';

// Export todo types
export { 
  TodoStatus,
  TodoPriority,
  RepeatType,
  createTodoSchema,
  updateTodoSchema,
  todoQuerySchema,
  type CreateTodoInput,
  type UpdateTodoInput,
  type TodoQuery,
  type PaginatedTodos,
  type Todo as TodoType
} from './types/todo';

// Export database schema - but rename conflicting types
export * from './db/schema';