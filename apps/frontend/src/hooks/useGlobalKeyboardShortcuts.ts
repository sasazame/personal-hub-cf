import { useEffect } from 'react';
import { commandRegistry } from '../lib/command-registry';

/**
 * Central hook for managing all keyboard shortcuts
 * This prevents memory leaks from multiple event listeners
 */
export function useGlobalKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyboardShortcuts = (e: KeyboardEvent) => {
      // Alt shortcuts for navigation (Alt+D, Alt+T, Alt+N, etc.)
      if (e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        const key = e.key.toLowerCase();
        let commandId: string | null = null;

        switch (key) {
          case 'd': commandId = 'nav-dashboard'; break;
          case 't': commandId = 'nav-todos'; break;
          case 'n': commandId = 'nav-notes'; break;
          case 'g': commandId = 'nav-goals'; break;
          case 'p': commandId = 'nav-pomodoro'; break;
          case 'c': commandId = 'nav-calendar'; break;
          case 'm': commandId = 'nav-moments'; break;
          case 'a': commandId = 'nav-analytics'; break;
        }

        if (commandId) {
          e.preventDefault();
          const command = commandRegistry.getCommand(commandId);
          if (command && (!command.isAvailable || command.isAvailable())) {
            command.action();
          }
        }
      }

      // Alt+Shift shortcuts for settings (Alt+Shift+T for theme, Alt+Shift+L for logout)
      if (e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey) {
        const key = e.key.toLowerCase();
        let commandId: string | null = null;

        switch (key) {
          case 't': commandId = 'settings-toggle-theme'; break;
          case 'l': commandId = 'settings-logout'; break;
        }

        if (commandId) {
          e.preventDefault();
          const command = commandRegistry.getCommand(commandId);
          if (command && (!command.isAvailable || command.isAvailable())) {
            command.action();
          }
        }
      }
    };

    // Use a single event listener for all shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);

    return () => {
      document.removeEventListener('keydown', handleKeyboardShortcuts);
    };
  }, []); // Empty deps since we're accessing commandRegistry directly
}