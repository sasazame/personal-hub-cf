import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { api } from '../lib/api';
import type { TodoType as Todo, UpdateTodoInput, TodoStatus, TodoPriority } from '@personal-hub/shared';

interface TodoItemProps {
  todo: Todo;
  onToggleStatus: () => void;
  onDelete: () => void;
  onUpdate: () => void;
}

export function TodoItem({ todo, onToggleStatus, onDelete, onUpdate }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<UpdateTodoInput>({
    title: todo.title,
    description: todo.description || '',
    priority: todo.priority,
    status: todo.status,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateTodoInput) => {
      await api.put(`/api/todos/${todo.id}`, data);
    },
    onSuccess: () => {
      setIsEditing(false);
      onUpdate();
    },
  });

  const handleSave = () => {
    updateMutation.mutate(editData);
  };

  const getStatusColor = (status: TodoStatus) => {
    switch (status) {
      case 'TODO':
        return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'DONE':
        return 'bg-green-100 text-green-800';
    }
  };

  const getPriorityColor = (priority: TodoPriority) => {
    switch (priority) {
      case 'HIGH':
        return 'text-red-600';
      case 'MEDIUM':
        return 'text-yellow-600';
      case 'LOW':
        return 'text-gray-600';
    }
  };

  if (isEditing) {
    return (
      <Card className="p-4" data-testid={`todo-item-${todo.id}`}>
        <div className="space-y-3">
          <Input
            value={editData.title}
            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
            placeholder="Title"
            data-testid={`todo-edit-title-${todo.id}`}
          />
          <textarea
            value={editData.description || ''}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            placeholder="Description"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            rows={3}
            data-testid={`todo-edit-description-${todo.id}`}
          />
          <div className="flex gap-4">
            <select
              value={editData.priority}
              onChange={(e) => setEditData({ ...editData, priority: e.target.value as TodoPriority })}
              className="border rounded px-2 py-1"
              data-testid={`todo-edit-priority-${todo.id}`}
            >
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
            <div className="flex gap-2 ml-auto">
              <Button onClick={handleSave} size="sm" data-testid={`todo-save-${todo.id}`}>
                Save
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditing(false)}
                data-testid={`todo-cancel-edit-${todo.id}`}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4" data-testid={`todo-item-${todo.id}`}>
      <div className="flex items-start gap-4">
        <div className="flex-grow">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold" data-testid={`todo-title-${todo.id}`}>
              {todo.title}
            </h3>
            <span 
              className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(todo.status)}`}
              data-testid={`todo-status-${todo.id}`}
            >
              {todo.status.replace('_', ' ')}
            </span>
            <span 
              className={`text-xs font-medium ${getPriorityColor(todo.priority)}`}
              data-testid={`todo-priority-${todo.id}`}
            >
              {todo.priority}
            </span>
          </div>
          {todo.description && (
            <p className="text-sm text-gray-600" data-testid={`todo-description-${todo.id}`}>
              {todo.description}
            </p>
          )}
          {todo.dueDate && (
            <p className="text-xs text-gray-500 mt-1">
              Due: {new Date(todo.dueDate).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleStatus}
            data-testid={`todo-status-toggle-${todo.id}`}
          >
            Toggle Status
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            data-testid={`todo-edit-${todo.id}`}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            data-testid={`todo-delete-${todo.id}`}
          >
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
}