import { AppLayout } from '@/components/layout';
import { useTheme } from '@/contexts/ThemeContext';
import { Switch } from '@radix-ui/react-switch';
import { Sun, Moon, Monitor, Bell, Globe, Clock, Palette, Save } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export function Settings() {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    reminders: true,
    updates: false,
  });
  const [display, setDisplay] = useState({
    compactMode: false,
    showSeconds: true,
    use24Hour: true,
  });

  const handleSaveSettings = () => {
    // In a real app, this would save to the backend
    toast.success('Settings saved successfully');
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your preferences and account settings</p>
        </div>

        {/* Theme Settings */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <Palette className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Appearance</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-foreground mb-3 block">Theme</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setTheme('light')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    theme === 'light'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-border/80'
                  }`}
                >
                  <Sun className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <span className="text-sm text-foreground">Light</span>
                </button>

                <button
                  onClick={() => setTheme('dark')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    theme === 'dark'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-border/80'
                  }`}
                >
                  <Moon className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <span className="text-sm text-foreground">Dark</span>
                </button>

                <button
                  disabled
                  className="p-4 rounded-lg border-2 border-border opacity-50 cursor-not-allowed"
                >
                  <Monitor className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">System</span>
                  <span className="text-xs text-muted-foreground block">(Coming soon)</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-foreground">Compact Mode</label>
                <p className="text-sm text-muted-foreground">Reduce spacing between elements</p>
              </div>
              <Switch
                checked={display.compactMode}
                onCheckedChange={(checked) => setDisplay({ ...display, compactMode: checked })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  display.compactMode ? 'bg-primary' : 'bg-input'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    display.compactMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </Switch>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Notifications</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-foreground">Email Notifications</label>
                <p className="text-sm text-muted-foreground">Receive updates via email</p>
              </div>
              <Switch
                checked={notifications.email}
                onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.email ? 'bg-primary' : 'bg-input'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.email ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </Switch>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-foreground">Push Notifications</label>
                <p className="text-sm text-muted-foreground">Receive browser notifications</p>
              </div>
              <Switch
                checked={notifications.push}
                onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.push ? 'bg-primary' : 'bg-input'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.push ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </Switch>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-foreground">Task Reminders</label>
                <p className="text-sm text-muted-foreground">Get reminded about upcoming tasks</p>
              </div>
              <Switch
                checked={notifications.reminders}
                onCheckedChange={(checked) => setNotifications({ ...notifications, reminders: checked })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.reminders ? 'bg-primary' : 'bg-input'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.reminders ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </Switch>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-foreground">Product Updates</label>
                <p className="text-sm text-muted-foreground">Learn about new features</p>
              </div>
              <Switch
                checked={notifications.updates}
                onCheckedChange={(checked) => setNotifications({ ...notifications, updates: checked })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.updates ? 'bg-primary' : 'bg-input'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.updates ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </Switch>
            </div>
          </div>
        </div>

        {/* Time & Language */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Time & Language</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-foreground">24-Hour Time</label>
                <p className="text-sm text-muted-foreground">Use 24-hour time format</p>
              </div>
              <Switch
                checked={display.use24Hour}
                onCheckedChange={(checked) => setDisplay({ ...display, use24Hour: checked })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  display.use24Hour ? 'bg-primary' : 'bg-input'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    display.use24Hour ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </Switch>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-foreground">Show Seconds</label>
                <p className="text-sm text-muted-foreground">Display seconds in time fields</p>
              </div>
              <Switch
                checked={display.showSeconds}
                onCheckedChange={(checked) => setDisplay({ ...display, showSeconds: checked })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  display.showSeconds ? 'bg-primary' : 'bg-input'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    display.showSeconds ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </Switch>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Language</label>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <select
                  className="flex-1 px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  defaultValue="en"
                >
                  <option value="en">English</option>
                  <option value="ja" disabled>日本語 (Coming soon)</option>
                  <option value="zh" disabled>中文 (Coming soon)</option>
                  <option value="es" disabled>Español (Coming soon)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveSettings}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Save className="h-4 w-4" />
            Save Settings
          </button>
        </div>
      </div>
    </AppLayout>
  );
}