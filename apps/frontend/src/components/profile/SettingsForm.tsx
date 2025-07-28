import { useState, useEffect } from 'react';
import { useUserSettings, useUpdateSettings } from '@/hooks/useUser';
import { Button } from '@/components/ui';
import { 
  Sun, 
  Moon, 
  Monitor, 
  Globe, 
  Bell, 
  Volume2, 
  Clock,
  Save
} from 'lucide-react';
import { cn } from '@/lib/cn';

const timezones = [
  { value: 'Asia/Tokyo', label: '東京 (GMT+9)' },
  { value: 'America/New_York', label: 'ニューヨーク (GMT-5)' },
  { value: 'America/Los_Angeles', label: 'ロサンゼルス (GMT-8)' },
  { value: 'Europe/London', label: 'ロンドン (GMT+0)' },
  { value: 'Europe/Paris', label: 'パリ (GMT+1)' },
  { value: 'Australia/Sydney', label: 'シドニー (GMT+10)' },
];

export function SettingsForm() {
  const { data: settings, isLoading } = useUserSettings();
  const updateSettings = useUpdateSettings();
  
  const [formData, setFormData] = useState({
    theme: 'system' as 'light' | 'dark' | 'system',
    language: 'ja' as 'ja' | 'en',
    timezone: 'Asia/Tokyo',
    emailNotifications: true,
    pushNotifications: true,
    pomodoroSound: true,
    pomodoroVolume: 50,
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h' as '12h' | '24h',
    weekStartsOn: 1 as 0 | 1 | 6,
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock className="h-12 w-12 mx-auto mb-4 animate-pulse" />
          <p>設定を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Appearance */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Sun className="w-5 h-5" />
          外観
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              テーマ
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, theme: 'light' })}
                className={cn(
                  "p-3 rounded-lg border-2 transition-colors",
                  formData.theme === 'light'
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-300 dark:border-gray-600"
                )}
              >
                <Sun className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm">ライト</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, theme: 'dark' })}
                className={cn(
                  "p-3 rounded-lg border-2 transition-colors",
                  formData.theme === 'dark'
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-300 dark:border-gray-600"
                )}
              >
                <Moon className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm">ダーク</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, theme: 'system' })}
                className={cn(
                  "p-3 rounded-lg border-2 transition-colors",
                  formData.theme === 'system'
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-300 dark:border-gray-600"
                )}
              >
                <Monitor className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm">システム</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Localization */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5" />
          言語と地域
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              言語
            </label>
            <select
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value as 'ja' | 'en' })}
              className={cn(
                "w-full px-3 py-2 rounded-lg",
                "bg-white dark:bg-gray-900",
                "border border-gray-300 dark:border-gray-600",
                "focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
            >
              <option value="ja">日本語</option>
              <option value="en">English</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              タイムゾーン
            </label>
            <select
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              className={cn(
                "w-full px-3 py-2 rounded-lg",
                "bg-white dark:bg-gray-900",
                "border border-gray-300 dark:border-gray-600",
                "focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
            >
              {timezones.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              時刻形式
            </label>
            <select
              value={formData.timeFormat}
              onChange={(e) => setFormData({ ...formData, timeFormat: e.target.value as '12h' | '24h' })}
              className={cn(
                "w-full px-3 py-2 rounded-lg",
                "bg-white dark:bg-gray-900",
                "border border-gray-300 dark:border-gray-600",
                "focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
            >
              <option value="24h">24時間表記</option>
              <option value="12h">12時間表記 (AM/PM)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              週の開始日
            </label>
            <select
              value={formData.weekStartsOn}
              onChange={(e) => setFormData({ ...formData, weekStartsOn: parseInt(e.target.value) as 0 | 1 | 6 })}
              className={cn(
                "w-full px-3 py-2 rounded-lg",
                "bg-white dark:bg-gray-900",
                "border border-gray-300 dark:border-gray-600",
                "focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
            >
              <option value="0">日曜日</option>
              <option value="1">月曜日</option>
              <option value="6">土曜日</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          通知
        </h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
            <span className="text-sm font-medium">メール通知</span>
            <input
              type="checkbox"
              checked={formData.emailNotifications}
              onChange={(e) => setFormData({ ...formData, emailNotifications: e.target.checked })}
              className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
            <span className="text-sm font-medium">プッシュ通知</span>
            <input
              type="checkbox"
              checked={formData.pushNotifications}
              onChange={(e) => setFormData({ ...formData, pushNotifications: e.target.checked })}
              className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
            />
          </label>
        </div>
      </div>

      {/* Pomodoro */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Volume2 className="w-5 h-5" />
          ポモドーロ
        </h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
            <span className="text-sm font-medium">サウンド通知</span>
            <input
              type="checkbox"
              checked={formData.pomodoroSound}
              onChange={(e) => setFormData({ ...formData, pomodoroSound: e.target.checked })}
              className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
            />
          </label>

          {formData.pomodoroSound && (
            <div>
              <label className="block text-sm font-medium mb-2">
                音量
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.pomodoroVolume}
                  onChange={(e) => setFormData({ ...formData, pomodoroVolume: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-12 text-right">
                  {formData.pomodoroVolume}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="submit"
          variant="primary"
          disabled={updateSettings.isPending}
          className="gap-2"
        >
          <Save className="w-4 h-4" />
          {updateSettings.isPending ? '保存中...' : '設定を保存'}
        </Button>
      </div>
    </form>
  );
}