import { useState, useEffect, useRef } from 'react';
import { PomodoroSession, SessionStatus, SessionType, SessionAction } from '@/types/pomodoro';
import { pomodoroApi } from '@/lib/pomodoro-api';
import { Button } from '@/components/ui';
import { Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react';
import { cn } from '@/lib/cn';

interface PomodoroTimerProps {
  session: PomodoroSession;
  onComplete?: () => void;
  onUpdate?: (session: PomodoroSession) => void;
}

export function PomodoroTimer({ session, onComplete, onUpdate }: PomodoroTimerProps) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio
    audioRef.current = new Audio('/sounds/alarm.mp3');
    audioRef.current.volume = 0.5;
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (session) {
      const duration = session.sessionType === SessionType.WORK 
        ? session.workDuration 
        : session.breakDuration;
      
      if (session.status === SessionStatus.ACTIVE && session.startTime) {
        const elapsed = Math.floor((Date.now() - new Date(session.startTime).getTime()) / 1000);
        const remaining = Math.max(0, duration * 60 - elapsed);
        setTimeLeft(remaining);
        setIsRunning(true);
      } else {
        setTimeLeft(duration * 60);
        setIsRunning(false);
      }
    }
  }, [session]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const handleComplete = async () => {
    setIsRunning(false);
    
    // Play alarm sound
    if (audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
    
    try {
      const updatedSession = await pomodoroApi.updateSession(session.id, {
        action: SessionAction.COMPLETE
      });
      
      onUpdate?.(updatedSession);
      onComplete?.();
    } catch (error) {
      console.error('Failed to complete session:', error);
    }
  };

  const handleStart = async () => {
    try {
      const updatedSession = await pomodoroApi.updateSession(session.id, {
        action: SessionAction.START
      });
      setIsRunning(true);
      onUpdate?.(updatedSession);
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const handlePause = async () => {
    try {
      const updatedSession = await pomodoroApi.updateSession(session.id, {
        action: SessionAction.PAUSE
      });
      setIsRunning(false);
      onUpdate?.(updatedSession);
    } catch (error) {
      console.error('Failed to pause session:', error);
    }
  };

  const handleReset = async () => {
    try {
      const updatedSession = await pomodoroApi.updateSession(session.id, {
        action: SessionAction.CANCEL
      });
      setIsRunning(false);
      setTimeLeft(session.workDuration * 60);
      onUpdate?.(updatedSession);
    } catch (error) {
      console.error('Failed to reset session:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSessionIcon = () => {
    switch (session.sessionType) {
      case SessionType.WORK:
        return <Brain className="w-8 h-8" />;
      case SessionType.SHORT_BREAK:
      case SessionType.LONG_BREAK:
        return <Coffee className="w-8 h-8" />;
      default:
        return null;
    }
  };

  const getSessionColor = () => {
    switch (session.sessionType) {
      case SessionType.WORK:
        return 'text-blue-600 dark:text-blue-400';
      case SessionType.SHORT_BREAK:
        return 'text-green-600 dark:text-green-400';
      case SessionType.LONG_BREAK:
        return 'text-purple-600 dark:text-purple-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getSessionLabel = () => {
    switch (session.sessionType) {
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

  const progress = session.sessionType === SessionType.WORK
    ? ((session.workDuration * 60 - timeLeft) / (session.workDuration * 60)) * 100
    : ((session.breakDuration * 60 - timeLeft) / (session.breakDuration * 60)) * 100;

  return (
    <div className="text-center" data-testid="pomodoro-timer">
      <div className={cn("flex items-center justify-center gap-3 mb-6", getSessionColor())}>
        {getSessionIcon()}
        <h2 className="text-2xl font-semibold" data-testid="session-type">{getSessionLabel()}</h2>
      </div>
      
      <div className="relative w-64 h-64 mx-auto mb-8">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-200 dark:text-gray-700"
          />
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 120}`}
            strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
            className={cn("transition-all duration-1000", getSessionColor())}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl font-bold text-gray-900 dark:text-gray-100" data-testid="timer-display">
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>
      
      <div className="flex justify-center gap-4">
        {!isRunning && !session.startTime ? (
          <Button
            onClick={handleStart}
            size="lg"
            variant="primary"
            className="gap-2"
          >
            <Play className="w-5 h-5" />
            開始
          </Button>
        ) : (
          <>
            {isRunning ? (
              <Button
                onClick={handlePause}
                size="lg"
                variant="secondary"
                className="gap-2"
              >
                <Pause className="w-5 h-5" />
                一時停止
              </Button>
            ) : (
              <Button
                onClick={handleStart}
                size="lg"
                variant="primary"
                className="gap-2"
              >
                <Play className="w-5 h-5" />
                再開
              </Button>
            )}
            <Button
              onClick={handleReset}
              size="lg"
              variant="secondary"
              className="gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              停止
            </Button>
            <Button
              onClick={handleComplete}
              size="lg"
              variant="secondary"
              className="gap-2"
            >
              スキップ
            </Button>
          </>
        )}
      </div>
      
      <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
        サイクル {session.completedCycles + 1}
      </div>
    </div>
  );
}