import { useNavigationCommands } from './useNavigationCommands';
import { useActionCommands } from './useActionCommands';
import { useSettingsCommands } from './useSettingsCommands';
import { useGlobalKeyboardShortcuts } from './useGlobalKeyboardShortcuts';

export function useCommandRegistration() {
  // Split into smaller hooks to minimize re-renders
  useNavigationCommands();
  useActionCommands();
  useSettingsCommands();
  
  // Central keyboard shortcut handler to prevent memory leaks
  useGlobalKeyboardShortcuts();
}