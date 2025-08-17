import { useState, useCallback } from 'react';

export interface CommandHistoryEntry {
  commandId: string;
  timestamp: number;
  usageCount: number;
}

const HISTORY_KEY = 'commandPalette.history';
const MAX_HISTORY_ITEMS = 5;

export function useCommandHistory() {
  const [history, setHistory] = useState<CommandHistoryEntry[]>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(HISTORY_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          return Array.isArray(parsed) ? parsed : [];
        }
      }
    } catch (e) {
      console.warn('Failed to load command history:', e);
    }
    return [];
  });

  const saveHistory = useCallback((entries: CommandHistoryEntry[]) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
      }
    } catch (e) {
      console.warn('Failed to save command history:', e);
    }
  }, []);

  const addToHistory = useCallback((commandId: string) => {
    setHistory(prev => {
      const existing = prev.find(entry => entry.commandId === commandId);
      let updated: CommandHistoryEntry[];
      
      if (existing) {
        updated = prev.map(entry =>
          entry.commandId === commandId
            ? { ...entry, timestamp: Date.now(), usageCount: entry.usageCount + 1 }
            : entry
        );
      } else {
        updated = [
          { commandId, timestamp: Date.now(), usageCount: 1 },
          ...prev
        ].slice(0, MAX_HISTORY_ITEMS);
      }
      
      updated.sort((a, b) => {
        const scoreDiff = b.usageCount - a.usageCount;
        if (scoreDiff !== 0) return scoreDiff;
        return b.timestamp - a.timestamp;
      });
      
      const limited = updated.slice(0, MAX_HISTORY_ITEMS);
      saveHistory(limited);
      return limited;
    });
  }, [saveHistory]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(HISTORY_KEY);
      }
    } catch (e) {
      console.warn('Failed to clear command history:', e);
    }
  }, []);

  const getRecentCommandIds = useCallback((): string[] => {
    return history.map(entry => entry.commandId);
  }, [history]);

  return {
    history,
    addToHistory,
    clearHistory,
    getRecentCommandIds
  };
}