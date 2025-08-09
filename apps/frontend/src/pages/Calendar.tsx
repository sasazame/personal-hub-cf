import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout';
import { Button, Modal } from '@/components/ui';
import { CalendarGrid, EventForm } from '@/components/calendar';
import { calendarApi } from '@/lib/calendar-api';
import { toast } from '@/components/ui/toast';
import { CalendarEvent, CreateCalendarEventDto, UpdateCalendarEventDto } from '@/types/calendar';
import { format, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Settings } from 'lucide-react';

export function Calendar() {
  const { t } = useTranslation(['calendar', 'common']);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null);
  const [showGoogleSettings, setShowGoogleSettings] = useState(false);
  // const [viewMode, setViewMode] = useState<CalendarView>('month'); // For future implementation
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const data = await calendarApi.getEvents({
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1
      });
      setEvents(data);
    } catch (error) {
      toast.error(t('messages.loadFailed'));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEvent = async (data: CreateCalendarEventDto) => {
    try {
      setIsSubmitting(true);
      await calendarApi.createEvent(data);
      toast.success(t('messages.eventCreated'));
      setIsEventFormOpen(false);
      setSelectedDate(null);
      loadEvents();
    } catch (error) {
      toast.error(t('messages.eventCreateFailed'));
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateEvent = async (data: UpdateCalendarEventDto) => {
    if (!selectedEvent?.id) return;
    
    try {
      setIsSubmitting(true);
      await calendarApi.updateEvent(selectedEvent.id, data);
      toast.success(t('messages.eventUpdated'));
      setIsEventFormOpen(false);
      setSelectedEvent(null);
      loadEvents();
    } catch (error) {
      toast.error(t('messages.eventUpdateFailed'));
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!eventToDelete?.id) return;
    
    try {
      setIsSubmitting(true);
      await calendarApi.deleteEvent(eventToDelete.id);
      toast.success(t('messages.eventDeleted'));
      setEventToDelete(null);
      // Close the event form modal if it's open with the deleted event
      if (selectedEvent?.id === eventToDelete.id) {
        setIsEventFormOpen(false);
        setSelectedEvent(null);
      }
      loadEvents();
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

  const handleEventDateChange = async (eventId: number, newDate: Date) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    try {
      const timeDiff = newDate.getTime() - new Date(event.startDateTime).getTime();
      const newStartDateTime = new Date(new Date(event.startDateTime).getTime() + timeDiff);
      const newEndDateTime = new Date(new Date(event.endDateTime).getTime() + timeDiff);

      await calendarApi.updateEvent(eventId, {
        startDateTime: newStartDateTime.toISOString(),
        endDateTime: newEndDateTime.toISOString()
      });
      
      toast.success(t('messages.eventMoved'));
      loadEvents();
    } catch (error) {
      toast.error(t('messages.eventMoveFailed'));
      console.error(error);
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {t('labels.calendar')}
            </h1>
            <p className="text-gray-500 mt-1">
              {t('labels.subtitle')}
            </p>
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
            <Button 
              onClick={handleNewEvent} 
              variant="primary"
              size="lg"
              className="gap-2"
            >
              <Plus className="w-5 h-5" />
              {t('newEvent')}
            </Button>
          </div>
        </div>

        {/* Calendar Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 min-w-[200px] text-center">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setCurrentDate(new Date())}
            >
              {t('today')}
            </Button>
          </div>
        </div>

        {/* Calendar View */}
        <CalendarGrid
          currentDate={currentDate}
          events={events}
          onDateClick={handleDateClick}
          onEventClick={handleEventClick}
          onEventDateChange={handleEventDateChange}
        />

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
        />

        {/* Delete Confirmation Modal */}
        {eventToDelete && (
          <Modal open={true} onClose={() => setEventToDelete(null)}>
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('labels.deleteEvent')}</h2>
              <p className="text-gray-500">
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