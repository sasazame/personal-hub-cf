import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Card, CardContent, Button } from '@personal-hub/ui'
import { todoApi } from '../lib/todos'
import { TodoStatus, TodoPriority, type TodoType } from '@personal-hub/shared'
import { Check, Circle, Clock, Trash2, Edit2, AlertCircle } from 'lucide-react'

interface TodoItemProps {
  todo: TodoType
  onUpdate: () => void
}

export function TodoItem({ todo, onUpdate }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false)

  const updateMutation = useMutation({
    mutationFn: (data: { status?: TodoStatus }) => 
      todoApi.update(todo.id, data),
    onSuccess: () => {
      onUpdate()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => todoApi.delete(todo.id),
    onSuccess: () => {
      onUpdate()
    },
  })

  const handleStatusToggle = () => {
    const nextStatus = todo.status === TodoStatus.DONE 
      ? TodoStatus.TODO 
      : todo.status === TodoStatus.TODO
      ? TodoStatus.IN_PROGRESS
      : TodoStatus.DONE

    updateMutation.mutate({ status: nextStatus })
  }

  const StatusIcon = () => {
    switch (todo.status) {
      case TodoStatus.DONE:
        return <Check className="h-5 w-5 text-green-500" />
      case TodoStatus.IN_PROGRESS:
        return <Clock className="h-5 w-5 text-blue-500" />
      default:
        return <Circle className="h-5 w-5 text-gray-400" />
    }
  }

  const PriorityIndicator = () => {
    switch (todo.priority) {
      case TodoPriority.HIGH:
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case TodoPriority.LOW:
        return <div className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return null
    return new Date(date).toLocaleDateString()
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <button
            onClick={handleStatusToggle}
            className="mt-0.5 p-0 hover:scale-110 transition-transform"
            disabled={updateMutation.isPending}
          >
            <StatusIcon />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <PriorityIndicator />
              <div className="flex-1">
                <h3 className={`font-medium ${
                  todo.status === TodoStatus.DONE ? 'line-through text-muted-foreground' : ''
                }`}>
                  {todo.title}
                </h3>
                {todo.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {todo.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                  {todo.dueDate && (
                    <span>Due: {formatDate(todo.dueDate)}</span>
                  )}
                  {todo.isRepeatable && (
                    <span className="text-blue-600">Repeating: {todo.repeatType}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsEditing(!isEditing)}
              disabled={deleteMutation.isPending || updateMutation.isPending}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending || updateMutation.isPending}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>

        {isEditing && (
          <div className="mt-4 p-4 border rounded bg-muted/50">
            <p className="text-sm text-muted-foreground">
              Edit functionality will be implemented next
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}