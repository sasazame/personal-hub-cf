import { apiClient } from './api-client'
import type { Todo, CreateTodoDto, UpdateTodoDto, PaginatedResponse, TodoStatus } from '../types/todo'

export const todoApi = {
  async getAll(page = 0, size = 20): Promise<PaginatedResponse<Todo>> {
    const response = await apiClient.get('/api/v1/todos', {
      params: { page: page + 1, limit: size, sort: 'createdAt', order: 'desc' }
    })
    // Convert backend format to Spring Boot format
    const { items, total, page: currentPage, limit, totalPages } = response.data
    return {
      content: items,
      pageable: {
        pageNumber: currentPage - 1,
        pageSize: limit,
        sort: { sorted: true, orderBy: 'createdAt', direction: 'DESC' },
      },
      totalElements: total,
      totalPages,
      first: currentPage === 1,
      last: currentPage === totalPages,
    }
  },

  async getByStatus(status: TodoStatus): Promise<Todo[]> {
    const response = await apiClient.get('/api/v1/todos', {
      params: { status, limit: 100 }
    })
    return response.data.items || []
  },

  async getById(id: number): Promise<Todo> {
    const response = await apiClient.get(`/api/v1/todos/${id}`)
    return response.data
  },

  async getChildren(parentId: number): Promise<Todo[]> {
    const response = await apiClient.get(`/api/v1/todos/${parentId}/subtasks`)
    return response.data
  },

  async create(data: CreateTodoDto): Promise<Todo> {
    // Transform repeatConfig to individual fields for backend
    interface BackendTodoData extends Omit<CreateTodoDto, 'repeatConfig'> {
      repeatType?: string;
      repeatInterval?: number;
      repeatDaysOfWeek?: number[];
      repeatDayOfMonth?: number;
      repeatEndDate?: string;
    }
    
    const backendData: BackendTodoData = {
      ...data,
      repeatType: data.repeatConfig?.repeatType,
      repeatInterval: data.repeatConfig?.interval,
      repeatDaysOfWeek: data.repeatConfig?.daysOfWeek || undefined,
      repeatDayOfMonth: data.repeatConfig?.dayOfMonth || undefined,
      repeatEndDate: data.repeatConfig?.endDate || undefined,
    }
    delete (backendData as CreateTodoDto).repeatConfig
    
    const response = await apiClient.post('/api/v1/todos', backendData)
    return response.data
  },

  async update(id: number, data: UpdateTodoDto): Promise<Todo> {
    const response = await apiClient.put(`/api/v1/todos/${id}`, data)
    return response.data
  },

  async toggleStatus(id: number): Promise<Todo> {
    // First get the current todo to know its status
    const todo = await this.getById(id)
    
    if (todo.status === 'DONE') {
      // If completed, set back to TODO
      const response = await apiClient.put(`/api/v1/todos/${id}`, { status: 'TODO' })
      return response.data
    } else {
      // If not completed, mark as complete
      const response = await apiClient.post(`/api/v1/todos/${id}/complete`)
      return response.data
    }
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/api/v1/todos/${id}`)
  },

  // TODO: These endpoints are not implemented in the backend yet
  async generateInstances(): Promise<void> {
    // await apiClient.post('/api/v1/todos/generate-instances')
    console.warn('generateInstances endpoint not implemented')
  },

  async getRecurringTasks(): Promise<Todo[]> {
    // const response = await apiClient.get('/api/v1/todos/recurring')
    // return response.data
    console.warn('getRecurringTasks endpoint not implemented')
    return []
  }
}