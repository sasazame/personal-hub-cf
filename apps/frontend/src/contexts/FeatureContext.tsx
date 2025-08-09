import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { userApi, type FeaturePreferences } from '@/lib/user-api';

interface FeatureContextType {
  features: FeaturePreferences;
  loading: boolean;
  updateFeature: (feature: keyof FeaturePreferences, enabled: boolean) => Promise<void>;
  reloadFeatures: () => Promise<void>;
}

const defaultFeatures: FeaturePreferences = {
  todos: true,
  goals: true,
  pomodoro: true,
  calendar: true,
  notes: true,
  moments: true,
  analytics: true,
};

const FeatureContext = createContext<FeatureContextType | undefined>(undefined);

export function FeatureProvider({ children }: { children: ReactNode }) {
  const [features, setFeatures] = useState<FeaturePreferences>(defaultFeatures);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    try {
      const preferences = await userApi.getFeaturePreferences();
      setFeatures(preferences);
    } catch (error) {
      console.error('Failed to load feature preferences:', error);
      // Use defaults on error
      setFeatures(defaultFeatures);
    } finally {
      setLoading(false);
    }
  };

  const updateFeature = async (feature: keyof FeaturePreferences, enabled: boolean) => {
    const newFeatures = { ...features, [feature]: enabled };
    setFeatures(newFeatures);

    try {
      const updated = await userApi.updateFeaturePreferences({ [feature]: enabled });
      setFeatures(updated);
    } catch (error) {
      console.error('Failed to update feature:', error);
      // Revert on error
      setFeatures(features);
      throw error;
    }
  };

  const reloadFeatures = async () => {
    setLoading(true);
    await loadFeatures();
  };

  return (
    <FeatureContext.Provider value={{ features, loading, updateFeature, reloadFeatures }}>
      {children}
    </FeatureContext.Provider>
  );
}

export function useFeatures() {
  const context = useContext(FeatureContext);
  if (context === undefined) {
    throw new Error('useFeatures must be used within a FeatureProvider');
  }
  return context;
}