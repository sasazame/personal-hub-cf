import { useState } from 'react'
import { Button } from './ui'
import { CreateMomentDto, DEFAULT_MOMENT_TAGS } from '../types/moment'
import { Send, Tag, Hash } from 'lucide-react'
import { getTagColorClasses } from '@/utils/momentUtils'

interface MomentQuickFormProps {
  onSubmit: (data: CreateMomentDto) => void
  isSubmitting?: boolean
}

export function MomentQuickForm({ onSubmit, isSubmitting }: MomentQuickFormProps) {
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState('')
  const [showCustomTagInput, setShowCustomTagInput] = useState(false)

  const toggleTag = (tag: string) => {
    setTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const handleAddCustomTag = () => {
    if (!customTag) return
    
    const cleanTag = customTag.replace(/^#/, '').trim()
    if (cleanTag && !tags.includes(cleanTag)) {
      setTags([...tags, cleanTag])
    }
    setCustomTag('')
    setShowCustomTagInput(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    onSubmit({
      content: content.trim(),
      tags: tags.length > 0 ? tags : ['Other']
    })

    setContent('')
    setTags([])
    setCustomTag('')
    setShowCustomTagInput(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e)
    }
  }

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What's on your mind?"
            className="w-full px-4 py-3 pr-16 bg-muted border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder-muted-foreground"
            rows={3}
          />
          <div className="absolute bottom-3 right-3 text-xs text-gray-500">
            {content.length}/1000
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {DEFAULT_MOMENT_TAGS.map((tag) => {
              const isSelected = tags.includes(tag)
              const tagColorClass = getTagColorClasses(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  aria-pressed={isSelected}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    isSelected 
                      ? `${tagColorClass} ring-2 ring-offset-2 ring-offset-background` 
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </button>
              )
            })}
            
            <button
              type="button"
              onClick={() => setShowCustomTagInput(!showCustomTagInput)}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all"
            >
              <Hash className="w-3 h-3" />
              Add custom
            </button>
          </div>

          {tags.filter(tag => !(DEFAULT_MOMENT_TAGS as readonly string[]).includes(tag)).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.filter(tag => !(DEFAULT_MOMENT_TAGS as readonly string[]).includes(tag)).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground"
                >
                  <Hash className="w-3 h-3" />
                  {tag}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter(t => t !== tag))}
                    className="ml-1 hover:opacity-70"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {showCustomTagInput && (
            <div className="flex gap-2">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddCustomTag()
                  }
                }}
                placeholder="Enter tag name"
                className="flex-1 px-3 py-1 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                autoFocus
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={handleAddCustomTag}
              >
                Add
              </Button>
            </div>
          )}
        </div>

        <div className="flex justify-end items-center gap-3">
          <span className="text-xs text-gray-500">
            Ctrl/Cmd + Enter to submit
          </span>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!content.trim() || isSubmitting}
            className="flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </form>
    </div>
  )
}