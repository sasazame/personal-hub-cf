import React, { useEffect, useRef, memo, useCallback, useMemo } from 'react';
import { Search, Command as CommandIcon } from 'lucide-react';
import { useCommandPalette } from '../contexts/CommandPaletteContext';
import { Modal } from './ui/Modal';
import { Command } from '../types/command-palette';
import { useTranslation } from 'react-i18next';
import { VirtualCommandList } from './VirtualCommandList';
import { commandRegistry } from '../lib/command-registry';

// Memoize command item to prevent re-renders
const CommandItem = memo(({ 
  command, 
  isSelected, 
  onExecute, 
  onHover,
  index
}: {
  command: Command;
  isSelected: boolean;
  onExecute: (index: number) => void;
  onHover: (index: number) => void;
  index: number;
}) => {
  const Icon = command.icon;
  const handleMouseEnter = useCallback(() => {
    onHover(index);
  }, [index, onHover]);
  
  const handleClick = useCallback(() => {
    onExecute(index);
  }, [index, onExecute]);
  
  return (
    <div
      id={`command-${index}`}
      role="option"
      aria-selected={isSelected}
      className={`
        flex items-center justify-between px-4 py-2 cursor-pointer
        ${
          isSelected
            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
            : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
        }
      `}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
    >
      <div className="flex items-center">
        {Icon ? (
          <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
        ) : (
          <CommandIcon className="w-4 h-4 mr-3 flex-shrink-0" />
        )}
        <div className="flex flex-col">
          <span className="font-medium">{command.title}</span>
          {command.description && (
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {command.description}
            </span>
          )}
        </div>
      </div>
      {command.shortcut && (
        <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400 rounded">
          {command.shortcut}
        </kbd>
      )}
    </div>
  );
});

CommandItem.displayName = 'CommandItem';

