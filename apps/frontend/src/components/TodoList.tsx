import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { todoApi } from '../lib/todos'
import { TodoItem } from './TodoItem'
import { Button } from '@personal-hub/ui'
import { TodoForm } from './TodoForm'
import type { TodoQuery } from '@personal-hub/shared'

const DEFAULT_FILTER: TodoQuery = {
  limit: 10,
  page: 1,
  sortBy: 'createdAt',
  sortOrder: 'desc',
}

export function TodoList() {
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<TodoQuery>(DEFAULT_FILTER)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['todos', filter],
    queryFn: () => todoApi.list(filter),
  })

  const handlePageChange = (newPage: number) => {
    setFilter(prev => ({ ...prev, page: newPage }))
  }

  const handleCreateSuccess = () => {
    setShowForm(false)
    refetch()
  }

  if (isLoading) {
    return <div className="text-center py-4">Loading todos...</div>
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-500">
        Error loading todos: {error.message}
      </div>
    )
  }

  const { todos, page, totalPages } = data || { todos: [], page: 1, totalPages: 0 }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Todos</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add Todo'}
        </Button>
      </div>

      {showForm && (
        <div className="border rounded-lg p-4 bg-muted/50">
          <TodoForm onSuccess={handleCreateSuccess} onCancel={() => setShowForm(false)} />
        </div>
      )}

      <div className="space-y-2">
        {todos.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            No todos yet. Create your first todo to get started!
          </p>
        ) : (
          todos.map(todo => (
            <TodoItem key={todo.id} todo={todo} onUpdate={refetch} />
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}