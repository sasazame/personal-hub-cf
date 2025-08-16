import { useState } from 'react';
import { Switch } from '@headlessui/react';
import { type FeaturePreferences } from '@/lib/user-api';
import { CheckSquare, Calendar, FileText, BarChart3, Target, Clock, Timer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/ui/toast';
import { useFeatures } from '@/contexts/FeatureContext';

const featureConfig = [
  { key: 'todos' as const, label: 'TODOs', icon: CheckSquare, description: 'Manage your tasks and stay organized' },
  { key: 'goals' as const, label: 'Goals', icon: Target, description: 'Track your goals and achievements' },
  { key: 'pomodoro' as const, label: 'Pomodoro', icon: Timer, description: 'Boost productivity with time management' },
  { key: 'calendar' as const, label: 'Calendar', icon: Calendar, description: 'Schedule and manage your events' },
  { key: 'notes' as const, label: 'Notes', icon: FileText, description: 'Create and organize your thoughts' },
  { key: 'moments' as const, label: 'Moments', icon: Clock, description: 'Capture and reflect on life moments' },
  { key: 'analytics' as const, label: 'Analytics', icon: BarChart3, description: 'Visualize your productivity' },
];

export function FeatureToggles() {
  const { t } = useTranslation();
  const { features: preferences, loading, updateFeature } = useFeatures();
  const [saving, setSaving] = useState(false);

  const handleToggle = async (feature: keyof FeaturePreferences) => {
    const newValue = !preferences[feature];
    setSaving(true);

    try {
      await updateFeature(feature, newValue);
      toast.success(t('settings.featureUpdated', 'Feature preferences updated'));
    } catch (error) {
      console.error('Failed to update feature preferences:', error);
      toast.error(t('errors.updatePreferencesFailed', 'Failed to update feature preferences'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">{t('settings.featureToggles', 'Feature Toggles')}</h3>
        <p className="text-sm text-muted-foreground mb-6">
          {t('settings.featureTogglesDescription', 'Enable or disable features to customize your dashboard experience')}
        </p>
      </div>

      <div className="space-y-4">
        {featureConfig.map((feature) => {
          const Icon = feature.icon;
          return (
            <div key={feature.key} className="flex items-center justify-between p-4 bg-card rounded-lg border border-border">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">{feature.label}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
              <Switch
                checked={preferences[feature.key]}
                onChange={() => handleToggle(feature.key)}
                disabled={saving}
                className={`${
                  preferences[feature.key] ? 'bg-primary' : 'bg-muted'
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  saving ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <span className="sr-only">Enable {feature.label}</span>
                <span
                  className={`${
                    preferences[feature.key] ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </Switch>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-warning/10 rounded-lg border border-warning/20">
        <p className="text-sm text-warning">
          <strong>{t('settings.note', 'Note')}:</strong>{' '}
          {t('settings.featureToggleNote', 'Disabled features will be hidden from your dashboard and sidebar navigation.')}
        </p>
      </div>
    </div>
  );
}