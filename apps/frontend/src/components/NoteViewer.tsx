import { Edit, Trash2, Tag, X } from 'lucide-react';
import { Note } from '@/types/note';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface NoteViewerProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function NoteViewer({ note, isOpen, onClose, onEdit, onDelete }: NoteViewerProps) {
  if (!note) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Modal open={isOpen} onClose={onClose}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 flex-1 mr-4">
            {note.title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tags */}
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {note.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
              >
                <Tag className="w-4 h-4" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="mb-6">
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
              {note.content}
            </p>
          </div>
        </div>

        {/* Metadata */}
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-6 space-y-1">
          {note.createdAt && (
            <div>Created: {formatDate(note.createdAt)}</div>
          )}
          {note.updatedAt && note.updatedAt !== note.createdAt && (
            <div>Last updated: {formatDate(note.updatedAt)}</div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="secondary"
            onClick={onEdit}
            className="flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Button>
          <Button
            variant="danger"
            onClick={onDelete}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}