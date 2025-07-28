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
      blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300 dark:border-blue-700',
      green: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-green-300 dark:border-green-700',
      red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-300 dark:border-red-700',
      purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-300 dark:border-purple-700',
      orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-300 dark:border-orange-700',
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div 
      data-testid="calendar-grid"
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      {/* Header */}
      <div className="grid grid-cols-7">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
          <div
            key={day}
            className={cn(
              "p-3 text-center text-sm font-medium border-b border-r dark:border-gray-700",
              index === 0 && "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400",
              index === 6 && "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
              index > 0 && index < 6 && "bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400"
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
                "min-h-[120px] p-2 cursor-pointer transition-all border-r border-b dark:border-gray-700",
                isCurrentMonth 
                  ? "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50" 
                  : "bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-600",
                dragOverDate && isSameDay(dragOverDate, day) && "bg-blue-50 dark:bg-blue-900/20 border-blue-500"
              )}
              onClick={() => onDateClick(day)}
              onDragOver={(e) => handleDragOver(e, day)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, day)}
            >
              <div className="mb-1">
                {isDayToday ? (
                  <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {format(day, 'd')}
                  </div>
                ) : (
                  <div className={cn(
                    "text-sm font-medium",
                    isCurrentMonth ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-600"
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
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
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
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
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