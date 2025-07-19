import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';
import { pomodoroApi } from '../lib/api/pomodoro';
import type { SessionType } from '@personal-hub/shared';
import { PomodoroSettings } from './PomodoroSettings';
import axios from 'axios';

export function PomodoroTimer() {
  const queryClient = useQueryClient();
  const [showSettings, setShowSettings] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionType, setSessionType] = useState<SessionType>('WORK');
  const [sessionCount, setSessionCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof window.setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Query for config
  const { data: config } = useQuery({
    queryKey: ['pomodoro-config'],
    queryFn: async () => {
      const response = await pomodoroApi.getConfig();
      return response.data;
    },
  });

  // Query for active session
  const { data: activeSession } = useQuery({
    queryKey: ['pomodoro-active-session'],
    queryFn: async () => {
      try {
        const response = await pomodoroApi.getActiveSession();
        return response.data;
      } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
  });

  // Create session mutation
  const createSession = useMutation({
    mutationFn: pomodoroApi.createSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pomodoro-active-session'] });
      queryClient.invalidateQueries({ queryKey: ['pomodoro-sessions'] });
    },
  });

  // Update session mutation
  const updateSession = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof pomodoroApi.updateSession>[1] }) =>
      pomodoroApi.updateSession(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pomodoro-active-session'] });
      queryClient.invalidateQueries({ queryKey: ['pomodoro-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['pomodoro-stats'] });
    },
  });

  // Get duration for current session type
  const getDuration = useCallback((type: SessionType): number => {
    if (!config) return 25 * 60;
    
    switch (type) {
      case 'WORK':
        return config.workDuration * 60;
      case 'SHORT_BREAK':
        return config.shortBreakDuration * 60;
      case 'LONG_BREAK':
        return config.longBreakDuration * 60;
    }
  }, [config]);

  // Initialize timer when config loads or session type changes
  useEffect(() => {
    if (!activeSession && config) {
      setTimeLeft(getDuration(sessionType));
    }
  }, [config, sessionType, activeSession, getDuration]);

  // Helper function to start a new session
  const startNewSession = useCallback(async (type: SessionType) => {
    const duration = getDuration(type);
    await createSession.mutate({
      sessionType: type,
      duration,
    });
    setIsRunning(true);
  }, [getDuration, createSession]);

  // Handle active session
  useEffect(() => {
    if (activeSession) {
      const elapsed = Math.floor((Date.now() - new Date(activeSession.startTime).getTime()) / 1000);
      const remaining = activeSession.duration - elapsed;
      
      if (remaining > 0) {
        setTimeLeft(remaining);
        setSessionType(activeSession.sessionType);
        setIsRunning(true);
      } else {
        // Session time expired
        setTimeLeft(0);
        setIsRunning(false);
      }
    }
  }, [activeSession]);

  const handleTimerComplete = useCallback(async () => {
    setIsRunning(false);
    
    // Play sound if enabled
    if (config?.soundEnabled && audioRef.current) {
      audioRef.current.play().catch(console.error);
    }

    // Update active session as completed
    if (activeSession) {
      await updateSession.mutate({
        id: activeSession.id,
        data: {
          endTime: new Date().toISOString(),
          completed: true,
        },
      });
    }

    // Update session count and determine next session type
    const newCount = sessionType === 'WORK' ? sessionCount + 1 : sessionCount;
    setSessionCount(newCount);

    // Auto-start next session if configured
    if (config) {
      let nextType: SessionType;
      
      if (sessionType === 'WORK') {
        if (newCount % config.longBreakInterval === 0) {
          nextType = 'LONG_BREAK';
        } else {
          nextType = 'SHORT_BREAK';
        }
        
        // Create new session automatically if autoStartBreaks is enabled
        if (config.autoStartBreaks) {
          setSessionType(nextType);
          setTimeLeft(getDuration(nextType));
          await startNewSession(nextType);
        }
      } else {
        // After break, go back to work
        nextType = 'WORK';
        setSessionType(nextType);
        setTimeLeft(getDuration(nextType));
        
        if (config.autoStartPomodoros) {
          await startNewSession(nextType);
        }
      }
    }

    queryClient.invalidateQueries({ queryKey: ['pomodoro-stats'] });
  }, [activeSession, config, updateSession, queryClient, sessionType, sessionCount, getDuration, startNewSession]);

  // Timer countdown
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, handleTimerComplete]);

  const handleStart = useCallback(async (type?: SessionType) => {
    const currentType = type || sessionType;
    await startNewSession(currentType);
  }, [sessionType, startNewSession]);

  const handlePause = useCallback(async () => {
    setIsRunning(false);
    
    // Mark session as incomplete
    if (activeSession) {
      await updateSession.mutate({
        id: activeSession.id,
        data: {
          endTime: new Date().toISOString(),
          completed: false,
        },
      });
    }
  }, [activeSession, updateSession]);

  const handleReset = useCallback(async () => {
    setIsRunning(false);
    setTimeLeft(getDuration(sessionType));
    
    // Cancel active session
    if (activeSession) {
      await updateSession.mutate({
        id: activeSession.id,
        data: {
          endTime: new Date().toISOString(),
          completed: false,
        },
      });
    }
  }, [sessionType, activeSession, getDuration, updateSession]);

  const handleSessionTypeChange = (type: SessionType) => {
    if (!isRunning) {
      setSessionType(type);
      setTimeLeft(getDuration(type));
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

  return (
    <>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Pomodoro Timer</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Session Type Selector */}
          <div className="flex justify-center gap-2">
            {(['WORK', 'SHORT_BREAK', 'LONG_BREAK'] as const).map((type) => (
              <Button
                key={type}
                variant={sessionType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSessionTypeChange(type)}
                disabled={isRunning}
              >
                {getSessionTypeLabel(type)}
              </Button>
            ))}
          </div>

          {/* Timer Display */}
          <div className="text-center">
            <div className="text-6xl font-mono font-bold">
              {formatTime(timeLeft)}
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              Session {sessionCount + 1}
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4">
            {!isRunning ? (
              <Button
                size="lg"
                onClick={() => handleStart()}
                disabled={createSession.isPending}
              >
                <Play className="h-5 w-5 mr-2" />
                Start
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={handlePause}
                disabled={updateSession.isPending}
              >
                <Pause className="h-5 w-5 mr-2" />
                Pause
              </Button>
            )}
            
            <Button
              size="lg"
              variant="outline"
              onClick={handleReset}
              disabled={updateSession.isPending}
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audio element for notification sound */}
      <audio
        ref={audioRef}
        src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGJzvLTgjMGHGS+7+OZURE"
        preload="auto"
      />

      {/* Settings Dialog */}
      {showSettings && (
        <PomodoroSettings
          open={showSettings}
          onOpenChange={setShowSettings}
        />
      )}
    </>
  );
}