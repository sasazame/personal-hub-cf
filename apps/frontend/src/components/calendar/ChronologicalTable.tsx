import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { addDays, format, intervalToDuration, isWithinInterval } from 'date-fns'
import { TimelineEntry } from '@/types/timeline'
import { Button, Input } from '@/components/ui'
import { Clock, Plus, Search, Tag } from 'lucide-react'

type TimelineDirection = 'past' | 'future'

interface ChronologicalTableProps {
  entries: TimelineEntry[]
  range: { start: Date; end: Date }
  onLoadMore: (direction: TimelineDirection) => void
  onEntryClick: (entry: TimelineEntry) => void
  onCreate: (date: Date, category?: string) => void
  searchTerm: string
  onSearchChange: (value: string) => void
  selectedCategory?: string
  onCategoryChange: (value?: string) => void
  isLoading?: boolean
}

export function ChronologicalTable({
  entries,
  range,
  onLoadMore,
  onEntryClick,
  onCreate,
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  isLoading,
}: ChronologicalTableProps) {
  const { t } = useTranslation('calendar')
  const containerRef = useRef<HTMLDivElement | null>(null)
  const topSentinelRef = useRef<HTMLDivElement | null>(null)
  const bottomSentinelRef = useRef<HTMLDivElement | null>(null)
  const colorPalette: Record<string, string> = {
    blue: '#3b82f6',
    green: '#22c55e',
    red: '#ef4444',
    purple: '#a855f7',
    orange: '#f97316',
  }

  const days = useMemo(() => {
    const list: Date[] = []
    let cursor = new Date(range.start)
    while (cursor <= range.end) {
      list.push(cursor)
      cursor = addDays(cursor, 1)
    }
    return list
  }, [range.end, range.start])

  const filteredEntries = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return entries.filter((entry) => {
      const entryDate = new Date(entry.date)
      const category = (entry.category || 'general').toLowerCase()
      const isInRange = isWithinInterval(entryDate, { start: range.start, end: range.end })
      if (!isInRange) return false
      if (selectedCategory && category !== selectedCategory.toLowerCase()) return false
      if (!query) return true
      return (
        entry.title.toLowerCase().includes(query) ||
        (entry.memo && entry.memo.toLowerCase().includes(query)) ||
        (entry.tags && entry.tags.toLowerCase().includes(query))
      )
    })
  }, [entries, range.end, range.start, searchTerm, selectedCategory])

  const categories = useMemo(() => {
    const set = new Set<string>()
    filteredEntries.forEach((entry) => {
      set.add(entry.category || 'general')
    })
    if (!set.size) set.add('general')
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [filteredEntries])

  const entriesByDate = useMemo(() => {
    const byDate = new Map<string, TimelineEntry[]>()
    filteredEntries.forEach((entry) => {
      const key = entry.date
      const current = byDate.get(key) || []
      current.push(entry)
      byDate.set(key, current)
    })

    for (const [, value] of byDate.entries()) {
      value.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    }
    return byDate
  }, [filteredEntries])

  const getElapsedLabel = (entryDate: Date) => {
    const duration = intervalToDuration({ start: entryDate, end: new Date() })
    const years = duration.years || 0
    const months = duration.months || 0
    const daysElapsed = duration.days || 0
    return t('chronological.elapsed', {
      years,
      months,
      days: daysElapsed,
    })
  }

  const formatEntryTime = (entry: TimelineEntry) => {
    if (entry.eventId) return t('chronological.linkedEvent')
    return t('chronological.allDay')
  }

  useEffect(() => {
    const root = containerRef.current
    if (!root) return
    const observer = new IntersectionObserver(
      (entriesObserver) => {
        for (const entry of entriesObserver) {
          if (!entry.isIntersecting) continue
          if (isLoading) continue
          if (entry.target === topSentinelRef.current) {
            onLoadMore('past')
          } else if (entry.target === bottomSentinelRef.current) {
            onLoadMore('future')
          }
        }
      },
      {
        root,
        threshold: 0.1,
      }
    )

    if (topSentinelRef.current) observer.observe(topSentinelRef.current)
    if (bottomSentinelRef.current) observer.observe(bottomSentinelRef.current)

    return () => observer.disconnect()
  }, [isLoading, onLoadMore])

  return (
    <div className="rounded-2xl border bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b bg-muted/40 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">{t('chronological.title')}</p>
          <p className="text-sm text-muted-foreground">{t('chronological.description')}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t('chronological.searchPlaceholder')}
              className="pl-10 w-full sm:w-72"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={!selectedCategory ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => onCategoryChange(undefined)}
            >
              {t('chronological.categoryAll')}
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => onCategoryChange(category)}
              >
                {category || t('chronological.uncategorized')}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative max-h-[70vh] overflow-auto bg-gradient-to-b from-background via-background to-muted/30"
      >
        <div ref={topSentinelRef} />
        {isLoading && (
          <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
            {t('chronological.loading')}
          </div>
        )}
        {!isLoading && days.length === 0 && (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            {t('chronological.empty')}
          </div>
        )}
        <div className="min-w-[720px] divide-y">
          {days.map((day) => {
            const dayKey = format(day, 'yyyy-MM-dd')
            const dayEntries = entriesByDate.get(dayKey) || []
            return (
              <div
                key={dayKey}
                className="grid items-start gap-4 px-4 py-3"
                style={{
                  gridTemplateColumns: `180px repeat(${categories.length}, minmax(180px, 1fr)) 120px`,
                }}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-foreground">
                    {format(day, 'MMM d (EEE)')}
                  </span>
                  <span className="text-xs text-muted-foreground">{format(day, 'yyyy')}</span>
                </div>

                {categories.map((category) => {
                  const categoryEntries = dayEntries.filter((entry) => (entry.category || 'general') === category)
                  return (
                    <div key={`${dayKey}-${category}`} className="space-y-3">
                      {categoryEntries.map((entry) => {
                        const entryDate = new Date(entry.date)
                        const elapsed = getElapsedLabel(entryDate)
                        return (
                          <div
                            key={entry.id ?? `${entry.title}-${entry.date}`}
                            className="group relative cursor-pointer rounded-xl border bg-card/70 p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/70"
                            onClick={() => onEntryClick(entry)}
                          >
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                                <span
                                  className="h-2 w-2 rounded-full"
                                  style={{ backgroundColor: colorPalette[entry.category || 'blue'] || colorPalette.blue }}
                                />
                                {category || t('chronological.uncategorized')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatEntryTime(entry)}
                              </span>
                            </div>
                            <div className="mt-2 text-sm font-semibold text-foreground">{entry.title}</div>
                            {entry.memo && (
                              <p className="text-xs text-muted-foreground line-clamp-2">{entry.memo}</p>
                            )}
                            {entry.tags && (
                              <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-muted-foreground">
                                {entry.tags.split(',').map((tag) => (
                                  <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                                    <Tag className="h-3 w-3" />
                                    {tag.trim()}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="pointer-events-none absolute left-0 right-0 top-full z-10 hidden translate-y-2 rounded-xl border bg-popover p-3 text-xs text-popover-foreground shadow-lg group-hover:block">
                              <div className="font-semibold text-foreground">{entry.title}</div>
                              <p className="mt-1 text-muted-foreground">{entry.memo || t('chronological.noMemo')}</p>
                              <div className="mt-2 text-emerald-500">{elapsed}</div>
                            </div>
                          </div>
                        )
                      })}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-muted-foreground hover:text-foreground"
                        onClick={() => onCreate(day, category)}
                      >
                        <Plus className="h-4 w-4" />
                        {t('chronological.addInCategory', { category })}
                      </Button>
                    </div>
                  )
                })}

                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-muted-foreground hover:text-foreground"
                    onClick={() => onCreate(day)}
                  >
                    <Plus className="h-4 w-4" />
                    {t('chronological.addEntry')}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
        <div ref={bottomSentinelRef} />
      </div>
    </div>
  )
}
