import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { todoApi } from '@/lib/todo-api'
import { Todo, CreateTodoDto, UpdateTodoDto, TodoStatus } from '@/types/todo'
import { showSuccess, showError } from '@/components/ui/toast'
import { Modal, Button } from '@/components/ui'
import { Plus } from 'lucide-react'
import { AppLayout } from '@/components/layout'
import { TodoList } from '@/components/TodoList'
import { TodoForm } from '@/components/TodoForm'
import { TodoEditForm } from '@/components/TodoEditForm'
import { TodoStatusFilter } from '@/components/TodoStatusFilter'

export function Todos() {
  const queryClient = useQueryClient()
  const [isAddingTodo, setIsAddingTodo] = useState(false)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [deletingTodo, setDeletingTodo] = useState<Todo | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<TodoStatus | 'ALL'>('ALL')
  const [parentIdForNewTodo, setParentIdForNewTodo] = useState<number | null>(null)

  const { data: todosResponse, isLoading, error } = useQuery({
    queryKey: ['todos', selectedStatus],
    queryFn: async () => {
      if (selectedStatus === 'ALL') {
        return todoApi.getAll()
      } else {
        const statusTodos = await todoApi.getByStatus(selectedStatus)
        return {
          content: statusTodos,
          pageable: {
            pageNumber: 0,
            pageSize: statusTodos.length,
            sort: { sorted: false },
          },
          totalElements: statusTodos.length,
          totalPages: 1,
          first: true,
          last: true,
        }
      }
    },
  })

  const todos = todosResponse?.content || []

  // Sort todos: incomplete tasks with near deadlines first
  const sortedTodos = [...todos].sort((a, b) => {
    // First, sort by completion status (incomplete first)
    if (a.status === 'DONE' && b.status !== 'DONE') return 1
    if (a.status !== 'DONE' && b.status === 'DONE') return -1
    
    // For incomplete tasks, sort by due date (nearest first)
    if (a.status !== 'DONE' && b.status !== 'DONE') {
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }
      if (a.dueDate && !b.dueDate) return -1
      if (!a.dueDate && b.dueDate) return 1
    }
    
    // For completed tasks or same status, sort by priority (HIGH > MEDIUM > LOW)
    const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 }
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
    if (priorityDiff !== 0) return priorityDiff
    
    // Finally, sort by creation date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const createMutation = useMutation({
    mutationFn: todoApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      setIsAddingTodo(false)
      setParentIdForNewTodo(null)
      showSuccess('Todo added')
    },
    onError: (error) => {
      showError(error instanceof Error ? error.message : 'Failed to create todo')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateTodoDto }) => {
      const updatedTodo = await todoApi.update(id, data)
      
      // If this is a recurring task instance being completed, generate new instances
      if (data.status === 'DONE' && editingTodo?.originalTodoId) {
        try {
          await todoApi.generateInstances()
        } catch (error) {
          console.warn('Failed to generate new recurring task instances:', error)
        }
      }
      
      return updatedTodo
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      queryClient.invalidateQueries({ queryKey: ['recurring-tasks'] })
      setEditingTodo(null)
      showSuccess('Todo updated')
    },
    onError: (error) => {
      showError(error instanceof Error ? error.message : 'Failed to update todo')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: todoApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      setDeletingTodo(null)
      showSuccess('Todo deleted')
    },
    onError: (error) => {
      showError(error instanceof Error ? error.message : 'Failed to delete todo')
    },
  })

  const handleCreate = (data: CreateTodoDto) => {
    const payload = { ...data }
    if (parentIdForNewTodo !== null) {
      payload.parentId = parentIdForNewTodo
    }
    createMutation.mutate(payload)
  }

  const handleUpdate = (_id: number, todo: Todo) => {
    setEditingTodo(todo)
  }

  const handleUpdateSubmit = (data: UpdateTodoDto) => {
    if (editingTodo) {
      updateMutation.mutate({ id: editingTodo.id, data })
    }
  }

  const handleDelete = (_id: number, todo: Todo) => {
    setDeletingTodo(todo)
  }

  const handleDeleteFromEdit = () => {
    if (editingTodo) {
      setDeletingTodo(editingTodo)
      setEditingTodo(null)
    }
  }

  const confirmDelete = () => {
    if (deletingTodo) {
      deleteMutation.mutate(deletingTodo.id)
    }
  }

  const cancelDelete = () => {
    setDeletingTodo(null)
  }

  const handleAddChild = (parentId: number) => {
    setParentIdForNewTodo(parentId)
    setIsAddingTodo(true)
  }

  // Handle Escape key for delete modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && deletingTodo) {
        cancelDelete()
      }
    }

    if (deletingTodo) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [deletingTodo])

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-lg text-muted-foreground">Loading...</div>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-lg text-red-500">Error loading todos</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              TODOs
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your tasks and stay organized.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setParentIdForNewTodo(null)
                setIsAddingTodo(true)
              }}
              gradient="blue"
              size="lg"
              leftIcon={<Plus className="w-5 h-5" />}
            >
              Add Todo
            </Button>
          </div>
        </div>
        
        <TodoStatusFilter
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
        />

        {sortedTodos.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg shadow">
            <p className="text-muted-foreground text-lg">No todos found</p>
          </div>
        ) : (
          <TodoList
            todos={sortedTodos.filter(todo => !todo.parentId)}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onAddChild={handleAddChild}
          />
        )}

        {isAddingTodo && (
          <TodoForm
            onSubmit={handleCreate}
            onCancel={() => {
              setIsAddingTodo(false)
              setParentIdForNewTodo(null)
            }}
            isSubmitting={createMutation.isPending}
            parentId={parentIdForNewTodo}
          />
        )}

        {editingTodo && (
          <TodoEditForm
            todo={editingTodo}
            onSubmit={handleUpdateSubmit}
            onCancel={() => setEditingTodo(null)}
            onDelete={handleDeleteFromEdit}
            isSubmitting={updateMutation.isPending}
            isDeleting={deleteMutation.isPending}
          />
        )}

        {deletingTodo && (
          <Modal open={true} onClose={cancelDelete}>
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-semibold">Delete Todo</h2>
              <p className="text-muted-foreground">
                Are you sure you want to delete this todo? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="secondary"
                  onClick={cancelDelete}
                  disabled={deleteMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={confirmDelete}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AppLayout>
  )
}