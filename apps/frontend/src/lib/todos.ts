import axios from 'axios'
import { 
  type TodoType, 
  type CreateTodoInput, 
  type UpdateTodoInput,
  type TodoQuery,
  type PaginatedTodos 
} from '@personal-hub/shared'

const API_BASE_URL = '/api/todos'

export const todoApi = {
  async create(data: CreateTodoInput): Promise<TodoType> {
    const response = await axios.post(API_BASE_URL, data)
    return response.data
  },

  async getById(id: string): Promise<TodoType> {
    const response = await axios.get(`${API_BASE_URL}/${id}`)
    return response.data
  },

  async list(params?: Partial<TodoQuery>): Promise<PaginatedTodos> {
    const response = await axios.get(API_BASE_URL, { params })
    return response.data
  },

  async update(id: string, data: UpdateTodoInput): Promise<TodoType> {
    const response = await axios.patch(`${API_BASE_URL}/${id}`, data)
    return response.data
  },

  async delete(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/${id}`)
  },

  async getChildren(parentId: string): Promise<TodoType[]> {
    const response = await axios.get(`${API_BASE_URL}/${parentId}/children`)
    return response.data
  },
}