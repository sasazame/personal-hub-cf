import { useEffect } from 'react';
import { DEFAULT_MOMENT_TAGS } from '@/types/moment';

interface UseMomentTagKeyboardShortcutsProps {
  onToggleTag: (tag: string) => void;
  isEnabled?: boolean;
}

const TAG_SHORTCUTS: Record<string, string> = {
  F1: DEFAULT_MOMENT_TAGS[0], // Ideas
  F2: DEFAULT_MOMENT_TAGS[1], // Discoveries
  F3: DEFAULT_MOMENT_TAGS[2], // Emotions
  F4: DEFAULT_MOMENT_TAGS[3], // Log
  F5: DEFAULT_MOMENT_TAGS[4], // Other
};

export function useMomentTagKeyboardShortcuts({
  onToggleTag,
  isEnabled = true,
}: UseMomentTagKeyboardShortcutsProps) {
  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if Shift key is pressed and the key is a function key
      if (event.shiftKey && TAG_SHORTCUTS[event.key]) {
        event.preventDefault();
        onToggleTag(TAG_SHORTCUTS[event.key]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onToggleTag, isEnabled]);

  return TAG_SHORTCUTS;
}