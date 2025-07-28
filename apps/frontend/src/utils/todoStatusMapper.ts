import type { TodoStatus } from '@/types/todo'

// Map API status to display status for backward compatibility
export function mapApiStatusToDisplay(apiStatus: TodoStatus): TodoStatus {
  return apiStatus // In our case, we'll use the same statuses
}

export function getStatusColorClass(status: TodoStatus): string {
  switch (status) {
    case 'TODO':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'IN_PROGRESS':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    case 'DONE':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  }
}