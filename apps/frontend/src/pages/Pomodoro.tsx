import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
import { SessionAction, SessionType } from '@/types/pomodoro';
import { prepareSessionData, getIncompleteTasks } from '@/utils/pomodoroHelpers';
import { Button } from '@/components/ui';
import { Card } from '@/components/ui/Card';
import { Clock } from 'lucide-react';

export function Pomodoro() {
  const location = useLocation();
  const { data: activeSession, isLoading } = useActiveSession();
  const { data: config } = usePomodoroConfig();
  const createSession = useCreateSession();
  const updateSession = useUpdateSession();

  // Tasks from active session
  const tasks = activeSession?.tasks || [];

  const handleCreateSession = (initialTask?: string) => {
    if (!config) return;

    const sessionData = prepareSessionData(config, initialTask, tasks);

    createSession.mutate(sessionData);
  };

  const handleSessionComplete = () => {
    // Check if we should auto-start break
    if (!activeSession || !config) return;

    if (activeSession.sessionType === 'WORK' && config.autoStartBreaks) {
      // Determine break type
      const isLongBreak = (activeSession.completedCycles + 1) % config.cyclesBeforeLongBreak === 0;
      const breakDuration = isLongBreak ? config.longBreakDuration : config.shortBreakDuration;

      // Create break session after a short delay
      setTimeout(() => {
        // Create session with incomplete tasks carried over
        const breakSessionData = {
          workDuration: config.workDuration,
          breakDuration: breakDuration,
          tasks: getIncompleteTasks(tasks),
        };

        createSession.mutate(breakSessionData, {
          onSuccess: (newSession) => {
            // Switch to break type after creation
            const breakType = isLongBreak ? SessionType.LONG_BREAK : SessionType.SHORT_BREAK;
            updateSession.mutate({
              id: newSession.id,
              action: SessionAction.SWITCH_TYPE,
              sessionType: breakType,
            });
          },
        });
      }, 1000);
    } else if (activeSession.sessionType !== 'WORK' && config.autoStartWork) {
      // Auto-start work session after break
      setTimeout(() => {
        handleCreateSession();
      }, 1000);
    }
  };

  const handleSessionUpdate = () => {
    // Session will be updated via the query invalidation in the hook
  };

  // Handle navigation state from command palette
  useEffect(() => {
    const state = location.state as { autoStart?: boolean } | null;
    if (state?.autoStart && !activeSession && config) {
      handleCreateSession();
      // Clear the state to prevent re-starting on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state, activeSession, config]);

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
            {activeSession ? (
              <PomodoroTimer
                session={activeSession}
                onComplete={handleSessionComplete}
                onUpdate={handleSessionUpdate}
              />
            ) : (
              <div className="text-center py-12">
                <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-xl font-semibold mb-2">アクティブなセッションがありません</h2>
                <p className="text-muted-foreground mb-6">
                  新しいセッションを開始して集中を始めましょう
                </p>
                <Button
                  onClick={() => handleCreateSession()}
                  size="lg"
                  disabled={createSession.isPending}
                >
                  {createSession.isPending ? '作成中...' : 'セッションを開始'}
                </Button>
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
