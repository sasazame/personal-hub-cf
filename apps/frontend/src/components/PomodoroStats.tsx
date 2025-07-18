import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { pomodoroApi } from '../lib/api/pomodoro';
import { formatDistanceToNow } from 'date-fns';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import type { SessionResponse, SessionType } from '@personal-hub/shared';

export function PomodoroStats() {
  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['pomodoro-stats'],
    queryFn: async () => {
      const response = await pomodoroApi.getStats(7);
      return response.data;
    },
  });

  // Fetch recent sessions
  const { data: sessions } = useQuery({
    queryKey: ['pomodoro-sessions'],
    queryFn: async () => {
      const response = await pomodoroApi.getSessions({ limit: 10, offset: 0 });
      return response.data;
    },
  });

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getSessionTypeLabel = (type: SessionType): string => {
    switch (type) {
      case 'WORK':
        return 'Work';
      case 'SHORT_BREAK':
        return 'Short Break';
      case 'LONG_BREAK':
        return 'Long Break';
    }
  };

  const getSessionTypeColor = (type: SessionType): string => {
    switch (type) {
      case 'WORK':
        return 'text-blue-600';
      case 'SHORT_BREAK':
        return 'text-green-600';
      case 'LONG_BREAK':
        return 'text-purple-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{stats.totalSessions}</div>
              <p className="text-sm text-muted-foreground">Total Sessions</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">
                {Math.round(stats.completionRate * 100)}%
              </div>
              <p className="text-sm text-muted-foreground">Completion Rate</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">
                {formatDuration(Math.round(stats.totalWorkTime / 60))}
              </div>
              <p className="text-sm text-muted-foreground">Work Time</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">
                {formatDuration(Math.round(stats.totalBreakTime / 60))}
              </div>
              <p className="text-sm text-muted-foreground">Break Time</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Daily Stats Chart */}
      {stats && stats.dailyStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Daily Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.dailyStats.map((day) => (
                <div key={day.date} className="flex items-center justify-between">
                  <span className="text-sm">
                    {new Date(day.date).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {day.sessions} sessions
                    </span>
                    <span className="text-sm">
                      {formatDuration(Math.round((day.workTime + day.breakTime) / 60))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Sessions */}
      {sessions && sessions.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sessions.data.map((session: SessionResponse) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className={`font-medium ${getSessionTypeColor(session.sessionType)}`}>
                        {getSessionTypeLabel(session.sessionType)}
                      </span>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(session.startTime), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm">
                      {Math.round(session.duration / 60)} min
                    </span>
                    {session.completed ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}