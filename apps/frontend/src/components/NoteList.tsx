import React from 'react';
import { Edit, Trash2, Tag } from 'lucide-react';
import { Note } from '@/types/note';
import { cn } from '@/lib/cn';

interface NoteListProps {
  notes: Note[];
  onNoteClick: (note: Note) => void;
  onEditNote: (note: Note) => void;
  onDeleteNote: (note: Note) => void;
}

export function NoteList({ notes, onNoteClick, onEditNote, onDeleteNote }: NoteListProps) {
  if (!notes || notes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">No notes found</div>
        <p className="text-sm text-gray-400 mt-2">
          Create a new note to get started
        </p>
      </div>
    );
  }

  const sortedNotes = [...notes].sort((a, b) => {
    return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
  });

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedNotes.map((note) => (
        <div
          key={note.id}
          className={cn(
            "bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700",
            "p-4 cursor-pointer hover:shadow-lg transition-all group relative"
          )}
          onClick={() => onNoteClick(note)}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 flex-1 mr-2">
              {note.title}
            </h3>
            
            {/* Actions */}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditNote(note);
                }}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-400 hover:text-blue-500"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteNote(note);
                }}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-400 hover:text-red-500"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content preview */}
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-4">
            {truncateContent(note.content)}
          </div>

          {/* Tags */}
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {note.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
              {note.tags.length > 3 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  +{note.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {note.createdAt && <div>Created: {formatDate(note.createdAt)}</div>}
            {note.updatedAt && note.updatedAt !== note.createdAt && (
              <div>Updated: {formatDateTime(note.updatedAt)}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}