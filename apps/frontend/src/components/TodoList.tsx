import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TodoItem } from './TodoItem';
import { TodoForm } from './TodoForm';
import { Button } from './ui/button';
import { api } from '../lib/api';
import type { PaginatedTodos, TodoStatus, TodoPriority } from '@personal-hub/shared';

export function TodoList() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TodoStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TodoPriority | ''>('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<PaginatedTodos>({
    queryKey: ['todos', page, statusFilter, priorityFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(statusFilter && { status: statusFilter }),
        ...(priorityFilter && { priority: priorityFilter }),
      });
      const response = await api.get(`/api/todos?${params}`);
      return response.data;
    },
  });

  const deleteTodoMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/todos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/api/todos/${id}/toggle-status`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  const handleAddTodo = () => {
    setShowAddForm(false);
    queryClient.invalidateQueries({ queryKey: ['todos'] });
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading todos...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-4">Error loading todos</div>;
  }

  const { todos = [], totalPages = 1 } = data || {};

  return (
    <div className="space-y-4" data-testid="todo-list">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Todos</h2>
        <Button 
          onClick={() => setShowAddForm(!showAddForm)} 
          data-testid="add-todo-button"
        >
          {showAddForm ? 'Cancel' : 'Add Todo'}
        </Button>
      </div>

      {showAddForm && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <TodoForm onSuccess={handleAddTodo} onCancel={() => setShowAddForm(false)} />
        </div>
      )}

      <div className="flex gap-4 items-center">
        <div>
          <label htmlFor="status-filter" className="text-sm font-medium mr-2">
            Status:
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TodoStatus | '')}
            className="border rounded px-2 py-1"
            data-testid="todo-status-filter"
          >
            <option value="">All</option>
            <option value="TODO">Todo</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>
        </div>

        <div>
          <label htmlFor="priority-filter" className="text-sm font-medium mr-2">
            Priority:
          </label>
          <select
            id="priority-filter"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as TodoPriority | '')}
            className="border rounded px-2 py-1"
            data-testid="todo-priority-filter"
          >
            <option value="">All</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        {todos.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No todos found</p>
        ) : (
          todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggleStatus={() => toggleStatusMutation.mutate(todo.id)}
              onDelete={() => deleteTodoMutation.mutate(todo.id)}
              onUpdate={() => queryClient.invalidateQueries({ queryKey: ['todos'] })}
            />
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            data-testid="todo-prev-page"
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            data-testid="todo-next-page"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}