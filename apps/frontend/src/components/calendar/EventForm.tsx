import { useState, useEffect } from 'react';
import { CalendarEvent, CreateCalendarEventDto, UpdateCalendarEventDto } from '@/types/calendar';
import { Modal, Button, Input, TextArea } from '@/components/ui';
import { format } from 'date-fns';
import { Clock, MapPin, Palette, Trash2 } from 'lucide-react';

interface EventFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCalendarEventDto | UpdateCalendarEventDto) => void;
  event?: CalendarEvent;
  defaultDate?: Date;
  isSubmitting?: boolean;
  onDelete?: () => void;
}

const colorOptions = [
  { value: 'blue', label: 'Blue', class: 'bg-blue-500' },
  { value: 'green', label: 'Green', class: 'bg-green-500' },
  { value: 'red', label: 'Red', class: 'bg-red-500' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-500' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
];

export function EventForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  event, 
  defaultDate, 
  isSubmitting, 
  onDelete 
}: EventFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [location, setLocation] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [color, setColor] = useState('blue');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen) {
      if (event) {
        // Editing existing event
        setTitle(event.title);
        setDescription(event.description || '');
        setLocation(event.location || '');
        setAllDay(event.allDay);
        setColor(event.color || 'blue');
        
        if (event.allDay) {
          setStartDateTime(event.startDateTime.split('T')[0]);
          setEndDateTime(event.endDateTime.split('T')[0]);
        } else {
          setStartDateTime(formatDateTimeForInput(event.startDateTime));
          setEndDateTime(formatDateTimeForInput(event.endDateTime));
        }
      } else {
        // Creating new event
        setTitle('');
        setDescription('');
        setLocation('');
        setAllDay(false);
        setColor('blue');
        
        if (defaultDate) {
          const startDate = new Date(defaultDate);
          const endDate = new Date(defaultDate);
          
          // Round to next 30 minute interval
          const minutes = startDate.getMinutes();
          if (minutes !== 0 && minutes !== 30) {
            startDate.setMinutes(minutes < 30 ? 30 : 60, 0, 0);
          }
          endDate.setTime(startDate.getTime() + 60 * 60 * 1000); // 1 hour later
          
          setStartDateTime(formatDateTimeForInput(startDate.toISOString()));
          setEndDateTime(formatDateTimeForInput(endDate.toISOString()));
        } else {
          const now = new Date();
          now.setMinutes(Math.ceil(now.getMinutes() / 30) * 30, 0, 0);
          const later = new Date(now.getTime() + 60 * 60 * 1000);
          
          setStartDateTime(formatDateTimeForInput(now.toISOString()));
          setEndDateTime(formatDateTimeForInput(later.toISOString()));
        }
      }
      setErrors({});
    }
  }, [isOpen, event, defaultDate]);

  const formatDateTimeForInput = (isoString: string) => {
    const date = new Date(isoString);
    return format(date, "yyyy-MM-dd'T'HH:mm");
  };

  const handleAllDayChange = (checked: boolean) => {
    setAllDay(checked);
    
    if (checked && startDateTime) {
      // Convert to date only
      setStartDateTime(startDateTime.split('T')[0]);
      setEndDateTime(endDateTime.split('T')[0] || startDateTime.split('T')[0]);
    } else if (!checked && startDateTime && !startDateTime.includes('T')) {
      // Convert to datetime
      setStartDateTime(startDateTime + 'T09:00');
      setEndDateTime((endDateTime || startDateTime) + 'T10:00');
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!startDateTime) {
      newErrors.startDateTime = 'Start date is required';
    }
    
    if (!endDateTime) {
      newErrors.endDateTime = 'End date is required';
    }
    
    if (startDateTime && endDateTime) {
      const start = new Date(startDateTime);
      const end = new Date(endDateTime);
      
      if (allDay) {
        // For all-day events, allow same date
        if (end < start) {
          newErrors.endDateTime = 'End date must be on or after start date';
        }
      } else {
        // For timed events, end must be after start
        if (end <= start) {
          newErrors.endDateTime = 'End time must be after start time';
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    const formData = {
      title: title.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      allDay,
      color,
      startDateTime: allDay 
        ? new Date(startDateTime + 'T00:00:00').toISOString()
        : new Date(startDateTime).toISOString(),
      endDateTime: allDay
        ? new Date(endDateTime + 'T23:59:59').toISOString()
        : new Date(endDateTime).toISOString(),
    };
    
    if (event) {
      // Update event - only include changed fields
      const updateData: UpdateCalendarEventDto = {};
      if (formData.title !== event.title) updateData.title = formData.title;
      if (formData.description !== event.description) updateData.description = formData.description;
      if (formData.location !== event.location) updateData.location = formData.location;
      if (formData.allDay !== event.allDay) updateData.allDay = formData.allDay;
      if (formData.color !== event.color) updateData.color = formData.color;
      if (formData.startDateTime !== event.startDateTime) updateData.startDateTime = formData.startDateTime;
      if (formData.endDateTime !== event.endDateTime) updateData.endDateTime = formData.endDateTime;
      
      onSubmit(updateData);
    } else {
      // Create event
      onSubmit(formData as CreateCalendarEventDto);
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  return (
    <Modal open={isOpen} onClose={handleClose}>
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          {event ? 'Edit Event' : 'New Event'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              label="Title *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1">{errors.title}</p>
            )}
          </div>
          
          <div>
            <TextArea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Event description"
              rows={3}
            />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="allDay"
                checked={allDay}
                onChange={(e) => handleAllDayChange(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="allDay" className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                All day event
              </label>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Start {allDay ? 'Date' : 'Date & Time'} *
                </label>
                <input
                  type={allDay ? 'date' : 'datetime-local'}
                  value={startDateTime}
                  onChange={(e) => setStartDateTime(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.startDateTime ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-800`}
                />
                {errors.startDateTime && (
                  <p className="text-red-500 text-xs mt-1">{errors.startDateTime}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  End {allDay ? 'Date' : 'Date & Time'} *
                </label>
                <input
                  type={allDay ? 'date' : 'datetime-local'}
                  value={endDateTime}
                  onChange={(e) => setEndDateTime(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.endDateTime ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-800`}
                />
                {errors.endDateTime && (
                  <p className="text-red-500 text-xs mt-1">{errors.endDateTime}</p>
                )}
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              <MapPin className="w-4 h-4 inline mr-1" />
              Location
            </label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Event location"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              <Palette className="w-4 h-4 inline mr-1" />
              Color
            </label>
            <div className="flex gap-2">
              {colorOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setColor(option.value)}
                  className={`w-8 h-8 rounded-full ${option.class} ${
                    color === option.value ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                  }`}
                  title={option.label}
                />
              ))}
            </div>
          </div>
          
          <div className="flex justify-between pt-4 border-t">
            {event && onDelete && (
              <Button
                type="button"
                variant="secondary"
                onClick={onDelete}
                disabled={isSubmitting}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            )}
            <div className={`flex gap-2 ${!event || !onDelete ? 'ml-auto' : ''}`}>
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : (event ? 'Update' : 'Create')}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}