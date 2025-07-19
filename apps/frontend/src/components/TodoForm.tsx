import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { api } from '../lib/api';
import type { CreateTodoInput, TodoPriority } from '@personal-hub/shared';

interface TodoFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function TodoForm({ onSuccess, onCancel }: TodoFormProps) {
  const [formData, setFormData] = useState<CreateTodoInput>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    status: 'TODO',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CreateTodoInput, string>>>({});

  const createTodoMutation = useMutation({
    mutationFn: async (data: CreateTodoInput) => {
      const response = await api.post('/api/todos', data);
      return response.data;
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: (error: any) => {
      if (error.response?.data?.errors) {
        const fieldErrors: Record<string, string> = {};
        error.response.data.errors.forEach((err: any) => {
          if (err.path && err.path[0]) {
            fieldErrors[err.path[0]] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    if (!formData.title.trim()) {
      setErrors({ title: 'Title is required' });
      return;
    }

    createTodoMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title*</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter todo title"
          data-testid="todo-title-input"
          className={errors.title ? 'border-red-500' : ''}
        />
        {errors.title && (
          <p className="text-red-500 text-sm mt-1">{errors.title}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter description (optional)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          rows={3}
          data-testid="todo-description-input"
        />
      </div>

      <div className="flex gap-4">
        <div>
          <Label htmlFor="priority">Priority</Label>
          <select
            id="priority"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as TodoPriority })}
            className="border rounded px-3 py-2"
            data-testid="todo-priority-select"
          >
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <div>
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            id="dueDate"
            type="date"
            value={formData.dueDate ? formData.dueDate.split('T')[0] : ''}
            onChange={(e) => {
              const date = e.target.value ? new Date(e.target.value).toISOString() : undefined;
              setFormData({ ...formData, dueDate: date });
            }}
            data-testid="todo-due-date-input"
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button
          type="submit"
          disabled={createTodoMutation.isPending}
          data-testid="todo-submit-button"
        >
          {createTodoMutation.isPending ? 'Creating...' : 'Create Todo'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          data-testid="todo-cancel-button"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}