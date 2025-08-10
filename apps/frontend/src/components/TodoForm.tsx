import { useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation(['todos', 'common']);
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
    { value: 'TODO', label: t('status.todo') },
    { value: 'IN_PROGRESS', label: t('status.inProgress') },
    { value: 'DONE', label: t('status.done') },
  ]

  const priorityOptions = [
    { value: 'LOW', label: t('priority.low') },
    { value: 'MEDIUM', label: t('priority.medium') },
    { value: 'HIGH', label: t('priority.high') },
  ]

  const repeatTypeOptions = [
    { value: 'DAILY', label: t('recurring.daily') },
    { value: 'WEEKLY', label: t('recurring.weekly') },
    { value: 'MONTHLY', label: t('recurring.monthly') },
  ]

  const handleFormSubmit = (data: CreateTodoDto) => {
    onSubmit(data)
  }

  return (
    <Modal open={true} onClose={onCancel}>
      <ModalHeader>
        <ModalTitle>
          {parentId ? t('labels.newSubtask') : t('labels.newTodo')}
        </ModalTitle>
      </ModalHeader>
      
      <ModalContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <FormInput
            {...register('title', { required: t('form.titleRequired') })}
            id="title"
            label={t('form.title')}
            required
            error={errors.title}
          />

          <FormTextArea
            {...register('description')}
            id="description"
            label={t('form.description')}
            rows={3}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormSelect
              {...register('status')}
              id="status"
              label={t('form.status')}
              options={statusOptions}
            />

            <FormSelect
              {...register('priority')}
              id="priority"
              label={t('form.priority')}
              options={priorityOptions}
            />
          </div>

          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-foreground mb-1">
              {t('form.dueDate')}
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
                label={t('recurring.makeRecurring')}
                checked={isRepeatable}
                onChange={(e) => setIsRepeatable(e.target.checked)}
              />

              {isRepeatable && (
                <div className="mt-4 space-y-4">
                  <FormSelect
                    value={repeatType}
                    onChange={(e) => setRepeatType(e.target.value as RepeatType)}
                    id="repeatType"
                    label={t('recurring.repeatType')}
                    options={repeatTypeOptions}
                  />

                  {repeatType === 'WEEKLY' && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {t('recurring.repeatOnDays')}
                      </label>
                      <div className="grid grid-cols-7 gap-2">
                        {(t('common:date.weekdaysShort', { returnObjects: true }) as string[]).map((day, index) => (
                          <label key={index} className="flex items-center justify-center">
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
              {t('common:app.cancel')}
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
            >
              {parentId ? t('labels.addSubtask') : t('labels.addTodo')}
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  )
}