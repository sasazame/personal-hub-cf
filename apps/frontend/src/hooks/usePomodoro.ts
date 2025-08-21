import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pomodoroApi } from '@/lib/pomodoro-api';
import { 
  CreatePomodoroSessionRequest, 
  UpdatePomodoroSessionRequest,
  UpdatePomodoroConfigRequest
} from '@/types/pomodoro';

export function useActiveSession() {
  return useQuery({
    queryKey: ['pomodoro-session-active'],
    queryFn: () => pomodoroApi.getActiveSession(),
    refetchInterval: (query) => {
      // Only poll if there's an active session that's running
      const session = query.state.data;
      if (session && session.status === 'ACTIVE' && session.startTime) {
        return 1000; // Poll every second for active sessions
      }
      return false; // Don't poll for paused, completed, or no session
    },
    retry: false, // Don't retry 404 errors
    gcTime: 0 // Don't cache null results
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreatePomodoroSessionRequest) => pomodoroApi.createSession(data),
    onSuccess: (newSession) => {
      queryClient.setQueryData(['pomodoro-session-active'], newSession);
      queryClient.invalidateQueries({ queryKey: ['pomodoro-sessions'] });
    }
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & UpdatePomodoroSessionRequest) => 
      pomodoroApi.updateSession(id, data),
    onSuccess: (updatedSession) => {
      // Only set as active session if it's still active
      if (updatedSession.status === 'ACTIVE' || updatedSession.status === 'PAUSED') {
        queryClient.setQueryData(['pomodoro-session-active'], updatedSession);
      } else {
        // Clear active session if it's completed or cancelled
        queryClient.setQueryData(['pomodoro-session-active'], null);
      }
      queryClient.invalidateQueries({ queryKey: ['pomodoro-sessions'] });
    }
  });
}

export function usePomodoroConfig() {
  return useQuery({
    queryKey: ['pomodoro-config'],
    queryFn: () => pomodoroApi.getConfig()
  });
}

export function useUpdatePomodoroConfig() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: UpdatePomodoroConfigRequest) => pomodoroApi.updateConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pomodoro-config'] });
    }
  });
}