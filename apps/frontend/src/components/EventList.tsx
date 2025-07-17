import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Calendar, Search } from 'lucide-react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import type { EventResponse, ListEventsQuery } from '@personal-hub/shared';
import { eventsApi } from '../lib/api/events';
import { EventItem } from './EventItem';
import { EventForm } from './EventForm';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

export function EventList() {
  const [showEventForm, setShowEventForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [page, setPage] = useState(0);
  const limit = 20;

  // Calculate date range based on filter
  const getDateRange = (): { startDate?: string; endDate?: string } => {
    const now = new Date();
    switch (dateFilter) {
      case 'today': {
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date(now);
        todayEnd.setHours(23, 59, 59, 999);
        return {
          startDate: today.toISOString(),
          endDate: todayEnd.toISOString(),
        };
      }
      case 'week': {
        return {
          startDate: startOfWeek(now).toISOString(),
          endDate: endOfWeek(now).toISOString(),
        };
      }
      case 'month': {
        return {
          startDate: startOfMonth(now).toISOString(),
          endDate: endOfMonth(now).toISOString(),
        };
      }
      default:
        return {};
    }
  };

  const queryParams: ListEventsQuery = {
    search: searchTerm || undefined,
    limit,
    offset: page * limit,
    ...getDateRange(),
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['events', queryParams],
    queryFn: () => eventsApi.list(queryParams),
  });

  const handleEdit = (_event: EventResponse) => {
    // TODO: Implement edit functionality
    // This would open an edit dialog with the event data
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          Events
        </h2>
        <Button onClick={() => setShowEventForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Event
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={dateFilter}
          onValueChange={(value) => setDateFilter(value as typeof dateFilter)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )}

      {error && (
        <Card className="p-4 text-red-600">
          Failed to load events. Please try again.
        </Card>
      )}

      {data && data.events.length === 0 && (
        <Card className="p-8 text-center text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No events found.</p>
          {searchTerm && <p className="text-sm mt-2">Try adjusting your search.</p>}
        </Card>
      )}

      {data && data.events.length > 0 && (
        <>
          <div className="space-y-2">
            {data.events.map((event) => (
              <EventItem
                key={event.id}
                event={event}
                onEdit={handleEdit}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      <Dialog open={showEventForm} onOpenChange={setShowEventForm}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
          </DialogHeader>
          <EventForm onClose={() => setShowEventForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}