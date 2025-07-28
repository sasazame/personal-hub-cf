import { useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'
import { CreateTodoDto, RepeatType } from '@/types/todo'
import { Modal, ModalHeader, ModalTitle, ModalContent } from '@/components/ui'
import { FormInput, FormTextArea, FormSelect, FormCheckbox } from '@/components/ui/FormField'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui'
import { Calendar } from 'lucide-react'

interface TodoFormProps {
  onSubmit: (data: CreateTodoDto) => void
  onCancel: () => void
  isSubmitting?: boolean
  parentId?: number | null
}

export function TodoForm({ onSubmit, onCancel, isSubmitting, parentId }: TodoFormProps) {
  const [isRepeatable, setIsRepeatable] = useState(false)
  const [repeatType, setRepeatType] = useState<RepeatType>('DAILY')
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  
  const form = useForm<CreateTodoDto>({
    defaultValues: {
      status: 'TODO',
      priority: 'MEDIUM',
      parentId: parentId || undefined,
      isRepeatable: false,
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = form

  useEffect(() => {
    setValue('isRepeatable', isRepeatable)
  }, [isRepeatable, setValue])

  useEffect(() => {
    if (isRepeatable) {
      setValue('repeatConfig', {
        repeatType,
        daysOfWeek: repeatType === 'WEEKLY' ? selectedDays : null,
      })
    } else {
      setValue('repeatConfig', null)
    }
  }, [isRepeatable, repeatType, selectedDays, setValue])

  const statusOptions = [
    { value: 'TODO', label: 'To Do' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'DONE', label: 'Done' },
  ]

  const priorityOptions = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
  ]

  const repeatTypeOptions = [
    { value: 'DAILY', label: 'Daily' },
    { value: 'WEEKLY', label: 'Weekly' },
    { value: 'MONTHLY', label: 'Monthly' },
  ]

  const handleFormSubmit = (data: CreateTodoDto) => {
    onSubmit(data)
  }

  return (
    <Modal open={true} onClose={onCancel}>
      <ModalHeader>
        <ModalTitle>
          {parentId ? 'New Subtask' : 'New Todo'}
        </ModalTitle>
      </ModalHeader>
      
      <ModalContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <FormInput
            {...register('title', { required: 'Title is required' })}
            id="title"
            label="Title"
            required
            error={errors.title}
          />

          <FormTextArea
            {...register('description')}
            id="description"
            label="Description"
            rows={3}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormSelect
              {...register('status')}
              id="status"
              label="Status"
              options={statusOptions}
            />

            <FormSelect
              {...register('priority')}
              id="priority"
              label="Priority"
              options={priorityOptions}
            />
          </div>

          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-foreground mb-1">
              Due Date
            </label>
            <div className="relative">
              <Input
                {...register('dueDate')}
                type="datetime-local"
                id="dueDate"
                className="pl-10"
                label=""
              />
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            </div>
          </div>

          {!parentId && (
            <div className="border-t pt-4">
              <FormCheckbox
                id="isRepeatable"
                label="Make this a recurring task"
                checked={isRepeatable}
                onChange={(e) => setIsRepeatable(e.target.checked)}
              />

              {isRepeatable && (
                <div className="mt-4 space-y-4">
                  <FormSelect
                    value={repeatType}
                    onChange={(e) => setRepeatType(e.target.value as RepeatType)}
                    id="repeatType"
                    label="Repeat Type"
                    options={repeatTypeOptions}
                  />

                  {repeatType === 'WEEKLY' && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Repeat on days
                      </label>
                      <div className="grid grid-cols-7 gap-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                          <label key={day} className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={selectedDays.includes(index)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedDays([...selectedDays, index].sort())
                                } else {
                                  setSelectedDays(selectedDays.filter(d => d !== index))
                                }
                              }}
                              className="sr-only"
                            />
                            <span className={`
                              w-10 h-10 flex items-center justify-center rounded-md text-xs font-medium cursor-pointer
                              ${selectedDays.includes(index)
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }
                            `}>
                              {day}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
            >
              {parentId ? 'Add Subtask' : 'Add Todo'}
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  )
}