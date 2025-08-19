import { useEffect, useRef } from 'react';
import { DEFAULT_MOMENT_TAGS } from '@/types/moment';

interface UseMomentTagKeyboardShortcutsProps {
  onToggleTag: (tag: string) => void;
  isEnabled?: boolean;
}

type TagShortcutKey = 'F1' | 'F2' | 'F3' | 'F4' | 'F5';
type DefaultTag = typeof DEFAULT_MOMENT_TAGS[number];

const TAG_SHORTCUTS: Record<TagShortcutKey, DefaultTag> = {
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
  // Store the callback in a ref to avoid re-binding the event listener
  const onToggleTagRef = useRef(onToggleTag);
  useEffect(() => {
    onToggleTagRef.current = onToggleTag;
  }, [onToggleTag]);

  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if Shift key is pressed and the key is a function key
      if (event.shiftKey && TAG_SHORTCUTS[event.key as TagShortcutKey]) {
        event.preventDefault();
        const tag = TAG_SHORTCUTS[event.key as TagShortcutKey];
        onToggleTagRef.current(tag);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEnabled]); // Only depend on isEnabled, not onToggleTag

  return TAG_SHORTCUTS as Record<string, string>; // Cast back for backward compatibility
}