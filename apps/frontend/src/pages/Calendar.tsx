import { useState, useEffect, useOptimistic, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout';
import { Button, Modal } from '@/components/ui';
import { CalendarGrid, EventForm, ChronologicalTable, TimelineEntryForm } from '@/components/calendar';
import { calendarApi } from '@/lib/calendar-api';
import { timelineApi } from '@/lib/timeline-api';
import { toast } from '@/components/ui/toast';
import { CalendarEvent, CreateCalendarEventDto, UpdateCalendarEventDto } from '@/types/calendar';
import { TimelineEntry } from '@/types/timeline';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight, ListTree, Plus, Settings, Sparkles } from 'lucide-react';

export function Calendar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation(['calendar', 'common']);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null);
  const [showGoogleSettings, setShowGoogleSettings] = useState(false);
  const [viewMode, setViewMode] = useState<'manage' | 'timeline'>('manage');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [eventLoadedRange, setEventLoadedRange] = useState<{ start: Date; end: Date } | null>(null);
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const initialTimelineRange = useMemo(() => {
    const start = startOfMonth(subMonths(new Date(), 2));
    const end = endOfMonth(addMonths(new Date(), 3));
    return { start, end };
  }, []);
  const [timelineRange, setTimelineRange] = useState<{ start: Date; end: Date }>(initialTimelineRange);
  const [timelineSearch, setTimelineSearch] = useState('');
  const [timelineCategory, setTimelineCategory] = useState<string | undefined>();
  const [timelineDraftDate, setTimelineDraftDate] = useState<string | undefined>();
  const [timelineDraftCategory, setTimelineDraftCategory] = useState<string | undefined>();
  type EventAction =
    | { type: 'create'; event: CalendarEvent }
    | { type: 'update'; id: number; delta: Partial<CalendarEvent> }
    | { type: 'move'; id: number; startDateTime: string; endDateTime: string }
    | { type: 'delete'; id: number }
  const [optimisticEvents, applyEventsOptimistic] = useOptimistic<CalendarEvent[], EventAction>(
    events,
    (state, action) => {
      switch (action.type) {
        case 'create':
          return [action.event, ...state]
        case 'update':
          return state.map((e) => (e.id === action.id ? { ...e, ...action.delta } : e))
        case 'move':
          return state.map((e) => (e.id === action.id ? { ...e, startDateTime: action.startDateTime, endDateTime: action.endDateTime } : e))
        case 'delete':
          return state.filter((e) => e.id !== action.id)
        default:
          return state
      }
    }
  )
  const [isLoading, setIsLoading] = useState(true);
  const [isTimelineLoading, setIsTimelineLoading] = useState(false);
  const [isTimelineFormOpen, setIsTimelineFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTimelineEntry, setSelectedTimelineEntry] = useState<TimelineEntry | null>(null);

  const loadEventsForRange = useCallback(async (
    start: Date,
    end: Date,
    options?: { silent?: boolean; replace?: boolean }
  ) => {
    const silent = options?.silent ?? false;
    try {
      if (!silent) {
        setIsLoading(true);
      }
      const data = await calendarApi.getEvents({
        fromDate: start.toISOString(),
        toDate: end.toISOString(),
      });
      setEvents((prev) => {
        if (options?.replace) {
          return data;
        }
        const map = new Map<number | string, CalendarEvent>();
        [...prev, ...data].forEach((event) => {
          const key = event.id ?? `${event.title}-${event.startDateTime}`;
          map.set(key, event);
        });
        return Array.from(map.values());
      });
      setEventLoadedRange((prev) => {
        if (!prev || options?.replace) return { start, end };
        return {
          start: start < prev.start ? start : prev.start,
          end: end > prev.end ? end : prev.end,
        };
      });
    } catch (error) {
      toast.error(t('messages.loadFailed'));
      console.error(error);
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [t]);

  const loadTimelineEntries = useCallback(async (start: Date, end: Date, options?: { replace?: boolean; silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (!silent) setIsTimelineLoading(true);
    try {
      const data = await timelineApi.getTimelineEntries({ fromDate: start.toISOString().slice(0, 10), toDate: end.toISOString().slice(0, 10) });
      setTimelineEntries((prev) => {
        if (options?.replace) return data;
        const map = new Map<number | string, TimelineEntry>();
        [...prev, ...data].forEach((entry) => {
          const key = entry.id ?? `${entry.title}-${entry.date}`;
          map.set(key, entry);
        });
        return Array.from(map.values());
      });
    } catch (error) {
      console.error(error);
      toast.error(t('messages.loadFailed'));
    } finally {
      if (!silent) setIsTimelineLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadEventsForRange(timelineRange.start, timelineRange.end, { replace: true }).finally(() => setIsLoading(false));
    loadTimelineEntries(timelineRange.start, timelineRange.end, { replace: true });
  }, [loadEventsForRange, loadTimelineEntries, timelineRange.end, timelineRange.start]);

  useEffect(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    if (!eventLoadedRange || monthStart < eventLoadedRange.start || monthEnd > eventLoadedRange.end) {
      loadEventsForRange(monthStart, monthEnd, { silent: true });
    }
  }, [currentDate, loadEventsForRange, eventLoadedRange]);

  // Handle navigation state from command palette
  useEffect(() => {
    const state = location.state as { openAddModal?: boolean } | null;
    if (state?.openAddModal) {
      setIsEventFormOpen(true);
      // Clear the state to prevent reopening on refresh
      navigate(
        { pathname: location.pathname, search: location.search, hash: location.hash },
        { replace: true, state: {} }
      );
    }
  }, [location.state, navigate]);

  const handleCreateEvent = async (data: CreateCalendarEventDto) => {
    try {
      setIsSubmitting(true);
      // Optimistically add a temporary event
      const tempId = -Date.now()
      const temp: CalendarEvent = {
        id: tempId,
        title: data.title,
        description: data.description,
        location: data.location,
        allDay: !!data.allDay,
        color: data.color ?? 'blue',
        startDateTime: data.startDateTime,
        endDateTime: data.endDateTime,
      }
      applyEventsOptimistic({ type: 'create', event: temp })
      const created = await calendarApi.createEvent(data);
      applyEventsOptimistic({ type: 'update', id: tempId, delta: { ...created } })
      setEvents((prev) => [created, ...prev.filter((event) => event.id !== created.id)])
      loadEventsForRange(timelineRange.start, timelineRange.end, { silent: true });
      toast.success(t('messages.eventCreated'));
      setIsEventFormOpen(false);
      setSelectedDate(null);
    } catch (error) {
      toast.error(t('messages.eventCreateFailed'));
      console.error(error);
      loadEventsForRange(timelineRange.start, timelineRange.end);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateEvent = async (data: UpdateCalendarEventDto) => {
    if (!selectedEvent?.id) return;
    const existingId = selectedEvent.id;

    try {
      setIsSubmitting(true);
      applyEventsOptimistic({ type: 'update', id: existingId, delta: data as Partial<CalendarEvent> })
      const updated = await calendarApi.updateEvent(existingId, data);
      if (updated.id == null) {
        await loadEventsForRange(timelineRange.start, timelineRange.end, { silent: true });
        return;
      }
      applyEventsOptimistic({ type: 'update', id: existingId, delta: { ...updated } })
      setEvents((prev) => prev.map((event) => (event.id === updated.id ? updated : event)))
      loadEventsForRange(timelineRange.start, timelineRange.end, { silent: true });
      toast.success(t('messages.eventUpdated'));
      setIsEventFormOpen(false);
      setSelectedEvent(null);
      setSelectedDate(null);
    } catch (error) {
      toast.error(t('messages.eventUpdateFailed'));
      console.error(error);
      loadEventsForRange(timelineRange.start, timelineRange.end);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!eventToDelete?.id) return;
    const deleteId = eventToDelete.id;

    try {
      setIsSubmitting(true);
      await calendarApi.deleteEvent(deleteId);
      toast.success(t('messages.eventDeleted'));
      setEventToDelete(null);
      // Close the event form modal if it's open with the deleted event
      if (selectedEvent?.id === eventToDelete.id) {
        setIsEventFormOpen(false);
        setSelectedEvent(null);
      }
      applyEventsOptimistic({ type: 'delete', id: deleteId })
      setEvents((prev) => prev.filter((event) => event.id !== deleteId))
      loadEventsForRange(timelineRange.start, timelineRange.end, { silent: true });
    } catch (error) {
      toast.error(t('messages.eventDeleteFailed'));
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedEvent(null);
    setIsEventFormOpen(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setSelectedDate(null);
    setIsEventFormOpen(true);
  };

  const handleNewEvent = () => {
    setSelectedEvent(null);
    setSelectedDate(new Date());
    setIsEventFormOpen(true);
  };

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleTimelineLoadMore = useCallback(
    async (direction: 'past' | 'future') => {
      if (isTimelineLoading) return;
      setIsTimelineLoading(true);
      const extension = 90;
      const newStart =
        direction === 'past' ? addDays(timelineRange.start, -extension) : timelineRange.start;
      const newEnd =
        direction === 'future' ? addDays(timelineRange.end, extension) : timelineRange.end;
      const fetchStart =
        direction === 'past' ? newStart : addDays(timelineRange.end, 1);
      const fetchEnd =
        direction === 'past' ? addDays(timelineRange.start, -1) : newEnd;

      if (fetchStart > fetchEnd) {
        setIsTimelineLoading(false);
        return;
      }

      setTimelineRange({ start: newStart, end: newEnd });
      try {
        await loadTimelineEntries(fetchStart, fetchEnd, { silent: true });
      } finally {
        setIsTimelineLoading(false);
      }
    },
    [isTimelineLoading, loadTimelineEntries, timelineRange.end, timelineRange.start]
  );

  const ensureTimelineRange = useCallback(
    (isoDate: string) => {
      const date = new Date(isoDate);
      let nextStart = timelineRange.start;
      let nextEnd = timelineRange.end;
      if (date < timelineRange.start) nextStart = startOfMonth(subMonths(date, 1));
      if (date > timelineRange.end) nextEnd = endOfMonth(addMonths(date, 1));
      if (nextStart !== timelineRange.start || nextEnd !== timelineRange.end) {
        setTimelineRange({ start: nextStart, end: nextEnd });
        loadTimelineEntries(nextStart, nextEnd, { silent: true });
      }
    },
    [timelineRange.end, timelineRange.start, loadTimelineEntries]
  );

  const handleEventDateChange = async (eventId: number, newDate: Date) => {
    const event = events.find((e) => e.id === eventId);
    if (!event) return;

    try {
      const timeDiff = newDate.getTime() - new Date(event.startDateTime).getTime();
      const newStartDateTime = new Date(new Date(event.startDateTime).getTime() + timeDiff);
      const newEndDateTime = new Date(new Date(event.endDateTime).getTime() + timeDiff);

      // Optimistically move event
      applyEventsOptimistic({ type: 'move', id: eventId, startDateTime: newStartDateTime.toISOString(), endDateTime: newEndDateTime.toISOString() })
      const updated = await calendarApi.updateEvent(eventId, {
        startDateTime: newStartDateTime.toISOString(),
        endDateTime: newEndDateTime.toISOString(),
      });

      applyEventsOptimistic({ type: 'update', id: eventId, delta: { ...updated } })
      setEvents((prev) => prev.map((e) => (e.id === eventId ? updated : e)))
      loadEventsForRange(timelineRange.start, timelineRange.end, { silent: true });
      toast.success(t('messages.eventMoved'));
    } catch (error) {
      toast.error(t('messages.eventMoveFailed'));
      console.error(error);
      loadEventsForRange(timelineRange.start, timelineRange.end);
    }
  };

  const openTimelineForm = (date?: Date, category?: string, entry?: TimelineEntry) => {
    setSelectedTimelineEntry(entry ?? null);
    setTimelineDraftDate(date ? date.toISOString().slice(0, 10) : undefined);
    setTimelineDraftCategory(category);
    setIsTimelineFormOpen(true);
  };

  const handleTimelineEntryClick = (entry: TimelineEntry) => {
    openTimelineForm(undefined, entry.category, entry);
  };

  const handleTimelineCreate = (date: Date, category?: string) => {
    openTimelineForm(date, category);
  };

  const handleTimelineSubmit = async (data: TimelineEntry) => {
    try {
      const payload: TimelineEntry = {
        ...data,
        category: data.category ?? timelineDraftCategory,
        date: data.date || timelineDraftDate || new Date().toISOString().slice(0, 10),
      };

      if (selectedTimelineEntry?.id) {
        const updated = await timelineApi.updateTimelineEntry(selectedTimelineEntry.id, payload);
        setTimelineEntries((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)));
        toast.success(t('chronological.updated'));
      } else {
        const created = await timelineApi.createTimelineEntry(payload);
        setTimelineEntries((prev) => [created, ...prev]);
        ensureTimelineRange(created.date);
        toast.success(t('chronological.created'));
      }
    } catch (error) {
      console.error(error);
      toast.error(t('messages.eventCreateFailed'));
    } finally {
      setIsTimelineFormOpen(false);
      setSelectedTimelineEntry(null);
      setTimelineDraftCategory(undefined);
      setTimelineDraftDate(undefined);
    }
  };

  const handleTimelineDelete = async (id: number) => {
    try {
      await timelineApi.deleteTimelineEntry(id);
      setTimelineEntries((prev) => prev.filter((entry) => entry.id !== id));
      toast.success(t('chronological.deleted'));
    } catch (error) {
      console.error(error);
      toast.error(t('messages.eventDeleteFailed'));
    } finally {
      setIsTimelineFormOpen(false);
      setSelectedTimelineEntry(null);
    }
  };

  const handleImportEventToTimeline = async (eventId: number) => {
    try {
      const created = await timelineApi.importEventToTimeline(eventId);
      setTimelineEntries((prev) => [created, ...prev]);
      ensureTimelineRange(created.date);
      toast.success(t('chronological.imported'));
    } catch (error) {
      console.error(error);
      toast.error(t('chronological.importFailed'));
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-lg text-gray-500">{t('messages.loading')}</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{t('labels.calendar')}</h1>
              <p className="text-muted-foreground mt-1">{t('labels.subtitle')}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setShowGoogleSettings(!showGoogleSettings)}
                className="gap-2"
              >
                <Settings className="w-4 h-4" />
                {t('labels.googleSettings')}
              </Button>
              <Button onClick={handleNewEvent} variant="primary" size="lg" className="gap-2">
                <Plus className="w-5 h-5" />
                {t('newEvent')}
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-lg border bg-muted/50 p-1 shadow-sm">
              <Button
                variant={viewMode === 'manage' ? 'primary' : 'ghost'}
                size="sm"
                className="gap-2"
                onClick={() => setViewMode('manage')}
              >
                <ListTree className="h-4 w-4" />
                {t('chronological.manageMode')}
              </Button>
              <Button
                variant={viewMode === 'timeline' ? 'primary' : 'ghost'}
                size="sm"
                className="gap-2"
                onClick={() => setViewMode('timeline')}
              >
                <Sparkles className="h-4 w-4" />
                {t('chronological.timelineMode')}
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              {t('chronological.rangeLabel', {
                start: format(timelineRange.start, 'MMM d, yyyy'),
                end: format(timelineRange.end, 'MMM d, yyyy'),
              })}
            </div>
          </div>
        </div>

        {viewMode === 'manage' && (
          <>
            {/* Calendar Navigation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-semibold text-foreground min-w-[200px] text-center">
                  {format(currentDate, 'MMMM yyyy')}
                </h2>

                <button
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={() => setCurrentDate(new Date())}>
                  {t('today')}
                </Button>
              </div>
            </div>

            {/* Calendar View */}
            <CalendarGrid
              currentDate={currentDate}
              events={optimisticEvents}
              onDateClick={handleDateClick}
              onEventClick={handleEventClick}
              onEventDateChange={handleEventDateChange}
            />
          </>
        )}

        {viewMode === 'timeline' && (
          <ChronologicalTable
            entries={timelineEntries}
            range={timelineRange}
            onLoadMore={handleTimelineLoadMore}
            onEntryClick={handleTimelineEntryClick}
            onCreate={handleTimelineCreate}
            searchTerm={timelineSearch}
            onSearchChange={setTimelineSearch}
            selectedCategory={timelineCategory}
            onCategoryChange={setTimelineCategory}
            isLoading={isTimelineLoading}
          />
        )}

        {/* Event Form */}
        <EventForm
          isOpen={isEventFormOpen}
          onClose={() => {
            setIsEventFormOpen(false);
            setSelectedEvent(null);
            setSelectedDate(null);
          }}
          onSubmit={(data) => {
            if (selectedEvent) {
              handleUpdateEvent(data as UpdateCalendarEventDto);
            } else {
              handleCreateEvent(data as CreateCalendarEventDto);
            }
          }}
          event={selectedEvent || undefined}
          defaultDate={selectedDate || undefined}
          isSubmitting={isSubmitting}
          onDelete={selectedEvent ? () => setEventToDelete(selectedEvent) : undefined}
          onImportToTimeline={selectedEvent?.id ? handleImportEventToTimeline : undefined}
        />

        <TimelineEntryForm
          open={isTimelineFormOpen}
          onClose={() => {
            setIsTimelineFormOpen(false);
            setSelectedTimelineEntry(null);
            setTimelineDraftCategory(undefined);
            setTimelineDraftDate(undefined);
          }}
          onSubmit={handleTimelineSubmit}
          entry={selectedTimelineEntry || undefined}
          defaultDate={timelineDraftDate}
          defaultCategory={timelineDraftCategory}
          onDelete={selectedTimelineEntry?.id ? handleTimelineDelete : undefined}
        />

        {/* Delete Confirmation Modal */}
        {eventToDelete && (
          <Modal open={true} onClose={() => setEventToDelete(null)}>
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">{t('labels.deleteEvent')}</h2>
              <p className="text-muted-foreground">
                {t('messages.confirmDelete', { title: eventToDelete.title })}
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setEventToDelete(null)}
                  disabled={isSubmitting}
                >
                  {t('labels.cancel')}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleDeleteEvent}
                  disabled={isSubmitting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isSubmitting ? t('messages.deleting') : t('labels.delete')}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AppLayout>
  );
}
