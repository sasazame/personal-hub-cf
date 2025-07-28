import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { Button, Modal } from '@/components/ui';
import { CalendarGrid } from '@/components/calendar';
import { calendarApi } from '@/lib/calendar-api';
import { toast } from '@/components/ui/toast';
import { CalendarEvent, CreateCalendarEventDto, UpdateCalendarEventDto } from '@/types/calendar';
import { format, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Settings } from 'lucide-react';

export function Calendar() {
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
      toast.error('Failed to load calendar events');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEvent = async (data: CreateCalendarEventDto) => {
    try {
      setIsSubmitting(true);
      await calendarApi.createEvent(data);
      toast.success('Event created successfully');
      setIsEventFormOpen(false);
      setSelectedDate(null);
      loadEvents();
    } catch (error) {
      toast.error('Failed to create event');
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
      toast.success('Event updated successfully');
      setIsEventFormOpen(false);
      setSelectedEvent(null);
      loadEvents();
    } catch (error) {
      toast.error('Failed to update event');
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
      toast.success('Event deleted successfully');
      setEventToDelete(null);
      loadEvents();
    } catch (error) {
      toast.error('Failed to delete event');
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
      
      toast.success('Event moved successfully');
      loadEvents();
    } catch (error) {
      toast.error('Failed to move event');
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-lg text-gray-500">Loading...</div>
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
              Calendar
            </h1>
            <p className="text-gray-500 mt-1">
              Manage your schedule and events
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="secondary"
              onClick={() => setShowGoogleSettings(!showGoogleSettings)}
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              Google Settings
            </Button>
            <Button 
              onClick={handleNewEvent} 
              variant="primary"
              size="lg"
              className="gap-2"
            >
              <Plus className="w-5 h-5" />
              New Event
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
              Today
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

        {/* Placeholder for Event Form */}
        {isEventFormOpen && (
          <Modal open={isEventFormOpen} onClose={() => setIsEventFormOpen(false)}>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {selectedEvent ? 'Edit Event' : 'New Event'}
              </h2>
              <p className="text-gray-500">Event form will be implemented here</p>
              {selectedDate && (
                <p className="text-sm text-gray-400 mt-2">
                  Selected date: {format(selectedDate, 'PPP')}
                </p>
              )}
              <div className="flex gap-2 mt-4">
                <Button variant="secondary" onClick={() => setIsEventFormOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  onClick={() => {
                    // Placeholder for form submission
                    if (selectedEvent) {
                      handleUpdateEvent({ title: 'Updated Event' });
                    } else {
                      handleCreateEvent({
                        title: 'New Event',
                        startDateTime: new Date().toISOString(),
                        endDateTime: new Date().toISOString(),
                        allDay: false
                      });
                    }
                  }}
                >
                  Save
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Delete Confirmation Modal */}
        {eventToDelete && (
          <Modal open={true} onClose={() => setEventToDelete(null)}>
            <div className="p-6 space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Delete Event</h2>
              <p className="text-gray-500">
                Are you sure you want to delete "{eventToDelete.title}"? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setEventToDelete(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleDeleteEvent}
                  disabled={isSubmitting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isSubmitting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AppLayout>
  );
}