import { useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import {
  PomodoroTimer,
  PomodoroTasks,
  PomodoroHistory,
  PomodoroConfig,
} from '@/components/pomodoro';
import {
  useActiveSession,
  useCreateSession,
  usePomodoroConfig,
  useUpdateSession,
} from '@/hooks/usePomodoro';
import { PomodoroSession, SessionAction, SessionStatus, SessionType } from '@/types/pomodoro';
import { prepareSessionData } from '@/utils/pomodoroHelpers';
import { Card } from '@/components/ui/Card';
import { Clock } from 'lucide-react';

export function Pomodoro() {
  const location = useLocation();
  const navigate = useNavigate();
  const autoStartHandled = useRef(false);
  const { data: activeSession, isLoading } = useActiveSession();
  const { data: config } = usePomodoroConfig();
  const createSession = useCreateSession();
  const updateSession = useUpdateSession();

  // Create a temporary session object for display when no active session exists
  const tempSession = useMemo<PomodoroSession | null>(() => {
    if (!config || activeSession) return null;
    return {
      id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      userId: '',
      workDuration: config.workDuration,
      breakDuration: config.shortBreakDuration,
      sessionType: SessionType.WORK,
      status: SessionStatus.PENDING,
      completedCycles: 0,
      tasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }, [config, activeSession]);

  // Use active session or temporary session for display
  const displaySession = activeSession || tempSession;

  // Tasks from active session
  const tasks = activeSession?.tasks || [];

  const handleCreateSession = (initialTask?: string, sessionType: SessionType = SessionType.WORK, autoStart: boolean = false) => {
    if (!config) return;

    const sessionData = prepareSessionData(config, initialTask, tasks, sessionType);

    createSession.mutate(sessionData, {
      onSuccess: (newSession) => {
        if (autoStart) {
          // Auto-start the session immediately
          updateSession.mutate({
            id: newSession.id,
            action: SessionAction.START,
          });
        }
      }
    });
  };

  const handleSessionComplete = (completedSession?: PomodoroSession) => {
    // Check if we should auto-start break or work
    const session = completedSession || activeSession;
    if (!session || !config) return;

    if (session.sessionType === 'WORK' && config.autoStartBreaks) {
      // Determine break type based on completed cycles
      // The session has been marked as completed by PomodoroTimer, so cycles are already updated
      const isLongBreak = session.completedCycles % config.cyclesBeforeLongBreak === 0;
      const breakType = isLongBreak ? SessionType.LONG_BREAK : SessionType.SHORT_BREAK;

      // Create and auto-start break session after a short delay
      setTimeout(() => {
        const breakSessionData = prepareSessionData(
          config,
          undefined,        // no initial task
          session.tasks,
          breakType
        );

        createSession.mutate(breakSessionData, {
          onSuccess: (newSession) => {
            // Auto-start the break session immediately
            updateSession.mutate({
              id: newSession.id,
              action: SessionAction.START,
            });
          },
        });
      }, 1000);
    } else if (session.sessionType !== 'WORK' && config.autoStartWork) {
      // Auto-start work session after break
      setTimeout(() => {
        const workSessionData = prepareSessionData(
          config,
          undefined,         // no initial task
          session.tasks,
          SessionType.WORK
        );

        createSession.mutate(workSessionData, {
          onSuccess: (newSession) => {
            // Auto-start the work session immediately
            updateSession.mutate({
              id: newSession.id,
              action: SessionAction.START,
            });
          },
        });
      }, 1000);
    }
  };

  const handleSessionUpdate = (updatedSession: PomodoroSession) => {
    // If session was just completed, pass the updated session to complete handler
    if (updatedSession.status === SessionStatus.COMPLETED) {
      handleSessionComplete(updatedSession);
    }
  };

  // Handle navigation state from command palette
  useEffect(() => {
    const state = location.state as { autoStart?: boolean } | null;
    if (state?.autoStart && !activeSession && config && !autoStartHandled.current) {
      autoStartHandled.current = true;
      handleCreateSession(undefined, SessionType.WORK, true);
      // Clear the state to prevent re-starting on refresh
      navigate(
        { pathname: location.pathname, search: location.search, hash: location.hash },
        { replace: true, state: {} }
      );
    }
  }, [location.state, activeSession, config, navigate]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Clock className="h-12 w-12 mx-auto mb-4 animate-pulse" />
            <p>読み込み中...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Clock className="h-8 w-8" />
            ポモドーロタイマー
          </h1>
          <p className="text-muted-foreground mt-2">ポモドーロテクニックで集中力を高めましょう</p>
        </div>

        {/* Timer and Tasks Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Timer section */}
          <Card className="relative p-6">
            <PomodoroConfig />
            {displaySession ? (
              <PomodoroTimer
                session={displaySession}
                onComplete={() => {}}
                onUpdate={handleSessionUpdate}
                onStartNewSession={() => handleCreateSession(undefined, SessionType.WORK, true)}
              />
            ) : (
              <div className="text-center py-12">
                <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-xl font-semibold mb-2">読み込み中...</h2>
              </div>
            )}
          </Card>

          {/* Tasks section - always visible */}
          <Card className="p-6">
            <PomodoroTasks
              sessionId={activeSession?.id}
              tasks={tasks}
              isActiveSession={!!activeSession && activeSession.status === 'ACTIVE'}
              onCreateSession={handleCreateSession}
            />
          </Card>
        </div>

        {/* History section - full width */}
        <Card className="p-6">
          <PomodoroHistory showTaskDetails={true} />
        </Card>
      </div>
    </AppLayout>
  );
}
