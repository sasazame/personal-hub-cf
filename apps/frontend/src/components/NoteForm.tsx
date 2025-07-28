import React, { useState, useEffect, FormEvent } from 'react';
import { X, Plus } from 'lucide-react';
import { Note, CreateNoteDto } from '@/types/note';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { cn } from '@/lib/cn';

interface NoteFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateNoteDto) => void;
  note?: Note;
  isSubmitting?: boolean;
}

export function NoteForm({ isOpen, onClose, onSubmit, note, isSubmitting }: NoteFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags);
    } else {
      setTitle('');
      setContent('');
      setTags([]);
    }
    setErrors({});
  }, [note]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    const newErrors: { title?: string; content?: string } = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!content.trim()) newErrors.content = 'Content is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      title: title.trim(),
      content: content.trim(),
      tags
    });
  };

  const handleClose = () => {
    setTitle('');
    setContent('');
    setTags([]);
    setCurrentTag('');
    setErrors({});
    onClose();
  };

  const addTag = () => {
    const trimmedTag = currentTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Modal open={isOpen} onClose={handleClose}>
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {note ? 'Edit Note' : 'Add Note'}
            </h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Note Title *
            </label>
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors({ ...errors, title: undefined });
              }}
              placeholder="Enter note title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Note Content *
            </label>
            <TextArea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (errors.content) setErrors({ ...errors, content: undefined });
              }}
              placeholder="Enter note content"
              rows={12}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            
            {/* Current tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add tag input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={handleTagKeyPress}
                placeholder="Add a tag"
                className={cn(
                  "flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-gray-800",
                  "text-gray-900 dark:text-gray-100 placeholder-gray-400",
                  "border-gray-300 dark:border-gray-600",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                )}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={addTag}
                disabled={!currentTag.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (note ? 'Updating...' : 'Creating...') : (note ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}