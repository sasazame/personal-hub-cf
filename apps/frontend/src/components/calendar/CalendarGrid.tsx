import { CalendarEvent } from '@/types/calendar';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { cn } from '@/lib/cn';
import { useState } from 'react';

interface CalendarGridProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onEventDateChange?: (eventId: number, newDate: Date) => void;
}

export function CalendarGrid({ 
  currentDate, 
  events, 
  onDateClick, 
  onEventClick, 
  onEventDateChange 
}: CalendarGridProps) {
  const safeEvents = Array.isArray(events) ? events : [];
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - monthStart.getDay());
  
  const endDate = new Date(monthEnd);
  endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay()));

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null);
  
  const getEventsForDay = (date: Date) => {
    return safeEvents
      .filter(event => {
        const eventStart = new Date(event.startDateTime);
        const eventEnd = new Date(event.endDateTime);
        
        if (event.allDay) {
          return isSameDay(date, eventStart) || 
                 (date >= eventStart && date <= eventEnd);
        }
        
        return eventStart.getFullYear() === date.getFullYear() &&
               eventStart.getMonth() === date.getMonth() &&
               eventStart.getDate() === date.getDate();
      })
      .sort((a, b) => {
        const startDiff = new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime();
        if (startDiff !== 0) return startDiff;
        return new Date(a.endDateTime).getTime() - new Date(b.endDateTime).getTime();
      });
  };

  const formatEventTitle = (event: CalendarEvent) => {
    if (event.allDay) {
      return event.title;
    }
    const eventDate = new Date(event.startDateTime);
    const hours = eventDate.getHours().toString().padStart(2, '0');
    const minutes = eventDate.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes} ${event.title}`;
  };

  const toggleDateExpansion = (date: Date) => {
    const dateKey = date.toISOString().split('T')[0];
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(dateKey)) {
      newExpanded.delete(dateKey);
    } else {
      newExpanded.add(dateKey);
    }
    setExpandedDates(newExpanded);
  };

  const isDateExpanded = (date: Date) => {
    const dateKey = date.toISOString().split('T')[0];
    return expandedDates.has(dateKey);
  };

  const handleDragStart = (e: React.DragEvent, event: CalendarEvent) => {
    if (!onEventDateChange) return;
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = 'move';
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    setDraggedEvent(null);
    setDragOverDate(null);
  };

  const handleDragOver = (e: React.DragEvent, date: Date) => {
    if (!draggedEvent || !onEventDateChange) return;
    e.preventDefault();
    setDragOverDate(date);
  };

  const handleDragLeave = () => {
    setDragOverDate(null);
  };

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    if (!draggedEvent || !onEventDateChange || !draggedEvent.id) return;
    
    const newDate = new Date(date);
    const originalDate = new Date(draggedEvent.startDateTime);
    newDate.setHours(originalDate.getHours());
    newDate.setMinutes(originalDate.getMinutes());
    
    onEventDateChange(draggedEvent.id, newDate);
    setDraggedEvent(null);
    setDragOverDate(null);
  };

  const getEventColor = (color?: string) => {
    const colorMap = {
      blue: 'event-blue',
      green: 'event-green',
      red: 'event-red',
      purple: 'event-purple',
      orange: 'event-orange',
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div 
      data-testid="calendar-grid"
      className="bg-card rounded-lg shadow-sm border border-border overflow-hidden"
    >
      {/* Header */}
      <div className="grid grid-cols-7">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
          <div
            key={day}
            className={cn(
              "p-3 text-center text-sm font-medium border-b border-r border-border",
              index === 0 && "bg-destructive/10 text-destructive",
              index === 6 && "bg-primary/10 text-primary",
              index > 0 && index < 6 && "bg-muted text-muted-foreground"
            )}
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar Days */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isDayToday = isToday(day);
          const isExpanded = isDateExpanded(day);
          
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[120px] p-2 cursor-pointer transition-all border-r border-b border-border",
                isCurrentMonth 
                  ? "bg-card hover:bg-accent" 
                  : "bg-muted text-muted-foreground",
                dragOverDate && isSameDay(dragOverDate, day) && "bg-primary/10 border-primary"
              )}
              onClick={() => onDateClick(day)}
              onDragOver={(e) => handleDragOver(e, day)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, day)}
            >
              <div className="mb-1">
                {isDayToday ? (
                  <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    {format(day, 'd')}
                  </div>
                ) : (
                  <div className={cn(
                    "text-sm font-medium",
                    isCurrentMonth ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {format(day, 'd')}
                  </div>
                )}
              </div>
              
              <div className="space-y-1">
                {(isExpanded ? dayEvents : dayEvents.slice(0, 3)).map((event) => (
                  <div
                    key={event.id}
                    draggable={!!onEventDateChange}
                    onDragStart={(e) => handleDragStart(e, event)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 transition-opacity border",
                      onEventDateChange && "cursor-move",
                      getEventColor(event.color)
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                    title={formatEventTitle(event)}
                  >
                    {formatEventTitle(event)}
                  </div>
                ))}
                {dayEvents.length > 3 && !isExpanded && (
                  <button
                    className="text-xs text-primary hover:underline font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDateExpansion(day);
                    }}
                  >
                    +{dayEvents.length - 3} more
                  </button>
                )}
                {isExpanded && dayEvents.length > 3 && (
                  <button
                    className="text-xs text-primary hover:underline font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDateExpansion(day);
                    }}
                  >
                    Show less
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}