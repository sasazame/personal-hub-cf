import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TimelineEntry } from '@/types/timeline'
import { Modal, Button, Input, TextArea } from '@/components/ui'

interface TimelineEntryFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: TimelineEntry) => void
  entry?: TimelineEntry
  defaultDate?: string
  onDelete?: (id: number) => void
  defaultCategory?: string
}

export function TimelineEntryForm({ open, onClose, onSubmit, entry, defaultDate, onDelete, defaultCategory }: TimelineEntryFormProps) {
  const { t } = useTranslation('calendar')
  const [title, setTitle] = useState('')
  const [memo, setMemo] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState('')
  const [date, setDate] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return
    if (entry) {
      setTitle(entry.title)
      setMemo(entry.memo || '')
      setCategory(entry.category || '')
      setTags(entry.tags || '')
      setDate(entry.date)
    } else {
      setTitle('')
      setMemo('')
      setCategory(defaultCategory || '')
      setTags('')
      setDate(defaultDate || new Date().toISOString().slice(0, 10))
    }
    setErrors({})
  }, [entry, open, defaultDate])

  const validate = () => {
    const next: Record<string, string> = {}
    if (!title.trim()) next.title = t('form.titleRequired')
    if (!date) next.date = t('form.startDateRequired')
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    const payload: TimelineEntry = {
      title: title.trim(),
      memo: memo.trim() || undefined,
      category: category.trim() || undefined,
      tags: tags.trim() || undefined,
      date,
      id: entry?.id,
      eventId: entry?.eventId,
    }
    onSubmit(payload)
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6 space-y-4">
        <h3 className="text-xl font-semibold text-foreground">{entry ? t('chronological.editEntry') : t('chronological.newEntry')}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('eventTitle')}</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('labels.category')}</label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder={t('form.categoryPlaceholder')} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('chronological.tags')}</label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder={t('chronological.tagsPlaceholder')} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('eventDescription')}</label>
            <TextArea value={memo} onChange={(e) => setMemo(e.target.value)} rows={3} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('form.startDate')}</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            {errors.date && <p className="text-xs text-destructive mt-1">{errors.date}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            {entry?.id && onDelete && (
              <Button type="button" variant="secondary" onClick={() => onDelete(entry.id!)} className="text-destructive">
                {t('labels.delete')}
              </Button>
            )}
            <Button type="button" variant="secondary" onClick={onClose}>
              {t('labels.cancel')}
            </Button>
            <Button type="submit" variant="primary">
              {entry ? t('labels.update') : t('labels.create')}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
