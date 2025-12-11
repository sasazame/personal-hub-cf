import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { addDays, format, intervalToDuration, isWithinInterval } from 'date-fns';
import { CalendarEvent } from '@/types/calendar';
import { Button, Input } from '@/components/ui';
import { Clock, Plus, Search } from 'lucide-react';

type TimelineDirection = 'past' | 'future';

interface ChronologicalTableProps {
  events: CalendarEvent[];
  range: { start: Date; end: Date };
  onLoadMore: (direction: TimelineDirection) => void;
  onEventClick: (event: CalendarEvent) => void;
  onCreate: (date: Date, category?: string) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory?: string;
  onCategoryChange: (value?: string) => void;
  isLoading?: boolean;
}

export function ChronologicalTable({
  events,
  range,
  onLoadMore,
  onEventClick,
  onCreate,
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  isLoading,
}: ChronologicalTableProps) {
  const { t } = useTranslation('calendar');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  const bottomSentinelRef = useRef<HTMLDivElement | null>(null);
  const colorPalette: Record<string, string> = {
    blue: '#3b82f6',
    green: '#22c55e',
    red: '#ef4444',
    purple: '#a855f7',
    orange: '#f97316',
  };

  const days = useMemo(() => {
    const list: Date[] = [];
    let cursor = new Date(range.start);
    while (cursor <= range.end) {
      list.push(cursor);
      cursor = addDays(cursor, 1);
    }
    return list;
  }, [range.end, range.start]);

  const filteredEvents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return events.filter((event) => {
      const eventDate = new Date(event.startDateTime);
      const category = (event.category || 'general').toLowerCase();
      const isInRange = isWithinInterval(eventDate, { start: range.start, end: range.end });
      if (!isInRange) return false;
      if (selectedCategory && category !== selectedCategory.toLowerCase()) return false;
      if (!query) return true;
      return (
        event.title.toLowerCase().includes(query) ||
        (event.description && event.description.toLowerCase().includes(query)) ||
        (event.location && event.location.toLowerCase().includes(query))
      );
    });
  }, [events, range.end, range.start, searchTerm, selectedCategory]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    filteredEvents.forEach((event) => {
      set.add(event.category || 'general');
    });
    if (!set.size) {
      set.add('general');
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [filteredEvents]);

  const eventsByDate = useMemo(() => {
    const byDate = new Map<string, CalendarEvent[]>();
    filteredEvents.forEach((event) => {
      const key = event.startDateTime.slice(0, 10);
      const current = byDate.get(key) || [];
      current.push(event);
      byDate.set(key, current);
    });

    for (const [, value] of byDate.entries()) {
      value.sort(
        (a, b) =>
          new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
      );
    }
    return byDate;
  }, [filteredEvents]);

  const getElapsedLabel = (eventDate: Date) => {
    const duration = intervalToDuration({ start: eventDate, end: new Date() });
    const years = duration.years || 0;
    const months = duration.months || 0;
    const daysElapsed = duration.days || 0;
    return t('chronological.elapsed', {
      years,
      months,
      days: daysElapsed,
    });
  };

  const formatEventTime = (event: CalendarEvent) => {
    if (event.allDay) return t('labels.allDayEvent');
    const start = new Date(event.startDateTime);
    return format(start, 'HH:mm');
  };

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          if (isLoading) continue;
          if (entry.target === topSentinelRef.current) {
            onLoadMore('past');
          } else if (entry.target === bottomSentinelRef.current) {
            onLoadMore('future');
          }
        }
      },
      {
        root,
        threshold: 0.1,
      }
    );

    if (topSentinelRef.current) observer.observe(topSentinelRef.current);
    if (bottomSentinelRef.current) observer.observe(bottomSentinelRef.current);

    return () => observer.disconnect();
  }, [isLoading, onLoadMore]);

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
            const dayKey = format(day, 'yyyy-MM-dd');
            const dayEvents = eventsByDate.get(dayKey) || [];
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
                  <span className="text-xs text-muted-foreground">
                    {format(day, 'yyyy')}
                  </span>
                </div>

                {categories.map((category) => {
                  const categoryEvents = dayEvents.filter(
                    (event) => (event.category || 'general') === category
                  );
                  return (
                    <div key={`${dayKey}-${category}`} className="space-y-3">
                      {categoryEvents.map((event) => {
                        const eventDate = new Date(event.startDateTime);
                        const elapsed = getElapsedLabel(eventDate);
                        return (
                          <div
                            key={event.id ?? `${event.title}-${event.startDateTime}`}
                            className="group relative cursor-pointer rounded-xl border bg-card/70 p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/70"
                            onClick={() => onEventClick(event)}
                          >
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                                <span
                                  className="h-2 w-2 rounded-full"
                                  style={{ backgroundColor: colorPalette[event.color || 'blue'] || colorPalette.blue }}
                                />
                                {category || t('chronological.uncategorized')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatEventTime(event)}
                              </span>
                            </div>
                            <div className="mt-2 text-sm font-semibold text-foreground">
                              {event.title}
                            </div>
                            {event.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {event.description}
                              </p>
                            )}
                            <div className="pointer-events-none absolute left-0 right-0 top-full z-10 hidden translate-y-2 rounded-xl border bg-popover p-3 text-xs text-popover-foreground shadow-lg group-hover:block">
                              <div className="font-semibold text-foreground">{event.title}</div>
                              <p className="mt-1 text-muted-foreground">
                                {event.description || t('chronological.noMemo')}
                              </p>
                              <div className="mt-2 text-emerald-500">{elapsed}</div>
                            </div>
                          </div>
                        );
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
                  );
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
            );
          })}
        </div>
        <div ref={bottomSentinelRef} />
      </div>
    </div>
  );
}