export function CommandPalette() {
  const { t } = useTranslation('common');
  const {
    state,
    closeCommandPalette,
    setSearchQuery,
    setSelectedIndex,
    selectNext,
    selectPrevious,
    executeSelectedCommand,
  } = useCommandPalette();

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [state.isOpen]);

  useEffect(() => {
    if (selectedRef.current && listRef.current) {
      const list = listRef.current;
      const selected = selectedRef.current;
      const listRect = list.getBoundingClientRect();
      const selectedRect = selected.getBoundingClientRect();

      if (selectedRect.bottom > listRect.bottom) {
        selected.scrollIntoView({ block: 'end', behavior: 'smooth' });
      } else if (selectedRect.top < listRect.top) {
        selected.scrollIntoView({ block: 'start', behavior: 'smooth' });
      }
    }
  }, [state.selectedIndex]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        selectNext();
        break;
      case 'ArrowUp':
        e.preventDefault();
        selectPrevious();
        break;
      case 'Enter':
        e.preventDefault();
        executeSelectedCommand();
        break;
      case 'Escape':
        e.preventDefault();
        closeCommandPalette();
        break;
    }
  }, [selectNext, selectPrevious, executeSelectedCommand, closeCommandPalette]);

  const getCategoryLabel = useCallback((category: string) => {
    switch (category) {
      case 'history':
        return t('commandPalette.categories.history', 'History');
      case 'navigation':
        return t('commandPalette.categories.navigation', 'Navigation');
      case 'action':
        return t('commandPalette.categories.action', 'Actions');
      case 'search':
        return t('commandPalette.categories.search', 'Search');
      case 'settings':
        return t('commandPalette.categories.settings', 'Settings');
      default:
        return category;
    }
  }, [t]);

  const groupedCommands = useMemo(() => {
    const groups = new Map<string, Command[]>();
    const historyGroup: Command[] = [];
    
    // When there's no search query, first 5 commands are from history
    if (!state.searchQuery && state.filteredCommands.length > 0) {
      const historyCount = Math.min(5, state.filteredCommands.length);
      for (let i = 0; i < historyCount; i++) {
        const cmd = state.filteredCommands[i];
        // Check if this is a history command by seeing if it would be in normal order
        const allCommands = commandRegistry.getAvailableCommands();
        const normalIndex = allCommands.findIndex(c => c.id === cmd.id);
        if (normalIndex >= historyCount) {
          historyGroup.push(cmd);
        } else {
          break;
        }
      }
    }
    
    // Group remaining commands by category
    const startIndex = historyGroup.length;
    state.filteredCommands.slice(startIndex).forEach((command) => {
      const category = command.category;
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(command);
    });

    const result = [];
    if (historyGroup.length > 0) {
      result.push({ category: 'history', commands: historyGroup });
    }
    result.push(...Array.from(groups.entries()).map(([category, commands]) => ({
      category,
      commands,
    })));
    
    return result;
  }, [state.filteredCommands, state.searchQuery]);
  
  // Memoize handler for item hover
  const handleItemHover = useCallback((index: number) => {
    if (index !== state.selectedIndex) {
      setSelectedIndex(index);
    }
  }, [state.selectedIndex, setSelectedIndex]);
  
  // Memoize handler for item execute
  const handleItemExecute = useCallback((index: number) => {
    // Ensure the clicked item is selected before execution
    setSelectedIndex(index);
    executeSelectedCommand();
  }, [setSelectedIndex, executeSelectedCommand]);

  let globalIndex = -1;

  return (
    <Modal
      open={state.isOpen}
      onClose={closeCommandPalette}
      className="max-w-2xl mx-auto mt-20"
    >
      <div className="flex flex-col h-[600px] max-h-[80vh]" role="combobox" aria-expanded="true" aria-haspopup="listbox" aria-owns="command-list">
        <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <Search className="w-5 h-5 text-gray-400 mr-3" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            role="searchbox"
            aria-controls="command-list"
            aria-activedescendant={state.filteredCommands.length > 0 ? `command-${state.selectedIndex}` : undefined}
            aria-label={t('commandPalette.searchPlaceholder', 'Type a command or search...')}
            value={state.searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('commandPalette.searchPlaceholder', 'Type a command or search...')}
            className="flex-1 bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400 rounded">
            ESC
          </kbd>
        </div>

        {/* Screen reader announcement for search results */}
        <div className="sr-only" aria-live="polite" aria-atomic="true" id="command-results-count">
          {state.filteredCommands.length} {t('commandPalette.resultsFound', 'commands found')}
        </div>

        <div ref={listRef} id="command-list" role="listbox" className="flex-1 min-h-0 overflow-y-auto py-2" aria-label="Command suggestions">
          {state.filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              {state.searchQuery
                ? t('commandPalette.noResults', 'No results found')
                : t('commandPalette.noCommands', 'No commands available')}
            </div>
          ) : state.filteredCommands.length > 50 ? (
            // Use virtual scrolling for large lists
            <VirtualCommandList
              commands={state.filteredCommands}
              selectedIndex={state.selectedIndex}
              itemHeight={48}
              containerHeight={400}
              renderItem={(command, index, isSelected) => (
                <div ref={isSelected ? selectedRef : undefined}>
                  <CommandItem
                    command={command}
                    isSelected={isSelected}
                    onExecute={handleItemExecute}
                    onHover={handleItemHover}
                    index={index}
                  />
                </div>
              )}
            />
          ) : (
            // Regular rendering for smaller lists
            groupedCommands.map(({ category, commands }) => (
              <div key={category} className="mb-2">
                <div className="px-4 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {getCategoryLabel(category)}
                </div>
                {commands.map((command) => {
                  globalIndex++;
                  const currentIndex = globalIndex;
                  const isSelected = currentIndex === state.selectedIndex;

                  return (
                    <div key={command.id} ref={isSelected ? selectedRef : undefined}>
                      <CommandItem
                        command={command}
                        isSelected={isSelected}
                        onExecute={handleItemExecute}
                        onHover={handleItemHover}
                        index={currentIndex}
                      />
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 font-semibold bg-gray-100 dark:bg-gray-800 rounded">↑</kbd>
              <kbd className="px-1.5 py-0.5 font-semibold bg-gray-100 dark:bg-gray-800 rounded">↓</kbd>
              {t('commandPalette.navigate', 'Navigate')}
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 font-semibold bg-gray-100 dark:bg-gray-800 rounded">↵</kbd>
              {t('commandPalette.select', 'Select')}
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 font-semibold bg-gray-100 dark:bg-gray-800 rounded">ESC</kbd>
              {t('commandPalette.close', 'Close')}
            </span>
          </div>
          {state.filteredCommands.length > 0 && (
            <span>
              {state.selectedIndex + 1} / {state.filteredCommands.length}
            </span>
          )}
        </div>
      </div>
    </Modal>
  );
}