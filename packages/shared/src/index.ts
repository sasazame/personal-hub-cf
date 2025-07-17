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
  type TodoStatusType,
  type TodoPriorityType,
  type RepeatTypeType,
  type CreateTodoInput,
  type UpdateTodoInput,
  type TodoQuery,
  type PaginatedTodos,
  type Todo as TodoType
} from './types/todo';

// Export goal types
export {
  GoalTypes,
  GoalStatuses,
  type GoalType,
  type GoalStatus,
  createGoalSchema,
  updateGoalSchema,
  goalProgressSchema,
  goalQuerySchema,
  type CreateGoalInput,
  type UpdateGoalInput,
  type GoalProgressInput,
  type GoalQuery,
  type Goal,
  type GoalProgressType,
  type PaginatedGoals,
  type GoalWithProgress
} from './types/goal';

// Export event types
export {
  eventSchema,
  createEventSchema,
  updateEventSchema,
  listEventsQuerySchema,
  type CreateEventRequest,
  type UpdateEventRequest,
  type ListEventsQuery,
  type EventResponse,
  type EventsListResponse,
  eventToResponse,
  requestToNewEvent
} from './api/events';

// Export database schema - but rename conflicting types
export * from './db/schema';