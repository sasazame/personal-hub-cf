import { Moment } from '../types/moment'
import { Modal, Button } from './ui'
import { format } from 'date-fns'
import { Edit, Trash2, Tag, Clock } from 'lucide-react'
import { getTagColorClasses } from '../utils/momentUtils'

interface MomentViewerProps {
  isOpen: boolean
  onClose: () => void
  moment: Moment | null
  onEdit: () => void
  onDelete: () => void
}

export function MomentViewer({ isOpen, onClose, moment, onEdit, onDelete }: MomentViewerProps) {
  if (!moment) return null

  return (
    <Modal open={isOpen} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">
            Moment Details
          </h2>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={onEdit}
              className="text-blue-600 hover:text-blue-700"
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onDelete}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Clock className="w-4 h-4" />
          {moment.createdAt && (
            <time dateTime={moment.createdAt}>
              {format(new Date(moment.createdAt), 'MMMM d, yyyy • h:mm a')}
            </time>
          )}
        </div>

        <div className="mb-6">
          <div className="text-foreground whitespace-pre-wrap break-words text-lg leading-relaxed">
            {moment.content}
          </div>
        </div>

        {moment.tags.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {moment.tags.map((tag) => (
                <span
                  key={tag}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm ${getTagColorClasses(tag)}`}
                >
                  <Tag className="w-4 h-4" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-border">
          <div className="flex justify-between text-xs text-gray-500">
            <div>
              {moment.createdAt && (
                <span>Created: {format(new Date(moment.createdAt), 'MM/dd/yyyy HH:mm')}</span>
              )}
            </div>
            <div>
              {moment.updatedAt && moment.updatedAt !== moment.createdAt && (
                <span>Updated: {format(new Date(moment.updatedAt), 'MM/dd/yyyy HH:mm')}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}