import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { pomodoroApi } from '@/lib/pomodoro-api';
import { PomodoroSession, SessionStatus, SessionType } from '@/types/pomodoro';
import { format, isToday, isYesterday } from 'date-fns';
import { Clock, Coffee, Brain, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/cn';

interface PomodoroHistoryProps {
  showTaskDetails?: boolean;
}

export function PomodoroHistory({ showTaskDetails = false }: PomodoroHistoryProps) {
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['pomodoro-sessions', page],
    queryFn: () => pomodoroApi.getSessions(page, 20)
  });

  const toggleExpanded = (sessionId: string) => {
    setExpandedSessions(prev => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
  };

  const getSessionIcon = (type: string) => {
    switch (type) {
      case SessionType.WORK:
        return <Brain className="w-4 h-4" />;
      case SessionType.SHORT_BREAK:
      case SessionType.LONG_BREAK:
        return <Coffee className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getSessionTypeLabel = (type: string) => {
    switch (type) {
      case SessionType.WORK:
        return '作業';
      case SessionType.SHORT_BREAK:
        return '短い休憩';
      case SessionType.LONG_BREAK:
        return '長い休憩';
      default:
        return 'セッション';
    }
  };

  const getSessionStatusIcon = (status: string) => {
    switch (status) {
      case SessionStatus.COMPLETED:
        return <>
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-xs text-green-600">完了</span>
        </>;
      case SessionStatus.CANCELLED:
        return <>
          <XCircle className="w-4 h-4 text-destructive" />
          <span className="text-xs text-destructive">キャンセル</span>
        </>;
      default:
        return null;
    }
  };

  const getSessionDuration = (session: PomodoroSession) => {
    if (!session.startTime) return '0m';
    
    const start = new Date(session.startTime);
    const end = session.endTime ? new Date(session.endTime) : new Date();
    const durationMs = end.getTime() - start.getTime();
    const minutes = Math.floor(durationMs / 60000);
    
    return `${minutes}m`;
  };

  const formatSessionDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return '今日';
    if (isYesterday(date)) return '昨日';
    return format(date, 'MMM dd, yyyy');
  };

  const groupSessionsByDate = (sessions: PomodoroSession[]) => {
    const groups: Record<string, PomodoroSession[]> = {};
    
    sessions.forEach(session => {
      const date = formatSessionDate(session.createdAt);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(session);
    });
    
    return groups;
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">履歴を読み込み中...</p>
      </div>
    );
  }

  const sessions = data?.content || [];
  const groupedSessions = groupSessionsByDate(sessions);

  return (
    <div className="space-y-4" data-testid="session-history">
      <h3 className="text-lg font-semibold">履歴</h3>

      {sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          セッションがまだありません。最初のポモドーロを始めましょう！
        </p>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedSessions).map(([date, dateSessions]) => (
            <div key={date}>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                {date}
              </h4>
              
              <div className="space-y-2">
                {dateSessions.map((session) => {
                  const isExpanded = expandedSessions.has(session.id);
                  
                  return (
                    <div
                      key={session.id}
                      className={cn(
                        "rounded-lg border",
                        "border-border",
                        "bg-card"
                      )}
                      data-testid="session-item"
                    >
                      <div
                        className={cn(
                          "flex items-center gap-3 p-3",
                          showTaskDetails && session.tasks && session.tasks.length > 0 && "cursor-pointer hover:bg-accent/50"
                        )}
                        onClick={() => {
                          if (showTaskDetails && session.tasks && session.tasks.length > 0) {
                            toggleExpanded(session.id);
                          }
                        }}
                      >
                        <div className={cn(
                          "flex items-center gap-2",
                          session.sessionType === SessionType.WORK 
                            ? "text-blue-600"
                            : "text-green-600"
                        )}>
                          {getSessionIcon(session.sessionType)}
                          <span className="text-sm font-medium">
                            {getSessionTypeLabel(session.sessionType)}
                          </span>
                        </div>

                        <div className="flex-1 flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{format(new Date(session.createdAt), 'HH:mm')}</span>
                          <span>{getSessionDuration(session)}</span>
                          {session.completedCycles > 0 && (
                            <span>サイクル {session.completedCycles}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {getSessionStatusIcon(session.status)}
                          {showTaskDetails && session.tasks && session.tasks.length > 0 && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <span>{session.tasks.filter(t => t.completed).length}/{session.tasks.length}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {isExpanded && session.tasks && session.tasks.length > 0 && (
                        <div className="px-3 pb-3">
                          <div className="border-t border-border pt-3 space-y-1">
                            {session.tasks.map((task) => (
                              <div
                                key={task.id}
                                className="flex items-center gap-2 text-sm"
                              >
                                {task.completed ? (
                                  <CheckCircle className="w-3 h-3 text-green-600 shrink-0" />
                                ) : (
                                  <Circle className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                                )}
                                <span className={cn(
                                  task.completed && "line-through text-muted-foreground"
                                )}>
                                  {task.description}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className={cn(
              "px-3 py-1 text-sm rounded",
              "border border-border",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "hover:bg-accent"
            )}
          >
            前
          </button>
          <span className="px-3 py-1 text-sm">
            {page + 1} / {data.totalPages}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= data.totalPages - 1}
            className={cn(
              "px-3 py-1 text-sm rounded",
              "border border-border",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "hover:bg-accent"
            )}
          >
            次
          </button>
        </div>
      )}
    </div>
  );
}

function Circle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
    </svg>
  );
}