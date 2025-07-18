import { useCallback, useMemo, useState, type CSSProperties } from 'react';
import {
  Calendar,
  dateFnsLocalizer,
  type Event as RBCEvent,
  type View,
  type SlotInfo,
  type EventProps,
} from 'react-big-calendar';
import withDragAndDrop, { type EventInteractionArgs } from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { useEvents } from '@/lib/api/events';
import type { EventResponse } from '@personal-hub/shared';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@personal-hub/ui';
import { CalendarDays, CalendarRange, Bell } from 'lucide-react';
import { EventForm } from './EventForm';
import { useDeleteEventMutation, useUpdateEventMutation } from '@/lib/api/events';
import { parseISO } from 'date-fns';

const locales = {
  'en-US': enUS,
};

type CalendarEvent = RBCEvent & {
  id: string;
  resource: EventResponse;
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const DragAndDropCalendar = withDragAndDrop<CalendarEvent>(Calendar);

interface EventCalendarProps {
  onViewChange?: () => void;
}

export default function EventCalendar({ onViewChange }: EventCalendarProps) {
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<EventResponse | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<EventResponse | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [newEventSlot, setNewEventSlot] = useState<SlotInfo | null>(null);

  // Calculate date range based on current view
  const dateRange = useMemo(() => {
    const start = new Date(date);
    const end = new Date(date);
    
    if (view === 'month') {
      start.setDate(1);
      end.setMonth(end.getMonth() + 1, 0);
    } else if (view === 'week') {
      const day = start.getDay();
      start.setDate(start.getDate() - day);
      end.setDate(end.getDate() + (6 - day));
    }
    // Add some buffer for events that span across boundaries
    start.setDate(start.getDate() - 7);
    end.setDate(end.getDate() + 7);
    
    return { start, end };
  }, [date, view]);

  const { data: eventsData, isLoading } = useEvents({
    search: '',
    limit: 1000,
    offset: 0,
    startDate: dateRange.start.toISOString(),
    endDate: dateRange.end.toISOString(),
  });

  const deleteEventMutation = useDeleteEventMutation();
  const updateEventMutation = useUpdateEventMutation();

  const events = useMemo<CalendarEvent[]>(() => {
    if (!eventsData?.events) return [];
    
    return eventsData.events.map((event) => ({
      id: event.id,
      title: event.title,
      start: parseISO(event.startDateTime),
      end: parseISO(event.endDateTime),
      allDay: event.allDay,
      resource: event,
    }));
  }, [eventsData]);

  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    setNewEventSlot(slotInfo);
    setSelectedEvent(null);
    setShowEventForm(true);
  }, []);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event.resource);
    setNewEventSlot(null);
    setShowEventForm(true);
  }, []);

  const handleEventDrop = useCallback(
    ({ event, start, end }: EventInteractionArgs<CalendarEvent>) => {
      const updatedEvent = {
        ...event.resource,
        startDateTime: new Date(start).toISOString(),
        endDateTime: new Date(end).toISOString(),
      };
      
      updateEventMutation.mutate({
        id: event.id,
        data: updatedEvent,
      }, {
        onError: (error) => {
          console.error('Failed to update event:', error);
          // TODO: Add toast notification for user feedback
        },
      });
    },
    [updateEventMutation]
  );

  const handleDeleteEvent = useCallback(() => {
    if (eventToDelete) {
      deleteEventMutation.mutate(eventToDelete.id, {
        onSuccess: () => {
          setShowDeleteDialog(false);
          setEventToDelete(null);
          setShowEventForm(false);
        },
        onError: (error) => {
          console.error('Failed to delete event:', error);
          // TODO: Add toast notification for user feedback
        },
      });
    }
  }, [eventToDelete, deleteEventMutation]);

  const eventStyleGetter = useCallback(
    (event: CalendarEvent) => {
      const style: CSSProperties = {};
      if (event.resource.color) {
        style.backgroundColor = event.resource.color;
        style.borderColor = event.resource.color;
      }
      return { style };
    },
    []
  );

  const CustomEvent = ({ event }: EventProps<CalendarEvent>) => {
    return (
      <div className="flex items-center gap-1">
        <span className="truncate">{event.title}</span>
        {event.resource.reminderMinutes && (
          <Bell className="h-3 w-3" aria-label={`Reminder set for ${event.resource.reminderMinutes} minutes before`} />
        )}
      </div>
    );
  };

  interface ToolbarProps {
    onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY') => void;
    onView: (view: View) => void;
    date: Date;
    view: View;
  }

  const CustomToolbar = (props: ToolbarProps) => {
    const goToBack = () => {
      props.onNavigate('PREV');
    };

    const goToNext = () => {
      props.onNavigate('NEXT');
    };

    const goToToday = () => {
      props.onNavigate('TODAY');
    };

    const handleViewChange = (newView: View) => {
      props.onView(newView);
    };

    return (
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button onClick={goToBack} variant="outline" size="sm">
            Back
          </Button>
          <Button onClick={goToToday} variant="outline" size="sm">
            Today
          </Button>
          <Button onClick={goToNext} variant="outline" size="sm">
            Next
          </Button>
        </div>
        
        <h2 className="text-xl font-semibold">
          {props.view === 'month' 
            ? format(props.date, 'MMMM yyyy')
            : props.view === 'week'
            ? `Week of ${format(props.date, 'MMM d, yyyy')}`
            : format(props.date, 'MMM d, yyyy')}
        </h2>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={() => handleViewChange('month')}
            variant={props.view === 'month' ? 'default' : 'outline'}
            size="sm"
          >
            <CalendarDays className="h-4 w-4 mr-1" />
            Month
          </Button>
          <Button
            onClick={() => handleViewChange('week')}
            variant={props.view === 'week' ? 'default' : 'outline'}
            size="sm"
          >
            <CalendarRange className="h-4 w-4 mr-1" />
            Week
          </Button>
          <Button
            onClick={() => handleViewChange('day')}
            variant={props.view === 'day' ? 'default' : 'outline'}
            size="sm"
          >
            Day
          </Button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading events...</div>;
  }

  return (
    <div className="h-full">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calendar</h1>
        {onViewChange && (
          <Button onClick={onViewChange} variant="outline">
            List View
          </Button>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow p-4 calendar-container">
        <DragAndDropCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventDrop}
          selectable
          resizable
          popup
          eventPropGetter={eventStyleGetter}
          components={{
            event: CustomEvent,
            toolbar: CustomToolbar,
          }}
          style={{ height: '100%' }}
        />
      </div>

      <Dialog open={showEventForm} onOpenChange={setShowEventForm}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedEvent ? 'Edit Event' : 'Create New Event'}</DialogTitle>
          </DialogHeader>
          <EventForm
            event={selectedEvent}
            defaultValues={
              newEventSlot
                ? {
                    startDateTime: format(newEventSlot.start, "yyyy-MM-dd'T'HH:mm"),
                    endDateTime: format(newEventSlot.end, "yyyy-MM-dd'T'HH:mm"),
                    allDay: newEventSlot.action === 'select',
                  }
                : undefined
            }
            onClose={() => {
              setShowEventForm(false);
              setSelectedEvent(null);
              setNewEventSlot(null);
            }}
            onDelete={
              selectedEvent
                ? () => {
                    setEventToDelete(selectedEvent);
                    setShowDeleteDialog(true);
                  }
                : undefined
            }
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{eventToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEvent}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}