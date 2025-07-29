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
        sort: { sorted: true, ascending: false },
      },
      totalElements: total,
      totalPages,
      first: currentPage === 1,
      last: currentPage === totalPages,
    }
  },

  async getByStatus(status: TodoStatus): Promise<Todo[]> {
    const response = await apiClient.get(`/api/v1/todos/status/${status}`)
    return response.data
  },

  async getById(id: number): Promise<Todo> {
    const response = await apiClient.get(`/api/v1/todos/${id}`)
    return response.data
  },

  async getChildren(parentId: number): Promise<Todo[]> {
    const response = await apiClient.get(`/api/v1/todos/${parentId}/children`)
    return response.data
  },

  async create(data: CreateTodoDto): Promise<Todo> {
    // Transform repeatConfig to individual fields for backend
    const backendData: any = {
      ...data,
      repeatType: data.repeatConfig?.repeatType,
      repeatInterval: data.repeatConfig?.interval,
      repeatDaysOfWeek: data.repeatConfig?.daysOfWeek,
      repeatDayOfMonth: data.repeatConfig?.dayOfMonth,
      repeatEndDate: data.repeatConfig?.endDate,
    }
    delete backendData.repeatConfig
    
    const response = await apiClient.post('/api/v1/todos', backendData)
    return response.data
  },

  async update(id: number, data: UpdateTodoDto): Promise<Todo> {
    const response = await apiClient.put(`/api/v1/todos/${id}`, data)
    return response.data
  },

  async toggleStatus(id: number): Promise<Todo> {
    const response = await apiClient.put(`/api/v1/todos/${id}/toggle-status`)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/api/v1/todos/${id}`)
  },

  async generateInstances(): Promise<void> {
    await apiClient.post('/api/v1/todos/generate-instances')
  },

  async getRecurringTasks(): Promise<Todo[]> {
    const response = await apiClient.get('/api/v1/todos/recurring')
    return response.data
  }
}