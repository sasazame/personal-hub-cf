import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pomodoroApi } from '@/lib/pomodoro-api';
import { PomodoroConfig as PomodoroConfigType } from '@/types/pomodoro';
import { Settings, X, Save } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import { toast } from 'react-hot-toast';

export function PomodoroConfig() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  const queryClient = useQueryClient();
  
  const { data: config } = useQuery({
    queryKey: ['pomodoro-config'],
    queryFn: () => pomodoroApi.getConfig()
  });

  const [formData, setFormData] = useState<Partial<PomodoroConfigType>>({});

  const updateMutation = useMutation({
    mutationFn: (data: Partial<PomodoroConfigType>) => pomodoroApi.updateConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pomodoro-config'] });
      toast.success('設定が保存されました');
      setShowSavedMessage(true);
      setTimeout(() => {
        setIsOpen(false);
        setFormData({});
        setShowSavedMessage(false);
      }, 1500);
    },
    onError: () => {
      toast.error('設定の保存に失敗しました');
    }
  });

  const handleOpen = () => {
    if (config) {
      setFormData(config);
    }
    setIsOpen(true);
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className={cn(
          "absolute top-4 right-4",
          "p-2 rounded-lg",
          "text-muted-foreground",
          "hover:bg-accent",
          "transition-colors"
        )}
        aria-label="設定"
        data-testid="settings-button"
      >
        <Settings className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">ポモドーロ設定</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded hover:bg-accent"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              作業時間 (分)
            </label>
            <input
              type="number"
              name="workDuration"
              min="1"
              max="60"
              value={formData.workDuration || 25}
              onChange={(e) => setFormData({
                ...formData,
                workDuration: parseInt(e.target.value) || 25
              })}
              className={cn(
                "w-full px-3 py-2 rounded-lg",
                "bg-background",
                "border border-border",
                "focus:outline-none focus:ring-2 focus:ring-ring"
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              短い休憩時間 (分)
            </label>
            <input
              type="number"
              name="shortBreakDuration"
              min="1"
              max="30"
              value={formData.shortBreakDuration || 5}
              onChange={(e) => setFormData({
                ...formData,
                shortBreakDuration: parseInt(e.target.value) || 5
              })}
              className={cn(
                "w-full px-3 py-2 rounded-lg",
                "bg-background",
                "border border-border",
                "focus:outline-none focus:ring-2 focus:ring-ring"
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              長い休憩時間 (分)
            </label>
            <input
              type="number"
              name="longBreakDuration"
              min="1"
              max="60"
              value={formData.longBreakDuration || 15}
              onChange={(e) => setFormData({
                ...formData,
                longBreakDuration: parseInt(e.target.value) || 15
              })}
              className={cn(
                "w-full px-3 py-2 rounded-lg",
                "bg-background",
                "border border-border",
                "focus:outline-none focus:ring-2 focus:ring-ring"
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              長い休憩までのサイクル数
            </label>
            <input
              type="number"
              name="cyclesBeforeLongBreak"
              min="1"
              max="10"
              value={formData.cyclesBeforeLongBreak || 4}
              onChange={(e) => setFormData({
                ...formData,
                cyclesBeforeLongBreak: parseInt(e.target.value) || 4
              })}
              className={cn(
                "w-full px-3 py-2 rounded-lg",
                "bg-background",
                "border border-border",
                "focus:outline-none focus:ring-2 focus:ring-ring"
              )}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                id="autoStartBreaks"
                checked={formData.autoStartBreaks || false}
                onChange={(e) => setFormData({
                  ...formData,
                  autoStartBreaks: e.target.checked
                })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">休憩を自動開始</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.autoStartWork || false}
                onChange={(e) => setFormData({
                  ...formData,
                  autoStartWork: e.target.checked
                })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">作業セッションを自動開始</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.soundEnabled || false}
                onChange={(e) => setFormData({
                  ...formData,
                  soundEnabled: e.target.checked
                })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">サウンド通知を有効化</span>
            </label>
          </div>

          {formData.soundEnabled && (
            <div>
              <label className="block text-sm font-medium mb-1">
                音量
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round((formData.soundVolume ?? 0.5) * 100)}
                onChange={(e) => {
                  const raw = Number(e.target.value);
                  const clamped = Number.isFinite(raw) ? Math.min(100, Math.max(0, raw)) : 50;
                  setFormData({
                    ...formData,
                    soundVolume: clamped / 100,
                  });
                }}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground text-center">
                {Math.round((formData.soundVolume ?? 0.5) * 100)}%
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-border">
          <Button
            variant="secondary"
            onClick={() => setIsOpen(false)}
          >
            キャンセル
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {updateMutation.isPending ? '保存中...' : '保存'}
          </Button>
        </div>
        {showSavedMessage && (
          <div 
            className="absolute top-0 left-0 right-0 bg-green-500 text-white text-center py-2"
            data-testid="settings-saved-message"
          >
            設定が保存されました
          </div>
        )}
      </div>
    </div>
  );
}