import { AppLayout } from '@/components/layout';
import { useTheme } from '@/contexts/ThemeContext';
import { Switch } from '@radix-ui/react-switch';
import { Sun, Moon, Monitor, Bell, Globe, Clock, Palette, Save, Grid } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { FeatureToggles } from '@/components/profile';

interface SettingsSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  description: string;
}

function SettingsSwitch({ checked, onCheckedChange, label, description }: SettingsSwitchProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <label className="text-sm font-medium text-foreground">{label}</label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-primary' : 'bg-input'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </Switch>
    </div>
  );
}

export function Settings() {
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation(['settings', 'common']);
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
  const [language, setLanguage] = useState(i18n.language);

  useEffect(() => {
    setLanguage(i18n.language);
  }, [i18n.language]);

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
    localStorage.setItem('i18nextLng', newLanguage);
    toast.success(t('messages.settingsSaved'));
  };

  const handleSaveSettings = () => {
    // In a real app, this would save to the backend
    toast.success(t('messages.settingsSaved'));
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>

        {/* Theme Settings */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <Palette className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">{t('appearance.title')}</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-foreground mb-3 block">{t('appearance.theme')}</label>
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
                  <span className="text-sm text-foreground">{t('appearance.light')}</span>
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
                  <span className="text-sm text-foreground">{t('appearance.dark')}</span>
                </button>

                <button
                  disabled
                  className="p-4 rounded-lg border-2 border-border opacity-50 cursor-not-allowed"
                >
                  <Monitor className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{t('appearance.system')}</span>
                  <span className="text-xs text-muted-foreground block">{t('appearance.systemComingSoon')}</span>
                </button>
              </div>
            </div>

            <SettingsSwitch
              checked={display.compactMode}
              onCheckedChange={(checked) => setDisplay({ ...display, compactMode: checked })}
              label={t('appearance.compactMode')}
              description={t('appearance.compactModeDesc')}
            />
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">{t('notifications.title')}</h2>
          </div>

          <div className="space-y-4">
            <SettingsSwitch
              checked={notifications.email}
              onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
              label={t('notifications.emailNotifications')}
              description={t('notifications.emailDesc')}
            />

            <SettingsSwitch
              checked={notifications.push}
              onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
              label={t('notifications.pushNotifications')}
              description={t('notifications.pushDesc')}
            />

            <SettingsSwitch
              checked={notifications.reminders}
              onCheckedChange={(checked) => setNotifications({ ...notifications, reminders: checked })}
              label={t('notifications.notificationTypes.todos')}
              description={t('notifications.remindersDesc')}
            />

            <SettingsSwitch
              checked={notifications.updates}
              onCheckedChange={(checked) => setNotifications({ ...notifications, updates: checked })}
              label={t('notifications.notificationTypes.systemUpdates')}
              description={t('notifications.updatesDesc')}
            />
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <Grid className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">{t('general.features')}</h2>
          </div>
          <FeatureToggles />
        </div>

        {/* Time & Language */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">{t('general.timeLanguage')}</h2>
          </div>

          <div className="space-y-4">
            <SettingsSwitch
              checked={display.use24Hour}
              onCheckedChange={(checked) => setDisplay({ ...display, use24Hour: checked })}
              label={t('general.use24Hour')}
              description={t('general.use24HourDesc')}
            />

            <SettingsSwitch
              checked={display.showSeconds}
              onCheckedChange={(checked) => setDisplay({ ...display, showSeconds: checked })}
              label={t('general.showSeconds')}
              description={t('general.showSecondsDesc')}
            />

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">{t('general.language')}</label>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="flex-1 px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label={t('general.language')}
                >
                  <option value="en">{t('general.languages.en')}</option>
                  <option value="ja">{t('general.languages.ja')}</option>
                  <option value="zh" disabled>{t('general.languages.zh')} {t('appearance.systemComingSoon')}</option>
                  <option value="es" disabled>{t('general.languages.es')} {t('appearance.systemComingSoon')}</option>
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
            {t('labels.saveSettings')}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}