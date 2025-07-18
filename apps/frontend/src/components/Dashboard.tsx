import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../lib/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@personal-hub/ui';
import { formatDistanceToNow } from 'date-fns';
import type { DashboardStats } from '@personal-hub/shared';

type RecentItemType = 
  | DashboardStats['todos']['recentItems'][0]
  | DashboardStats['goals']['recentItems'][0]  
  | DashboardStats['events']['recentItems'][0]
  | DashboardStats['notes']['recentItems'][0]
  | DashboardStats['moments']['recentItems'][0];

function StatCard({ title, value, subtitle }: { title: string; value: number; subtitle?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

function RecentItem({ item, type }: { item: RecentItemType; type: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {type === 'moment' ? item.content : item.title}
        </p>
        {item.tags && item.tags.length > 0 && (
          <div className="flex gap-1 mt-1">
            {item.tags.slice(0, 3).map((tag: string, index: number) => (
              <span key={index} className="text-xs bg-secondary px-2 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <span className="text-xs text-muted-foreground ml-2">
        {formatDistanceToNow(new Date(item.createdAt || item.startDate), { addSuffix: true })}
      </span>
    </div>
  );
}

export function Dashboard() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => dashboardApi.getStats({ recentItemsLimit: 5 }),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(7)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-secondary rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-secondary rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Failed to load dashboard: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard 
          title="Todos" 
          value={stats.todos.pending} 
          subtitle={`${stats.todos.completed} completed`}
        />
        <StatCard 
          title="Goals in Progress" 
          value={stats.goals.inProgress} 
          subtitle={`${stats.goals.completed} completed`}
        />
        <StatCard 
          title="Upcoming Events" 
          value={stats.events.upcoming} 
          subtitle={`${stats.events.today} today`}
        />
        <StatCard 
          title="Notes" 
          value={stats.notes.total} 
        />
        <StatCard 
          title="Moments Today" 
          value={stats.moments.todayCount} 
          subtitle={`${stats.moments.total} total`}
        />
        <StatCard 
          title="Pomodoro Today" 
          value={stats.pomodoro.todaySessions} 
          subtitle={`${stats.pomodoro.todayMinutes} minutes`}
        />
        <StatCard 
          title="Pomodoro This Week" 
          value={stats.pomodoro.weekSessions} 
          subtitle={`${stats.pomodoro.weekMinutes} minutes`}
        />
        {stats.pomodoro.activeSession && (
          <StatCard 
            title="Active Session" 
            value={Math.floor(stats.pomodoro.activeSession.remainingSeconds / 60)} 
            subtitle={`${stats.pomodoro.activeSession.type} - minutes left`}
          />
        )}
      </div>

      {/* Recent Items Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Todos */}
        {stats.todos.recentItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Todos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.todos.recentItems.map(todo => (
                  <div key={todo.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        disabled
                        className="h-4 w-4"
                      />
                      <p className={`text-sm truncate ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {todo.title}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground ml-2">
                      {formatDistanceToNow(new Date(todo.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Goals */}
        {stats.goals.recentItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.goals.recentItems.map(goal => (
                  <div key={goal.id} className="py-2">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium truncate">{goal.title}</p>
                      <span className="text-xs text-muted-foreground">
                        {goal.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Events */}
        {stats.events.recentItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.events.recentItems.map(event => (
                  <RecentItem key={event.id} item={event} type="event" />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Notes */}
        {stats.notes.recentItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.notes.recentItems.map(note => (
                  <RecentItem key={note.id} item={note} type="note" />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Moments */}
        {stats.moments.recentItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Moments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.moments.recentItems.map(moment => (
                  <RecentItem key={moment.id} item={moment} type="moment" />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}