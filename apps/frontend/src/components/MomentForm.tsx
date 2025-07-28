import { useState, useEffect } from 'react';
import { Moment, CreateMomentDto, UpdateMomentDto, DEFAULT_MOMENT_TAGS } from '@/types/moment';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import { X, Plus, Tag } from 'lucide-react';
import { cn } from '@/lib/cn';

interface MomentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMomentDto | UpdateMomentDto) => void;
  moment?: Moment;
  isSubmitting?: boolean;
}

const TAG_COLOR_MAP = {
  Ideas: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  Discoveries: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
  Emotions: 'bg-pink-100 text-pink-700 hover:bg-pink-200',
  Log: 'bg-green-100 text-green-700 hover:bg-green-200',
  Other: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
};

const DEFAULT_TAG_COLOR = 'bg-orange-100 text-orange-700 hover:bg-orange-200';

function getTagColorClasses(tag: string): string {
  return TAG_COLOR_MAP[tag as keyof typeof TAG_COLOR_MAP] || DEFAULT_TAG_COLOR;
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
      setTags([...tags, tag]);
    }
  };

  const addCustomTag = () => {
    const trimmedTag = currentTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      const formattedTag = trimmedTag.startsWith('#') ? trimmedTag : `#${trimmedTag}`;
      setTags([...tags, formattedTag]);
      setCurrentTag('');
      setShowCustomTagInput(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Moment Content *
          </label>
          <TextArea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            rows={6}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Tags
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
                    ? `${getTagColorClasses(tag)} ring-2 ring-offset-1 ring-blue-500`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                onKeyPress={handleTagKeyPress}
                placeholder="Enter custom tag"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
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