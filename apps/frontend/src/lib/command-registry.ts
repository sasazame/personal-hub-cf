import { Command, CommandCategory } from '../types/command-palette';

interface SearchCache {
  query: string;
  results: Command[];
  timestamp: number;
}

interface SearchIndex {
  titleLower: string;
  descriptionLower: string;
  keywordsLower: string[];
}

class CommandRegistry {
  private commands: Map<string, Command> = new Map();
  private categories: Map<CommandCategory, Set<string>> = new Map();
  private searchCache: Map<string, SearchCache> = new Map();
  private searchIndex: Map<string, SearchIndex> = new Map();
  private availableCommandsCache: Command[] | null = null;
  private cacheTimeout = 5000; // 5 seconds cache

  constructor() {
    this.categories.set('navigation', new Set());
    this.categories.set('action', new Set());
    this.categories.set('search', new Set());
    this.categories.set('settings', new Set());
  }

  register(command: Command): void {
    // Validate command ID format to prevent injection
    if (!/^[a-zA-Z0-9-_]+$/.test(command.id)) {
      throw new Error(`Invalid command ID format: ${command.id}`);
    }
    
    // Validate required string fields
    if (typeof command.title !== 'string' || command.title.trim().length === 0) {
      throw new Error('Command title must be a non-empty string');
    }
    
    if (command.description && typeof command.description !== 'string') {
      throw new Error('Command description must be a string');
    }
    
    // Validate category
    const validCategories = ['navigation', 'action', 'search', 'settings'];
    if (!validCategories.includes(command.category)) {
      throw new Error(`Invalid command category: ${command.category}`);
    }
    
    // Check for duplicate registration
    if (this.commands.has(command.id)) {
      console.warn(`Command with id "${command.id}" is already registered`);
      return;
    }

    this.commands.set(command.id, command);
    const categorySet = this.categories.get(command.category);
    if (categorySet) {
      categorySet.add(command.id);
    }
    
    // Build search index
    this.searchIndex.set(command.id, {
      titleLower: command.title.toLowerCase(),
      descriptionLower: command.description?.toLowerCase() || '',
      keywordsLower: command.keywords?.map(k => k.toLowerCase()) || []
    });
    
    // Invalidate caches
    this.invalidateCaches();
  }

  unregister(commandId: string): void {
    const command = this.commands.get(commandId);
    if (command) {
      this.commands.delete(commandId);
      const categorySet = this.categories.get(command.category);
      if (categorySet) {
        categorySet.delete(commandId);
      }
      this.searchIndex.delete(commandId);
      this.invalidateCaches();
    }
  }

  getCommand(commandId: string): Command | undefined {
    return this.commands.get(commandId);
  }

  getAllCommands(): Command[] {
    return Array.from(this.commands.values());
  }

  getAvailableCommands(): Command[] {
    // Return cached results if available
    if (this.availableCommandsCache) {
      return this.availableCommandsCache;
    }
    
    const available = this.getAllCommands().filter(
      (cmd) => !cmd.isAvailable || cmd.isAvailable()
    );
    
    this.availableCommandsCache = available;
    return available;
  }

  getCommandsByCategory(category: CommandCategory): Command[] {
    const commandIds = this.categories.get(category);
    if (!commandIds) return [];

    return Array.from(commandIds)
      .map((id) => this.commands.get(id))
      .filter((cmd): cmd is Command => cmd !== undefined);
  }

  searchCommands(query: string): Command[] {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) {
      return this.getAvailableCommands();
    }

    // Check cache first
    const cached = this.searchCache.get(normalizedQuery);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.results;
    }

    const availableCommands = this.getAvailableCommands();
    const scored: Array<{ command: Command; score: number }> = [];
    
    // Use pre-computed search index
    for (const command of availableCommands) {
      const index = this.searchIndex.get(command.id);
      if (!index) continue;
      
      let score = 0;
      
      // Exact match gets highest score
      if (index.titleLower === normalizedQuery) {
        score = 100;
      } else if (index.titleLower.startsWith(normalizedQuery)) {
        score = 80;
      } else if (index.titleLower.includes(normalizedQuery)) {
        score = 60;
      } else if (index.descriptionLower.includes(normalizedQuery)) {
        score = 40;
      } else if (index.keywordsLower.some(k => k.includes(normalizedQuery))) {
        score = 30;
      }

      // Multi-word search optimization
      if (score === 0 && normalizedQuery.includes(' ')) {
        const words = normalizedQuery.split(' ');
        const matchCount = words.filter(
          (word) =>
            index.titleLower.includes(word) ||
            index.descriptionLower.includes(word) ||
            index.keywordsLower.some(k => k.includes(word))
        ).length;
        score = (matchCount / words.length) * 20;
      }

      if (score > 0) {
        scored.push({ command, score });
      }
    }

    // Sort and extract commands
    const results = scored
      .sort((a, b) => b.score - a.score)
      .map(({ command }) => command);

    // Cache the results
    this.searchCache.set(normalizedQuery, {
      query: normalizedQuery,
      results,
      timestamp: Date.now()
    });

    return results;
  }

  clear(): void {
    this.commands.clear();
    this.categories.forEach((set) => set.clear());
    this.searchIndex.clear();
    this.invalidateCaches();
  }
  
  private invalidateCaches(): void {
    this.searchCache.clear();
    this.availableCommandsCache = null;
  }
}

export const commandRegistry = new CommandRegistry();