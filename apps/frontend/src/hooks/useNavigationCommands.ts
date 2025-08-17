import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Home, 
  CheckSquare, 
  Calendar, 
  StickyNote, 
  Target, 
  Heart, 
  Timer, 
  BarChart3, 
  Settings, 
  User
} from 'lucide-react';
import { commandRegistry } from '../lib/command-registry';
import { useFeatures } from '../contexts/FeatureContext';
import { Command } from '../types/command-palette';

export function useNavigationCommands() {
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const { features } = useFeatures();

  useEffect(() => {
    const navigationCommands: Command[] = [
      {
        id: 'nav-dashboard',
        title: t('sidebar.dashboard', 'Dashboard'),
        description: t('commandPalette.goToDashboard', 'Go to dashboard'),
        category: 'navigation',
        icon: Home,
        shortcut: 'Alt+D',
        action: () => navigate('/dashboard'),
      },
      {
        id: 'nav-todos',
        title: t('sidebar.todos', 'TODOs'),
        description: t('commandPalette.goToTodos', 'Go to todo list'),
        category: 'navigation',
        icon: CheckSquare,
        shortcut: 'Alt+T',
        action: () => navigate('/todos'),
        isAvailable: () => features.todos,
      },
      {
        id: 'nav-calendar',
        title: t('sidebar.calendar', 'Calendar'),
        description: t('commandPalette.goToCalendar', 'Go to calendar'),
        category: 'navigation',
        icon: Calendar,
        shortcut: 'Alt+C',
        action: () => navigate('/calendar'),
        isAvailable: () => features.calendar,
      },
      {
        id: 'nav-notes',
        title: t('sidebar.notes', 'Notes'),
        description: t('commandPalette.goToNotes', 'Go to notes'),
        category: 'navigation',
        icon: StickyNote,
        shortcut: 'Alt+N',
        action: () => navigate('/notes'),
        isAvailable: () => features.notes,
      },
      {
        id: 'nav-goals',
        title: t('sidebar.goals', 'Goals'),
        description: t('commandPalette.goToGoals', 'Go to goals'),
        category: 'navigation',
        icon: Target,
        shortcut: 'Alt+G',
        action: () => navigate('/goals'),
        isAvailable: () => features.goals,
      },
      {
        id: 'nav-moments',
        title: t('sidebar.moments', 'Moments'),
        description: t('commandPalette.goToMoments', 'Go to moments'),
        category: 'navigation',
        icon: Heart,
        shortcut: 'Alt+M',
        action: () => navigate('/moments'),
        isAvailable: () => features.moments,
      },
      {
        id: 'nav-pomodoro',
        title: t('sidebar.pomodoro', 'Pomodoro'),
        description: t('commandPalette.goToPomodoro', 'Go to pomodoro timer'),
        category: 'navigation',
        icon: Timer,
        shortcut: 'Alt+P',
        action: () => navigate('/pomodoro'),
        isAvailable: () => features.pomodoro,
      },
      {
        id: 'nav-analytics',
        title: t('sidebar.analytics', 'Analytics'),
        description: t('commandPalette.goToAnalytics', 'Go to analytics'),
        category: 'navigation',
        icon: BarChart3,
        shortcut: 'Alt+A',
        action: () => navigate('/analytics'),
        isAvailable: () => features.analytics,
      },
      {
        id: 'nav-settings',
        title: t('sidebar.settings', 'Settings'),
        description: t('commandPalette.goToSettings', 'Go to settings'),
        category: 'navigation',
        icon: Settings,
        shortcut: 'Alt+S',
        action: () => navigate('/settings'),
      },
      {
        id: 'nav-profile',
        title: t('sidebar.profile', 'Profile'),
        description: t('commandPalette.goToProfile', 'Go to profile'),
        category: 'navigation',
        icon: User,
        shortcut: 'Alt+U',
        action: () => navigate('/profile'),
      },
    ];

    navigationCommands.forEach(command => commandRegistry.register(command));

    // Keyboard shortcuts are now handled by useGlobalKeyboardShortcuts hook
    // This prevents memory leaks from multiple event listeners

    return () => {
      navigationCommands.forEach(cmd => commandRegistry.unregister(cmd.id));
    };
  }, [navigate, t, features]);
}