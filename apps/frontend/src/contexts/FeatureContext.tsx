import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { userApi, type FeaturePreferences } from '@/lib/user-api';
import { useAuth } from './AuthContext';

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
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    // When not authenticated, reset to defaults and skip API call
    if (!isAuthenticated) {
      setFeatures(defaultFeatures);
      setLoading(false);
      return;
    }
    // Authenticated: fetch preferences for the current user
    loadFeatures();
  }, [isAuthenticated, user?.id]); // Re-run when user identity changes

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
    // Functional update to avoid stale state if multiple rapid toggles occur
    setFeatures(prev => ({ ...prev, [feature]: enabled }));

    try {
      const updated = await userApi.updateFeaturePreferences({ [feature]: enabled });
      setFeatures(updated);
    } catch (error) {
      console.error('Failed to update feature:', error);
      // Revert by reloading from server to avoid stale local snapshots
      await loadFeatures();
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