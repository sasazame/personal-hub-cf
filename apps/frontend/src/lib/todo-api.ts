import { apiClient } from './api-client'
import type { Todo, CreateTodoDto, UpdateTodoDto, PaginatedResponse, TodoStatus } from '../types/todo'

export const todoApi = {
  async getAll(page = 0, size = 20): Promise<PaginatedResponse<Todo>> {
    const response = await apiClient.get('/api/v1/todos', {
      params: { page, size, sort: 'createdAt,desc' }
    })
    return response.data
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
    const response = await apiClient.post('/api/v1/todos', data)
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