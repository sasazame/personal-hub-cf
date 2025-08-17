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
        const code = e.code; // layout-stable (KeyD, KeyT, ...)
        let commandId: string | null = null;

        switch (code) {
          case 'KeyD': commandId = 'nav-dashboard'; break;
          case 'KeyT': commandId = 'nav-todos'; break;
          case 'KeyN': commandId = 'nav-notes'; break;
          case 'KeyG': commandId = 'nav-goals'; break;
          case 'KeyP': commandId = 'nav-pomodoro'; break;
          case 'KeyC': commandId = 'nav-calendar'; break;
          case 'KeyM': commandId = 'nav-moments'; break;
          case 'KeyA': commandId = 'nav-analytics'; break;
          case 'KeyU': commandId = 'nav-profile'; break;  // Added missing profile shortcut
          case 'KeyS': commandId = 'nav-settings'; break; // Added missing settings shortcut
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
        const code = e.code; // layout-stable (KeyT, KeyL, ...)
        let commandId: string | null = null;

        switch (code) {
          case 'KeyT': commandId = 'settings-toggle-theme'; break;
          case 'KeyL': commandId = 'settings-logout'; break;
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