import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SearchBar } from './SearchBar';
import { SearchResults } from './SearchResults';
import { searchApi } from '../lib/api/search';
import { Label } from '@personal-hub/ui';
import { Button } from '@personal-hub/ui';
import { type EntityType, type SearchResultItem } from '@personal-hub/shared';

const availableTypes = [
  { value: 'todos' as EntityType, label: 'Todos' },
  { value: 'goals' as EntityType, label: 'Goals' },
  { value: 'events' as EntityType, label: 'Events' },
  { value: 'notes' as EntityType, label: 'Notes' },
  { value: 'moments' as EntityType, label: 'Moments' },
] as const;

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<EntityType[]>([]);
  const [offset, setOffset] = useState(0);
  const [allResults, setAllResults] = useState<SearchResultItem[]>([]);
  const limit = 20;
  
  // Debounce search query
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    
    return () => window.clearTimeout(timer);
  }, [query]);
  
  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery, selectedTypes, offset],
    queryFn: () => searchApi.search({
      query: debouncedQuery,
      types: selectedTypes.length > 0 ? selectedTypes : undefined,
      offset,
      limit,
    }),
    enabled: !!debouncedQuery,
  });
  
  // Accumulate results for pagination
  useEffect(() => {
    if (data?.results) {
      if (offset === 0) {
        setAllResults(data.results);
      } else {
        setAllResults(prev => [...prev, ...data.results]);
      }
    }
  }, [data, offset]);
  
  // Reset results when query or types change
  useEffect(() => {
    setOffset(0);
    setAllResults([]);
  }, [debouncedQuery, selectedTypes]);
  
  const handleSearch = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setOffset(0);
    setAllResults([]);
  }, []);
  
  const handleTypeToggle = useCallback((type: EntityType, checked: boolean) => {
    setSelectedTypes(prev => 
      checked ? [...prev, type] : prev.filter(t => t !== type)
    );
  }, []);
  
  const handleLoadMore = useCallback(() => {
    setOffset(prev => prev + limit);
  }, []);
  
  const hasMore = data ? data.total > allResults.length : false;
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Search</h1>
        <SearchBar
          value={query}
          onChange={setQuery}
          onSearch={handleSearch}
          onClear={() => {
            setQuery('');
          }}
        />
      </div>
      
      {query && (
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-3">Filter by type:</h3>
          <div className="flex flex-wrap gap-4">
            {availableTypes.map(type => (
              <div key={type.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={type.value}
                  checked={selectedTypes.includes(type.value)}
                  onChange={(e) => handleTypeToggle(type.value, e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor={type.value} className="cursor-pointer">
                  {type.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <SearchResults
        results={allResults}
        isLoading={isLoading && offset === 0}
        query={debouncedQuery}
        total={data?.total || 0}
      />
      
      {hasMore && (
        <div className="mt-6 text-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}