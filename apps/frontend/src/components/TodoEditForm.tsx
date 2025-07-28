import { useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'
import { Todo, UpdateTodoDto, RepeatType } from '@/types/todo'
import { Modal, ModalHeader, ModalTitle, ModalContent } from '@/components/ui'
import { Input } from '@/components/ui'
import { TextArea } from '@/components/ui'
import { Button } from '@/components/ui'
import { Repeat, Calendar } from 'lucide-react'

interface TodoEditFormProps {
  todo: Todo
  onSubmit: (data: UpdateTodoDto) => void
  onCancel: () => void
  onDelete: () => void
  isSubmitting?: boolean
  isDeleting?: boolean
}

export function TodoEditForm({ todo, onSubmit, onCancel, onDelete, isSubmitting, isDeleting }: TodoEditFormProps) {
  const [isRepeatable, setIsRepeatable] = useState(todo.isRepeatable || false)
  const [repeatType, setRepeatType] = useState<RepeatType>(todo.repeatConfig?.repeatType || 'DAILY')
  const [selectedDays, setSelectedDays] = useState<number[]>(todo.repeatConfig?.daysOfWeek || [])

  const form = useForm<UpdateTodoDto>({
    defaultValues: {
      title: todo.title,
      description: todo.description,
      status: todo.status,
      priority: todo.priority,
      dueDate: todo.dueDate ? todo.dueDate.split('T')[0] : '',
      isRepeatable: todo.isRepeatable || false,
      repeatConfig: todo.repeatConfig || null,
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = form

  const handleFormSubmit = (data: UpdateTodoDto) => {
    onSubmit(data)
  }

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onCancel])

  return (
    <Modal open={true} onClose={onCancel}>
      <ModalHeader onClose={onCancel}>
        <ModalTitle>Edit Todo</ModalTitle>
      </ModalHeader>
      
      <ModalContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <Input
              {...register('title', { required: 'Title is required' })}
              type="text"
              id="title"
              label="Title *"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div>
            <TextArea
              {...register('description')}
              id="description"
              rows={3}
              label="Description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium mb-1">
                Status
              </label>
              <select
                {...register('status')}
                id="status"
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium mb-1">
                Priority
              </label>
              <select
                {...register('priority')}
                id="priority"
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          <div>
            <Input
              {...register('dueDate')}
              type="date"
              id="dueDate"
              label="Due Date"
            />
          </div>

          {/* Recurring Task Settings */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="isRepeatable"
                checked={isRepeatable}
                onChange={(e) => {
                  const checked = e.target.checked
                  setIsRepeatable(checked)
                  setValue('isRepeatable', checked)
                  if (!checked) {
                    setValue('repeatConfig', null)
                  } else {
                    setValue('repeatConfig', {
                      repeatType: repeatType,
                      interval: todo.repeatConfig?.interval || 1,
                      daysOfWeek: selectedDays.length > 0 ? selectedDays : null,
                      dayOfMonth: todo.repeatConfig?.dayOfMonth || null,
                      endDate: todo.repeatConfig?.endDate || null,
                    })
                  }
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isRepeatable" className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Repeat className="h-4 w-4" />
                Recurring Task
              </label>
            </div>

            {isRepeatable && (
              <div className="space-y-4 pl-6 border-l-2 border-gray-200 dark:border-gray-700">
                {/* Repeat Type */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Pattern
                  </label>
                  <select
                    {...register('repeatConfig.repeatType')}
                    value={repeatType}
                    onChange={(e) => {
                      const type = e.target.value as RepeatType
                      setRepeatType(type)
                      setValue('repeatConfig.repeatType', type)
                      setSelectedDays([])
                    }}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>

                {/* Interval */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Interval
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      {...register('repeatConfig.interval', { min: 1, max: 365 })}
                      type="number"
                      min="1"
                      max="365"
                      defaultValue={todo.repeatConfig?.interval || 1}
                      className="w-20 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                    />
                    <span className="text-sm text-muted-foreground">
                      {repeatType === 'DAILY' && 'day(s)'}
                      {repeatType === 'WEEKLY' && 'week(s)'}
                      {repeatType === 'MONTHLY' && 'month(s)'}
                      {repeatType === 'YEARLY' && 'year(s)'}
                    </span>
                  </div>
                </div>

                {/* Days of Week (for WEEKLY) */}
                {repeatType === 'WEEKLY' && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Days of Week
                    </label>
                    <div className="flex gap-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            const dayNumber = index === 0 ? 7 : index // Sunday is 7 in backend
                            const newDays = selectedDays.includes(dayNumber)
                              ? selectedDays.filter(d => d !== dayNumber)
                              : [...selectedDays, dayNumber]
                            setSelectedDays(newDays)
                            setValue('repeatConfig.daysOfWeek', newDays.length > 0 ? newDays : null)
                          }}
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            selectedDays.includes(index === 0 ? 7 : index)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Day of Month (for MONTHLY) */}
                {repeatType === 'MONTHLY' && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Day of Month
                    </label>
                    <input
                      {...register('repeatConfig.dayOfMonth', { min: 1, max: 31 })}
                      type="number"
                      min="1"
                      max="31"
                      defaultValue={todo.repeatConfig?.dayOfMonth || ''}
                      placeholder="e.g., 15"
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                    />
                  </div>
                )}

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    End Date
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <input
                      {...register('repeatConfig.endDate')}
                      type="date"
                      defaultValue={todo.repeatConfig?.endDate || ''}
                      className="flex-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty for no end date
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between mt-6">
            <Button
              type="button"
              variant="danger"
              onClick={onDelete}
              disabled={isSubmitting || isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={onCancel}
                disabled={isSubmitting || isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isDeleting}
              >
                {isSubmitting ? 'Updating...' : 'Update Todo'}
              </Button>
            </div>
          </div>
        </form>
      </ModalContent>
    </Modal>
  )
}