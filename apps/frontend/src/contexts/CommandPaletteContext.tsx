import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CommandPaletteState } from '../types/command-palette';
import { commandRegistry } from '../lib/command-registry';
import { debounce } from '../utils/debounce';
import { useCommandHistory } from '../hooks/useCommandHistory';

interface CommandPaletteContextValue {
  state: CommandPaletteState;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;
  setSearchQuery: (query: string) => void;
  setSelectedIndex: (index: number) => void;
  selectNext: () => void;
  selectPrevious: () => void;
  executeSelectedCommand: () => void;
  addRecentCommand: (commandId: string) => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

const MAX_RECENT_COMMANDS = 5;

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { addToHistory, getRecentCommandIds } = useCommandHistory();
  const [recentCommands, setRecentCommands] = useState<string[]>(() => {
    // Use sessionStorage for temporary data to avoid security issues
    try {
      // Check if sessionStorage is available (not in SSR, private mode, etc.)
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const stored = sessionStorage.getItem('commandPalette.recentCommands');
        return stored ? JSON.parse(stored) : [];
      }
    } catch {
      // Silently handle SecurityError, JSON parse errors, etc.
      return [];
    }
    return [];
  });
  
  // Version tracking for race condition prevention
  const searchVersion = useRef(0);
  
  // Debounce search query updates with version tracking
  const debouncedSetQuery = useRef(
    debounce((query: string, version: number) => {
      // Only update if this is the latest version
      if (version === searchVersion.current) {
        setDebouncedQuery(query);
      }
    }, 150)
  ).current;

  const filteredCommands = useMemo(() => {
    if (debouncedQuery) {
      return commandRegistry.searchCommands(debouncedQuery);
    }
    
    // Get commands from history
    const historyCommandIds = getRecentCommandIds();
    const historyCommands = historyCommandIds
      .map(id => commandRegistry.getCommand(id))
      .filter((cmd): cmd is NonNullable<typeof cmd> => 
        cmd !== undefined && (!cmd.isAvailable || cmd.isAvailable())
      );
    
    const allAvailable = commandRegistry.getAvailableCommands();
    const nonHistory = allAvailable.filter(
      cmd => !historyCommandIds.includes(cmd.id)
    );
    
    return [...historyCommands, ...nonHistory];
  }, [debouncedQuery, getRecentCommandIds]);

  const state: CommandPaletteState = {
    isOpen,
    searchQuery,
    selectedIndex,
    filteredCommands,
    recentCommands,
  };

  const openCommandPalette = useCallback(() => {
    setIsOpen(true);
    setSearchQuery('');
    setDebouncedQuery('');
    setSelectedIndex(0);
  }, []);

  const closeCommandPalette = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
    setDebouncedQuery('');
    setSelectedIndex(0);
  }, []);

  const toggleCommandPalette = useCallback(() => {
    if (isOpen) {
      closeCommandPalette();
    } else {
      openCommandPalette();
    }
  }, [isOpen, openCommandPalette, closeCommandPalette]);

  const selectNext = useCallback(() => {
    setSelectedIndex((prev) => {
      const max = filteredCommands.length - 1;
      return prev < max ? prev + 1 : 0;
    });
  }, [filteredCommands.length]);

  const selectPrevious = useCallback(() => {
    setSelectedIndex((prev) => {
      const max = filteredCommands.length - 1;
      return prev > 0 ? prev - 1 : max;
    });
  }, [filteredCommands.length]);

  const addRecentCommand = useCallback((commandId: string) => {
    setRecentCommands((prev) => {
      const updated = [commandId, ...prev.filter(id => id !== commandId)]
        .slice(0, MAX_RECENT_COMMANDS);
      // Use sessionStorage for temporary data to avoid security issues
      try {
        // Check if sessionStorage is available (not in SSR, private mode, etc.)
        if (typeof window !== 'undefined' && window.sessionStorage) {
          sessionStorage.setItem('commandPalette.recentCommands', JSON.stringify(updated));
        }
      } catch (e) {
        // Silently handle SecurityError in private browsing, CSP restrictions, etc.
        console.warn('Failed to save recent commands:', e);
      }
      return updated;
    });
  }, []);

  const executeSelectedCommand = useCallback(() => {
    const command = filteredCommands[selectedIndex];
    if (command) {
      closeCommandPalette();
      addRecentCommand(command.id);
      addToHistory(command.id);
      
      // Handle both sync and async command execution with error handling
      try {
        const result = command.action();
        
        // If the action returns a promise, handle its errors
        if (result && typeof result === 'object' && 'then' in result) {
          Promise.resolve(result).catch((error) => {
            console.error(`Command "${command.title}" failed:`, error);
            // You could show a toast notification here
            // toast.error(`Failed to execute: ${command.title}`);
          });
        }
      } catch (error) {
        console.error(`Command "${command.title}" failed:`, error);
        // You could show a toast notification here
        // toast.error(`Failed to execute: ${command.title}`);
      }
    }
  }, [filteredCommands, selectedIndex, closeCommandPalette, addRecentCommand, addToHistory]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        e.stopPropagation();
        toggleCommandPalette();
        return false; // Prevent any other handlers
      }
    };

    // Add to window to ensure it gets priority
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [toggleCommandPalette]);

  // Update debounced query when search query changes
  useEffect(() => {
    // Increment version for each new search
    searchVersion.current++;
    const currentVersion = searchVersion.current;
    
    debouncedSetQuery(searchQuery, currentVersion);
    
    // Cleanup on unmount
    return () => {
      debouncedSetQuery.cancel();
    };
  }, [searchQuery, debouncedSetQuery]);
  
  // Reset selection when filtered commands change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands.length]);

  const value: CommandPaletteContextValue = {
    state,
    openCommandPalette,
    closeCommandPalette,
    toggleCommandPalette,
    setSearchQuery,
    setSelectedIndex,
    selectNext,
    selectPrevious,
    executeSelectedCommand,
    addRecentCommand,
  };

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette() {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error('useCommandPalette must be used within CommandPaletteProvider');
  }
  return context;
}