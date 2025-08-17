import type { ComponentType } from 'react';

export type CommandCategory = 'navigation' | 'action' | 'search' | 'settings';

export interface Command {
  id: string;
  title: string;
  description?: string;
  category: CommandCategory;
  keywords?: string[];
  icon?: ComponentType<{ className?: string }>;
  shortcut?: string;
  action: () => void | Promise<void>;
  isAvailable?: () => boolean;
}

export interface CommandGroup {
  title: string;
  commands: Command[];
}

export interface CommandPaletteState {
  isOpen: boolean;
  searchQuery: string;
  selectedIndex: number;
  filteredCommands: Command[];
  recentCommands: string[];
}