import { useState, memo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Todo, CreateTodoDto } from '@/types/todo'
import { todoApi } from '@/lib/todo-api'
import { Button } from '@/components/ui'
import { Check, ChevronDown, ChevronRight, Edit2, Repeat, Link, Copy, Trash2, Plus } from 'lucide-react'
import { showSuccess, showError } from '@/components/ui/toast'
import { cn } from '@/lib/cn'
import { DropdownMenu, MenuItem } from '@/components/ui/DropdownMenu'
import { mapApiStatusToDisplay, getStatusColorClass } from '@/utils/todoStatusMapper'

interface TodoItemProps {
  todo: Todo
  onUpdate: (id: number, todo: Todo) => void
  onDelete: (id: number, todo: Todo) => void
  onAddChild: (parentId: number) => void
  level?: number
}

export const TodoItem = memo(function TodoItem({ todo, onUpdate, onDelete, onAddChild, level = 0 }: TodoItemProps) {
  const [showChildren, setShowChildren] = useState(false)
  const [isHoveringCheckbox, setIsHoveringCheckbox] = useState(false)
  const queryClient = useQueryClient()
  
  // Check if todo is overdue
  const isOverdue = todo.status !== 'DONE' && todo.dueDate && new Date(todo.dueDate) < new Date(new Date().setHours(0, 0, 0, 0))
  
  // Check if todo has children
  const { data: childrenCheck = [] } = useQuery({
    queryKey: ['todos', todo.id, 'hasChildren'],
    queryFn: () => todoApi.getChildren(todo.id),
    enabled: level === 0, // Only check for parent todos
  })

  const hasChildren = childrenCheck.length > 0

  const { data: children = [], isLoading } = useQuery({
    queryKey: ['todos', todo.id, 'children'],
    queryFn: () => todoApi.getChildren(todo.id),
    enabled: showChildren && hasChildren,
  })

  // Mutation for quick status toggle
  const toggleStatusMutation = useMutation({
    mutationFn: async () => {
      const updatedTodo = await todoApi.toggleStatus(todo.id)
      return updatedTodo
    },
    onSuccess: (updatedTodo) => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      queryClient.invalidateQueries({ queryKey: ['recurring-tasks'] })
      showSuccess(updatedTodo.status === 'DONE' ? 'Todo completed' : 'Todo updated')
    },
    onError: (error) => {
      console.error('Failed to update todo status:', error)
      showError('Failed to update todo')
    },
  })

  // Mutation for duplicating todo
  const duplicateMutation = useMutation({
    mutationFn: async () => {
      const newTodo: CreateTodoDto = {
        title: `${todo.title} (copy)`,
        description: todo.description,
        status: todo.status,
        priority: todo.priority,
        dueDate: todo.dueDate,
      }
      return await todoApi.create(newTodo)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      showSuccess('Todo duplicated')
    },
    onError: (error) => {
      console.error('Failed to duplicate todo:', error)
      showError('Failed to duplicate todo')
    },
  })

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleStatusMutation.mutate()
  }

  const handleDuplicate = () => {
    duplicateMutation.mutate()
  }

  const getMenuItems = (): MenuItem[] => {
    const items: MenuItem[] = [
      {
        label: 'Edit',
        onClick: () => onUpdate(todo.id, todo),
        icon: <Edit2 className="h-4 w-4" />,
      },
    ]

    // Only show Create Subtask for parent todos
    if (level === 0) {
      items.push({
        label: 'Create Subtask',
        onClick: () => onAddChild(todo.id),
        icon: <Plus className="h-4 w-4" />,
      })
    }

    items.push(
      {
        label: 'Duplicate',
        onClick: handleDuplicate,
        icon: <Copy className="h-4 w-4" />,
      },
      {
        label: 'Delete',
        onClick: () => onDelete(todo.id, todo),
        icon: <Trash2 className="h-4 w-4" />,
        variant: 'danger',
      }
    )

    return items
  }

  const getStatusColor = (status: Todo['status']) => {
    const displayStatus = mapApiStatusToDisplay(status)
    return getStatusColorClass(displayStatus)
  }

  const getPriorityColor = (priority: Todo['priority']) => {
    switch (priority) {
      case 'LOW':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'HIGH':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    }
  }

  return (
    <div className="space-y-2">
      <div
        className={cn(
          'bg-card border rounded-lg shadow-sm hover:shadow-md transition-all duration-200',
          level > 0 ? 'ml-8 border-l-4 border-primary/30' : '',
          isOverdue ? 'border-red-500 border-2' : 'border-border'
        )}
      >
        <div className="flex items-start p-4 gap-3">
          {/* Checkbox for completion */}
          <button
            type="button"
            onClick={handleToggleComplete}
            onMouseEnter={() => setIsHoveringCheckbox(true)}
            onMouseLeave={() => setIsHoveringCheckbox(false)}
            disabled={toggleStatusMutation.isPending}
            className={`
              relative z-10 mt-1 w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center
              ${todo.status === 'DONE' 
                ? 'bg-primary text-white border-primary' 
                : 'border-gray-400 hover:border-primary hover:bg-primary/10'
              }
              ${toggleStatusMutation.isPending ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
              ${toggleStatusMutation.isPending ? 'animate-pulse' : ''}
              focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
            `}
            aria-label={todo.status === 'DONE' ? 'Mark incomplete' : 'Mark complete'}
            title={todo.status === 'DONE' ? 'Mark incomplete' : 'Mark complete'}
          >
            {(todo.status === 'DONE' || isHoveringCheckbox) && (
              <Check className="w-3 h-3" strokeWidth={3} />
            )}
          </button>

          {/* Main content */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {hasChildren && level === 0 && (
                  <button
                    onClick={() => setShowChildren(!showChildren)}
                    className="p-1 hover:bg-muted rounded transition-colors"
                    aria-label={showChildren ? 'Hide subtasks' : 'Show subtasks'}
                  >
                    {showChildren ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                )}
                <div className="flex items-center gap-2">
                  <h3 className={`text-lg font-semibold ${todo.status === 'DONE' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {todo.title}
                  </h3>
                  {todo.isRepeatable && (
                    <Repeat className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  )}
                  {todo.originalTodoId && (
                    <Link className="w-4 h-4 text-green-600 dark:text-green-400" />
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
                    todo.status
                  )}`}
                >
                  {todo.status === 'TODO' ? 'To Do' : todo.status === 'IN_PROGRESS' ? 'In Progress' : 'Done'}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(todo.priority)}`}>
                  {todo.priority}
                </span>
              </div>
            </div>
            
            {todo.description && (
              <p className={`text-muted-foreground mb-3 ${todo.status === 'DONE' ? 'line-through' : ''}`}>
                {todo.description}
              </p>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {todo.dueDate && (
                  <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                    Due: {new Date(todo.dueDate).toLocaleDateString()}
                  </span>
                )}
                {todo.status === 'DONE' && todo.updatedAt && (
                  <span>Completed: {new Date(todo.updatedAt).toLocaleDateString()}</span>
                )}
                {level === 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onAddChild(todo.id)}
                    className="text-xs"
                  >
                    Add Subtask
                  </Button>
                )}
              </div>
              
              {/* Dropdown menu in bottom right */}
              <DropdownMenu
                items={getMenuItems()}
                buttonClassName="h-8"
              />
            </div>
          </div>
        </div>
      </div>
      
      {showChildren && !isLoading && children.length > 0 && (
        <div className="space-y-2">
          {children.map((child) => (
            <TodoItem
              key={child.id}
              todo={child}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onAddChild={onAddChild}
              level={level + 1}
            />
          ))}
        </div>
      )}
      
      {showChildren && isLoading && (
        <div className="ml-8 text-muted-foreground">Loading subtasks...</div>
      )}
    </div>
  )
})