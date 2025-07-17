import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Button, Input, Label } from '@personal-hub/ui'
import { todoApi } from '../lib/todos'
import { 
  createTodoSchema, 
  type CreateTodoInput,
  TodoStatus,
  TodoPriority
} from '@personal-hub/shared'

interface TodoFormProps {
  onSuccess: () => void
  onCancel: () => void
  initialData?: Partial<CreateTodoInput>
}

export function TodoForm({ onSuccess, onCancel, initialData }: TodoFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateTodoInput>({
    resolver: zodResolver(createTodoSchema),
    defaultValues: {
      status: TodoStatus.TODO,
      priority: TodoPriority.MEDIUM,
      ...initialData,
    },
  })

  const createMutation = useMutation({
    mutationFn: todoApi.create,
    onSuccess: () => {
      onSuccess()
    },
  })

  const onSubmit = (data: CreateTodoInput) => {
    createMutation.mutate(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          {...register('title')}
          placeholder="Enter todo title"
          className={errors.title ? 'border-red-500' : ''}
        />
        {errors.title && (
          <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          {...register('description')}
          placeholder="Enter description (optional)"
        />
        {errors.description && (
          <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            {...register('status')}
            className="w-full h-10 px-3 py-2 text-sm rounded-md border border-input bg-background"
          >
            <option value={TodoStatus.TODO}>To Do</option>
            <option value={TodoStatus.IN_PROGRESS}>In Progress</option>
            <option value={TodoStatus.DONE}>Done</option>
          </select>
        </div>

        <div>
          <Label htmlFor="priority">Priority</Label>
          <select
            id="priority"
            {...register('priority')}
            className="w-full h-10 px-3 py-2 text-sm rounded-md border border-input bg-background"
          >
            <option value={TodoPriority.LOW}>Low</option>
            <option value={TodoPriority.MEDIUM}>Medium</option>
            <option value={TodoPriority.HIGH}>High</option>
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="dueDate">Due Date</Label>
        <Input
          id="dueDate"
          type="date"
          {...register('dueDate')}
        />
        {errors.dueDate && (
          <p className="text-sm text-red-500 mt-1">{errors.dueDate.message}</p>
        )}
      </div>


      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            {...register('isRepeatable')}
            className="h-4 w-4 rounded border-gray-300"
          />
          <span className="text-sm">Repeating task</span>
        </label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting || createMutation.isPending}
        >
          {isSubmitting || createMutation.isPending ? 'Creating...' : 'Create Todo'}
        </Button>
      </div>

      {createMutation.error && (
        <p className="text-sm text-red-500">
          Error: {createMutation.error.message}
        </p>
      )}
    </form>
  )
}