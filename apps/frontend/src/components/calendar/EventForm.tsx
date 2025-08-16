import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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

const useColorOptions = (t: (key: string) => string) => [
  { value: 'blue', label: t('colorOptions.blue'), class: 'bg-blue-500' },
  { value: 'green', label: t('colorOptions.green'), class: 'bg-green-500' },
  { value: 'red', label: t('colorOptions.red'), class: 'bg-red-500' },
  { value: 'purple', label: t('colorOptions.purple'), class: 'bg-purple-500' },
  { value: 'orange', label: t('colorOptions.orange'), class: 'bg-orange-500' },
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
  const { t } = useTranslation(['calendar', 'common']);
  const colorOptions = useColorOptions(t);
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
      newErrors.title = t('form.titleRequired');
    }
    
    if (!startDateTime) {
      newErrors.startDateTime = t('form.startDateRequired');
    }
    
    if (!endDateTime) {
      newErrors.endDateTime = t('form.endDateRequired');
    }
    
    if (startDateTime && endDateTime) {
      const start = new Date(startDateTime);
      const end = new Date(endDateTime);
      
      if (allDay) {
        // For all-day events, allow same date
        if (end < start) {
          newErrors.endDateTime = t('form.endDateAfterStart');
        }
      } else {
        // For timed events, end must be after start
        if (end <= start) {
          newErrors.endDateTime = t('form.endTimeAfterStart');
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
          {event ? t('editEvent') : t('newEvent')}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('eventTitle')} *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('form.titlePlaceholder')}
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1">{errors.title}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('eventDescription')}
            </label>
            <TextArea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('form.descriptionPlaceholder')}
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
                {t('labels.allDayEvent')}
              </label>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {allDay ? t('form.startDate') : t('form.startDateTime')} *
                </label>
                <input
                  type={allDay ? 'date' : 'datetime-local'}
                  value={startDateTime}
                  onChange={(e) => setStartDateTime(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring ${
                    errors.startDateTime ? 'border-destructive' : 'border-border'
                  } bg-background`}
                />
                {errors.startDateTime && (
                  <p className="text-red-500 text-xs mt-1">{errors.startDateTime}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  {allDay ? t('form.endDate') : t('form.endDateTime')} *
                </label>
                <input
                  type={allDay ? 'date' : 'datetime-local'}
                  value={endDateTime}
                  onChange={(e) => setEndDateTime(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring ${
                    errors.endDateTime ? 'border-destructive' : 'border-border'
                  } bg-background`}
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
              {t('location')}
            </label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t('form.locationPlaceholder')}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              <Palette className="w-4 h-4 inline mr-1" />
              {t('color')}
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
                {t('labels.delete')}
              </Button>
            )}
            <div className={`flex gap-2 ${!event || !onDelete ? 'ml-auto' : ''}`}>
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                {t('labels.cancel')}
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? t('labels.saving') : (event ? t('labels.update') : t('labels.create'))}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}