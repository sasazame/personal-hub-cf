import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createEventSchema, type CreateEventRequest } from '@personal-hub/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '../lib/api/events';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';

export function EventForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateEventRequest>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      allDay: false,
    },
  });

  const isAllDay = watch('allDay');

  const createEventMutation = useMutation({
    mutationFn: eventsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      onClose();
    },
  });

  const onSubmit = async (data: CreateEventRequest) => {
    setIsSubmitting(true);
    try {
      // Convert datetime-local or date input to ISO string
      if (data.allDay) {
        // For all day events, set times to start and end of day
        const startDate = new Date(data.startDateTime + 'T00:00:00');
        const endDate = new Date(data.endDateTime + 'T23:59:59');
        data.startDateTime = startDate.toISOString();
        data.endDateTime = endDate.toISOString();
      } else {
        // For regular events, datetime-local gives us the right format
        data.startDateTime = new Date(data.startDateTime).toISOString();
        data.endDateTime = new Date(data.endDateTime).toISOString();
      }
      
      await createEventMutation.mutateAsync(data);
    } catch (error) {
      console.error('Failed to create event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          {...register('title')}
          placeholder="Event title"
        />
        {errors.title && (
          <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Event description (optional)"
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="allDay"
          checked={isAllDay}
          onCheckedChange={(checked) => setValue('allDay', checked as boolean)}
        />
        <Label htmlFor="allDay">All day event</Label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDateTime">
            {isAllDay ? 'Start Date' : 'Start Date & Time'}
          </Label>
          <Input
            id="startDateTime"
            type={isAllDay ? 'date' : 'datetime-local'}
            {...register('startDateTime')}
          />
          {errors.startDateTime && (
            <p className="text-sm text-red-500 mt-1">{errors.startDateTime.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="endDateTime">
            {isAllDay ? 'End Date' : 'End Date & Time'}
          </Label>
          <Input
            id="endDateTime"
            type={isAllDay ? 'date' : 'datetime-local'}
            {...register('endDateTime')}
          />
          {errors.endDateTime && (
            <p className="text-sm text-red-500 mt-1">{errors.endDateTime.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          {...register('location')}
          placeholder="Event location (optional)"
        />
      </div>

      <div>
        <Label htmlFor="reminderMinutes">Reminder (minutes before)</Label>
        <Input
          id="reminderMinutes"
          type="number"
          {...register('reminderMinutes', { 
            setValueAs: (v) => v === '' ? null : parseInt(v, 10)
          })}
          placeholder="e.g., 15"
        />
      </div>

      <div>
        <Label htmlFor="color">Color</Label>
        <Input
          id="color"
          type="color"
          {...register('color')}
          defaultValue="#3b82f6"
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Event'}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}