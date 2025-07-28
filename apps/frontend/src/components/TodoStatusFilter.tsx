import { TodoStatus } from '@/types/todo'
import { Button } from '@/components/ui'
import { mapApiStatusToDisplay } from '@/utils/todoStatusMapper'

interface TodoStatusFilterProps {
  selectedStatus: TodoStatus | 'ALL'
  onStatusChange: (status: TodoStatus | 'ALL') => void
}

export function TodoStatusFilter({ selectedStatus, onStatusChange }: TodoStatusFilterProps) {
  const statusOptions: { value: TodoStatus | 'ALL'; label: string }[] = [
    { value: 'ALL', label: 'All' },
    { value: 'TODO', label: 'To Do' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'DONE', label: 'Done' },
  ]

  return (
    <div className="flex gap-2 flex-wrap">
      {statusOptions.map((option) => (
        <Button
          key={option.value}
          variant={selectedStatus === option.value ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => onStatusChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}