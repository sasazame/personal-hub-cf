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
  private availableCacheTimestamp: number | null = null;
  private cacheTimeout = 5000; // 5 seconds cache
  private availableCacheTTL = 5000; // 5 seconds availability cache

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
    // Return cached results if fresh
    if (
      this.availableCommandsCache &&
      this.availableCacheTimestamp &&
      Date.now() - this.availableCacheTimestamp < this.availableCacheTTL
    ) {
      return this.availableCommandsCache;
    }
    
    const available = this.getAllCommands()
      .filter((cmd) => !cmd.isAvailable || cmd.isAvailable())
      .sort((a, b) => {
        // Sort by category first
        const categoryOrder = ['navigation', 'action', 'search', 'settings'];
        const aIndex = categoryOrder.indexOf(a.category);
        const bIndex = categoryOrder.indexOf(b.category);
        if (aIndex !== bIndex) {
          return aIndex - bIndex;
        }
        // Then sort alphabetically by title within category
        return a.title.localeCompare(b.title);
      });
    
    this.availableCommandsCache = available;
    this.availableCacheTimestamp = Date.now();
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
    const exactMatches: Command[] = [];
    const startsWithMatches: Command[] = [];
    const fuzzyMatches: Array<{ command: Command; score: number }> = [];
    
    // Use pre-computed search index
    for (const command of availableCommands) {
      const index = this.searchIndex.get(command.id);
      if (!index) continue;
      
      // Check for exact match
      if (index.titleLower === normalizedQuery) {
        exactMatches.push(command);
        continue;
      }
      
      // Check for starts-with match
      if (index.titleLower.startsWith(normalizedQuery)) {
        startsWithMatches.push(command);
        continue;
      }
      
      // Calculate fuzzy match score
      let score = 0;
      
      if (index.titleLower.includes(normalizedQuery)) {
        score = 60;
      } else if (index.descriptionLower.includes(normalizedQuery)) {
        score = 40;
      } else if (index.keywordsLower.some(k => k.includes(normalizedQuery))) {
        score = 30;
      }

      // Multi-word search optimization
      if (score === 0 && normalizedQuery.includes(' ')) {
        const words = normalizedQuery.split(/\s+/).filter(Boolean);
        if (words.length > 0) {
          const matchCount = words.filter(
            (word) =>
              index.titleLower.includes(word) ||
              index.descriptionLower.includes(word) ||
              index.keywordsLower.some(k => k.includes(word))
          ).length;
          score = (matchCount / words.length) * 20;
        }
      }

      if (score > 0) {
        fuzzyMatches.push({ command, score });
      }
    }

    // Sort each group
    exactMatches.sort((a, b) => a.title.localeCompare(b.title));
    startsWithMatches.sort((a, b) => a.title.localeCompare(b.title));
    fuzzyMatches.sort((a, b) => {
      const scoreDiff = b.score - a.score;
      if (scoreDiff !== 0) return scoreDiff;
      return a.command.title.localeCompare(b.command.title);
    });

    // Combine results: exact matches → starts with → fuzzy matches
    const results = [
      ...exactMatches,
      ...startsWithMatches,
      ...fuzzyMatches.map(({ command }) => command)
    ];

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
    this.availableCacheTimestamp = null;
  }
}

export const commandRegistry = new CommandRegistry();