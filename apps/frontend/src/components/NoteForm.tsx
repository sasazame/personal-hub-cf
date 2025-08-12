import React, { useState, useEffect, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus } from 'lucide-react';
import { Note, CreateNoteDto } from '@/types/note';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { InputWithCount } from '@/components/ui/InputWithCount';
import { TextAreaWithCount } from '@/components/ui/TextAreaWithCount';
import { cn } from '@/lib/cn';
import { validateTagsLength, getSerializedTagsLength, MAX_TAGS_LENGTH } from '@/lib/tag-utils';

interface NoteFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateNoteDto) => void;
  note?: Note;
  isSubmitting?: boolean;
}

export function NoteForm({ isOpen, onClose, onSubmit, note, isSubmitting }: NoteFormProps) {
  const { t } = useTranslation(['notes', 'common']);
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
    if (!title.trim()) newErrors.title = t('labels.noteTitleRequired');
    if (!content.trim()) newErrors.content = t('labels.noteContentRequired');
    
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
      const newTags = [...tags, trimmedTag];
      if (!validateTagsLength(newTags)) {
        // Optionally show an error message here
        return;
      }
      setTags(newTags);
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
              {note ? t('labels.editNote') : t('labels.addNote')}
            </h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('labels.noteTitleLabel')}
            </label>
            <InputWithCount
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors({ ...errors, title: undefined });
              }}
              placeholder={t('noteTitlePlaceholder')}
              maxLength={255}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('labels.noteContentLabel')}
            </label>
            <TextAreaWithCount
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (errors.content) setErrors({ ...errors, content: undefined });
              }}
              placeholder={t('noteContentPlaceholder')}
              rows={12}
              maxLength={100000}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('labels.tagsLabel')}
              {tags.length > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({getSerializedTagsLength(tags)} / {MAX_TAGS_LENGTH} characters)
                </span>
              )}
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
                placeholder={t('addTagPlaceholder')}
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
              {t('labels.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (note ? t('labels.updating') : t('labels.creating')) : (note ? t('labels.update') : t('labels.create'))}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}