/**
 * API Client Example for Personal Hub
 * 
 * This is a reference implementation showing how to interact with the API.
 * Copy and adapt this code for your frontend application.
 */

import type {
  ApiError,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  Todo,
  CreateTodoRequest,
  UpdateTodoRequest,
  TodoFilters,
} from './types';

class ApiClient {
  private baseURL: string;
  private accessToken: string | null = null;

  constructor(baseURL: string = 'http://localhost:8787') {
    this.baseURL = baseURL;
  }

  /**
   * Set the access token for authenticated requests
   */
  setAccessToken(token: string) {
    this.accessToken = token;
  }

  /**
   * Clear the access token
   */
  clearAccessToken() {
    this.accessToken = null;
  }

  /**
   * Make an HTTP request to the API
   */
  private async request<T>(
    method: string,
    path: string,
    options?: {
      body?: any;
      params?: Record<string, any>;
      headers?: Record<string, string>;
    }
  ): Promise<T> {
    const url = new URL(path, this.baseURL);
    
    // Add query parameters
    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    // Add auth header if token is available
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    // Handle 204 No Content
    if (response.status === 204) {
      return null as T;
    }

    const data = await response.json();

    // Handle errors
    if (!response.ok) {
      throw data as ApiError;
    }

    return data as T;
  }

  // Auth Methods
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('POST', '/auth/register', {
      body: data,
    });
    this.setAccessToken(response.accessToken);
    return response;
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('POST', '/auth/login', {
      body: data,
    });
    this.setAccessToken(response.accessToken);
    return response;
  }

  async refreshToken(refreshToken: string): Promise<string> {
    const response = await this.request<{ accessToken: string }>('POST', '/auth/refresh', {
      body: { refreshToken },
    });
    this.setAccessToken(response.accessToken);
    return response.accessToken;
  }

  async logout(): Promise<void> {
    await this.request('POST', '/auth/logout');
    this.clearAccessToken();
  }

  // Todo Methods
  async getTodos(filters?: TodoFilters): Promise<Todo[]> {
    return this.request<Todo[]>('GET', '/todos', { params: filters });
  }

  async createTodo(data: CreateTodoRequest): Promise<Todo> {
    return this.request<Todo>('POST', '/todos', { body: data });
  }

  async updateTodo(id: string, data: UpdateTodoRequest): Promise<Todo> {
    return this.request<Todo>('PUT', `/todos/${id}`, { body: data });
  }

  async deleteTodo(id: string): Promise<void> {
    await this.request('DELETE', `/todos/${id}`);
  }

  // Add more methods for other resources...
}

// Usage Example
async function example() {
  const api = new ApiClient();

  try {
    // Register a new user
    const authResponse = await api.register({
      email: 'user@example.com',
      password: 'SecurePass123!',
      username: 'johndoe',
    });
    console.log('Registered:', authResponse.user);

    // Create a todo
    const todo = await api.createTodo({
      title: 'Complete API integration',
      priority: 'HIGH',
      tags: 'development,urgent',
    });
    console.log('Created todo:', todo);

    // Get all todos
    const todos = await api.getTodos({
      status: 'TODO',
      limit: 10,
    });
    console.log('Todos:', todos);

    // Update todo status
    const updatedTodo = await api.updateTodo(todo.id, {
      status: 'IN_PROGRESS',
    });
    console.log('Updated:', updatedTodo);

    // Delete todo
    await api.deleteTodo(todo.id);
    console.log('Deleted todo');

  } catch (error) {
    if ('code' in error) {
      // API error
      console.error(`API Error ${error.code}: ${error.message}`);
      if (error.details) {
        console.error('Details:', error.details);
      }
    } else {
      // Network or other error
      console.error('Error:', error);
    }
  }
}

// React Hook Example
function useApi() {
  const [api] = useState(() => new ApiClient());
  
  useEffect(() => {
    // Load token from storage
    const token = localStorage.getItem('accessToken');
    if (token) {
      api.setAccessToken(token);
    }
  }, [api]);

  return api;
}

// Vue Composable Example
function useApi() {
  const api = new ApiClient();
  
  onMounted(() => {
    // Load token from storage
    const token = localStorage.getItem('accessToken');
    if (token) {
      api.setAccessToken(token);
    }
  });

  return api;
}

export default ApiClient;