import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Moon, Sun, Globe, LogOut } from 'lucide-react';
import { commandRegistry } from '../lib/command-registry';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Command } from '../types/command-palette';

export function useSettingsCommands() {
  const { t, i18n } = useTranslation('common');
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const settingsCommands: Command[] = [
      {
        id: 'settings-toggle-theme',
        title: theme === 'dark' 
          ? t('commandPalette.lightMode', 'Switch to Light Mode')
          : t('commandPalette.darkMode', 'Switch to Dark Mode'),
        description: t('commandPalette.toggleTheme', 'Toggle between light and dark theme'),
        category: 'settings',
        icon: theme === 'dark' ? Sun : Moon,
        shortcut: 'Alt+Shift+T',
        keywords: ['theme', 'dark', 'light', 'mode'],
        action: () => {
          // For command palette, do a simple toggle between light and dark
          // Skip system mode for predictability
          const root = document.documentElement;
          const currentIsDark = root.classList.contains('dark');
          if (currentIsDark) {
            root.classList.remove('dark');
            root.classList.add('light');
            localStorage.setItem('theme', 'light');
            // Dispatch storage event to sync with theme context
            window.dispatchEvent(new StorageEvent('storage', {
              key: 'theme',
              newValue: 'light',
              oldValue: 'dark',
              storageArea: localStorage
            }));
          } else {
            root.classList.remove('light');
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            // Dispatch storage event to sync with theme context
            window.dispatchEvent(new StorageEvent('storage', {
              key: 'theme',
              newValue: 'dark',
              oldValue: 'light',
              storageArea: localStorage
            }));
          }
        },
      },
      {
        id: 'settings-change-language',
        title: t('commandPalette.changeLanguage', 'Change Language'),
        description: i18n.language === 'en' 
          ? t('commandPalette.switchToJapanese', 'Switch to Japanese')
          : t('commandPalette.switchToEnglish', 'Switch to English'),
        category: 'settings',
        icon: Globe,
        keywords: ['language', 'locale', 'translation', 'i18n'],
        action: () => {
          const newLang = i18n.language === 'en' ? 'ja' : 'en';
          i18n.changeLanguage(newLang);
        },
      },
      {
        id: 'settings-logout',
        title: t('commandPalette.logout', 'Logout'),
        description: t('commandPalette.signOut', 'Sign out of your account'),
        category: 'settings',
        icon: LogOut,
        shortcut: 'Alt+Shift+L',
        keywords: ['signout', 'exit', 'leave'],
        action: () => {
          if (window.confirm(t('messages.confirmLogout', 'Are you sure you want to logout?'))) {
            logout();
          }
        },
      },
    ];

    settingsCommands.forEach(command => commandRegistry.register(command));

    // Keyboard shortcuts are now handled by useGlobalKeyboardShortcuts hook
    // This prevents memory leaks from multiple event listeners

    return () => {
      settingsCommands.forEach(cmd => commandRegistry.unregister(cmd.id));
    };
  }, [t, i18n, theme, toggleTheme, logout]);
}