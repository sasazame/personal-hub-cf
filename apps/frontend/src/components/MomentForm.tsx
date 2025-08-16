import { useState, useEffect } from 'react';
import { Moment, CreateMomentDto, UpdateMomentDto, DEFAULT_MOMENT_TAGS } from '@/types/moment';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { TextAreaWithCount } from '@/components/ui/TextAreaWithCount';
import { X, Plus, Tag } from 'lucide-react';
import { cn } from '@/lib/cn';
import { validateTagsLength, getSerializedTagsLength, MAX_TAGS_LENGTH } from '@/lib/tag-utils';
import { getTagColorClasses } from '@/utils/momentUtils';

interface MomentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMomentDto | UpdateMomentDto) => void;
  moment?: Moment;
  isSubmitting?: boolean;
}

export function MomentForm({ isOpen, onClose, onSubmit, moment, isSubmitting }: MomentFormProps) {
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [showCustomTagInput, setShowCustomTagInput] = useState(false);
  const [, setErrors] = useState<{ content?: string }>({});

  useEffect(() => {
    if (moment) {
      setContent(moment.content);
      setTags(moment.tags);
    } else {
      setContent('');
      setTags([]);
    }
    setErrors({});
  }, [moment]);

  const handleClose = () => {
    setContent('');
    setTags([]);
    setCurrentTag('');
    setShowCustomTagInput(false);
    setErrors({});
    onClose();
  };

  const validate = () => {
    const newErrors: { content?: string } = {};
    if (!content.trim()) {
      newErrors.content = 'Content is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data: CreateMomentDto | UpdateMomentDto = {
      content: content.trim(),
      tags: tags.length > 0 ? tags : undefined
    };

    onSubmit(data);
  };

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      const newTags = [...tags, tag];
      if (!validateTagsLength(newTags)) {
        // Optionally show an error message here
        return;
      }
      setTags(newTags);
    }
  };

  const addCustomTag = () => {
    const trimmedTag = currentTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      const formattedTag = trimmedTag.startsWith('#') ? trimmedTag : `#${trimmedTag}`;
      const newTags = [...tags, formattedTag];
      if (!validateTagsLength(newTags)) {
        // Optionally show an error message here
        return;
      }
      setTags(newTags);
      setCurrentTag('');
      setShowCustomTagInput(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomTag();
    }
  };

  return (
    <Modal open={isOpen} onClose={handleClose}>
      <div className="p-6">
        <h3 className="text-lg font-medium mb-4">{moment ? 'Edit Moment' : 'Add Moment'}</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Moment Content *
          </label>
          <TextAreaWithCount
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            rows={6}
            className="w-full"
            maxLength={100000}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Tags
            {tags.length > 0 && (
              <span className="ml-2 text-xs text-muted-foreground">
                ({getSerializedTagsLength(tags)} / {MAX_TAGS_LENGTH} characters)
              </span>
            )}
          </label>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {DEFAULT_MOMENT_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={cn(
                  'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors',
                  tags.includes(tag)
                    ? `${getTagColorClasses(tag)} ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800`
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                <Tag className="w-3 h-3" />
                {tag}
              </button>
            ))}
          </div>

          {tags.filter(tag => !(DEFAULT_MOMENT_TAGS as readonly string[]).includes(tag)).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 pt-3 border-t">
              {tags.filter(tag => !(DEFAULT_MOMENT_TAGS as readonly string[]).includes(tag)).map((tag) => (
                <span
                  key={tag}
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm',
                    getTagColorClasses(tag)
                  )}
                >
                  <Tag className="w-3 h-3" />
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

          {showCustomTagInput ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Enter custom tag"
                className="flex-1 px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                autoFocus
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addCustomTag}
                disabled={!currentTag.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCurrentTag('');
                  setShowCustomTagInput(false);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCustomTagInput(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add Custom Tag
            </button>
          )}
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t">
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
            {isSubmitting ? 'Saving...' : (moment ? 'Update' : 'Create')}
          </Button>
        </div>
        </form>
      </div>
    </Modal>
  );
}