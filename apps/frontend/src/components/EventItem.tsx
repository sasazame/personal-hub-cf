import { useState } from 'react';
import { format, isToday, isTomorrow, isThisWeek } from 'date-fns';
import { Calendar, Clock, MapPin, Trash2, Edit } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { EventResponse } from '@personal-hub/shared';
import { eventsApi } from '../lib/api/events';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface EventItemProps {
  event: EventResponse;
  onEdit: (event: EventResponse) => void;
}

export function EventItem({ event, onEdit }: EventItemProps) {
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteEventMutation = useMutation({
    mutationFn: () => eventsApi.delete(event.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    
    setIsDeleting(true);
    try {
      await deleteEventMutation.mutateAsync();
    } catch (error) {
      console.error('Failed to delete event:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatEventDate = (startDate: string, endDate: string, allDay: boolean) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (allDay) {
      // For all-day events, just show the date(s)
      if (format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) {
        return format(start, 'MMM d, yyyy');
      } else {
        return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
      }
    } else {
      // For timed events
      if (format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) {
        // Same day
        return `${format(start, 'MMM d, yyyy')} • ${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
      } else {
        // Different days
        return `${format(start, 'MMM d, h:mm a')} - ${format(end, 'MMM d, h:mm a')}`;
      }
    }
  };

  const getDateLabel = (date: string) => {
    const eventDate = new Date(date);
    if (isToday(eventDate)) return 'Today';
    if (isTomorrow(eventDate)) return 'Tomorrow';
    if (isThisWeek(eventDate)) return format(eventDate, 'EEEE');
    return null;
  };

  const dateLabel = getDateLabel(event.startDateTime);

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {event.color && (
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: event.color }}
              />
            )}
            <h3 className="font-semibold text-lg">{event.title}</h3>
            {dateLabel && (
              <span className="text-sm text-green-600 font-medium">{dateLabel}</span>
            )}
          </div>
          
          {event.description && (
            <p className="text-gray-600 mb-2">{event.description}</p>
          )}
          
          <div className="space-y-1 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              {event.allDay ? <Calendar size={16} /> : <Clock size={16} />}
              <span>{formatEventDate(event.startDateTime, event.endDateTime, event.allDay)}</span>
            </div>
            
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin size={16} />
                <span>{event.location}</span>
              </div>
            )}
            
            {event.reminderMinutes && (
              <div className="text-xs text-gray-400">
                Reminder: {event.reminderMinutes} minutes before
              </div>
            )}
          </div>
        </div>
        
        <div className="flex gap-1 ml-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(event)}
            className="h-8 w-8 p-0"
          >
            <Edit size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>
    </Card>
  );
}