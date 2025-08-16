import { useState } from 'react';
import { PomodoroTask } from '@/types/pomodoro';
import { pomodoroApi } from '@/lib/pomodoro-api';
import { Button } from '@/components/ui';
import { Plus, CheckCircle, Circle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

interface PomodoroTasksProps {
  sessionId?: string;
  tasks: PomodoroTask[];
  isActiveSession: boolean;
  onCreateSession?: (initialTask?: string) => void;
}

export function PomodoroTasks({ 
  sessionId, 
  tasks = [], 
  isActiveSession,
  onCreateSession 
}: PomodoroTasksProps) {
  const queryClient = useQueryClient();
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddTask = async () => {
    if (!newTaskDescription.trim()) {
      setError('タスクの説明を入力してください');
      return;
    }
    setError(null);

    if (!sessionId) {
      // Start a new session with this task
      onCreateSession?.(newTaskDescription);
      setNewTaskDescription('');
      return;
    }

    setIsAdding(true);
    try {
      await pomodoroApi.createTask(sessionId, {
        description: newTaskDescription
      });
      setNewTaskDescription('');
      // Invalidate active session to refetch with new tasks
      queryClient.invalidateQueries({ queryKey: ['pomodoro-session-active'] });
      toast.success('タスクが追加されました');
    } catch (error) {
      console.error('Failed to add task:', error);
      toast.error('タスクの追加に失敗しました');
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleTask = async (task: PomodoroTask) => {
    if (!sessionId) return;

    try {
      await pomodoroApi.updateTask(sessionId, task.id, {
        completed: !task.completed
      });
      queryClient.invalidateQueries({ queryKey: ['pomodoro-session-active'] });
      toast.success(task.completed ? 'タスクを未完了にしました' : 'タスクを完了しました');
    } catch (error) {
      console.error('Failed to update task:', error);
      toast.error('タスクの更新に失敗しました');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!sessionId) return;

    try {
      await pomodoroApi.deleteTask(sessionId, taskId);
      queryClient.invalidateQueries({ queryKey: ['pomodoro-session-active'] });
      toast.success('タスクを削除しました');
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('タスクの削除に失敗しました');
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <div className="space-y-4">
      {error && (
        <div 
          className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded"
          data-testid="error-message"
        >
          {error}
        </div>
      )}
      <h3 className="text-lg font-semibold">タスク</h3>

      <div className="space-y-2" data-testid="linked-todos">
        {sortedTasks.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            {sessionId ? 'タスクがまだ追加されていません' : 'セッションを開始してタスクを追加'}
          </p>
        )}

        {sortedTasks.map((task) => (
          <div
            key={task.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg",
              "bg-muted/50",
              "group hover:bg-muted",
              "transition-colors"
            )}
          >
            <button
              onClick={() => handleToggleTask(task)}
              className={cn(
                "shrink-0 transition-colors",
                task.completed 
                  ? "text-green-600" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              disabled={!isActiveSession}
            >
              {task.completed ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <Circle className="w-5 h-5" />
              )}
            </button>

            <span
              className={cn(
                "flex-1 text-sm",
                task.completed && "line-through text-muted-foreground"
              )}
            >
              {task.description}
            </span>

            <button
              onClick={() => handleDeleteTask(task.id)}
              className={cn(
                "shrink-0 opacity-0 group-hover:opacity-100",
                "text-muted-foreground hover:text-destructive",
                "transition-all"
              )}
              disabled={!isActiveSession}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newTaskDescription}
          onChange={(e) => setNewTaskDescription(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddTask();
            }
          }}
          placeholder="タスクを追加..."
          className={cn(
            "flex-1 px-3 py-2 text-sm rounded-lg",
            "bg-background",
            "border border-border",
            "focus:outline-none focus:ring-2 focus:ring-blue-500",
            "placeholder:text-muted-foreground"
          )}
        />
        <Button
          onClick={handleAddTask}
          size="sm"
          variant="primary"
          disabled={!newTaskDescription.trim() || isAdding}
          className="gap-1"
        >
          <Plus className="w-4 h-4" />
          {!sessionId ? '開始' : '追加'}
        </Button>
      </div>
      
      {/* TODO: Implement todo linking functionality
      {sessionId && (
        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          data-testid="link-todo-button"
        >
          TODOをリンク
        </Button>
      )} */}
    </div>
  );
}