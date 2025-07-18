import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SearchBar } from './SearchBar';
import { SearchResults } from './SearchResults';
import { searchApi } from '../lib/api/search';
import { Label } from '@personal-hub/ui';
import { Button } from '@personal-hub/ui';
import type { SearchResultItem } from '@personal-hub/shared';

const availableTypes = [
  { value: 'todos', label: 'Todos' },
  { value: 'goals', label: 'Goals' },
  { value: 'events', label: 'Events' },
  { value: 'notes', label: 'Notes' },
  { value: 'moments', label: 'Moments' },
] as const;

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [offset, setOffset] = useState(0);
  const limit = 20;
  
  const { data, isLoading } = useQuery({
    queryKey: ['search', query, selectedTypes, offset],
    queryFn: () => searchApi.search({
      query,
      types: selectedTypes.length > 0 ? selectedTypes as any : undefined,
      offset,
      limit,
    }),
    enabled: !!query,
  });
  
  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    setOffset(0);
  };
  
  const handleTypeToggle = (type: string, checked: boolean) => {
    setSelectedTypes(prev => 
      checked ? [...prev, type] : prev.filter(t => t !== type)
    );
    setOffset(0);
  };
  
  const handleLoadMore = () => {
    setOffset(prev => prev + limit);
  };
  
  const allResults = data?.results || [];
  const hasMore = data ? data.total > offset + limit : false;
  
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
        isLoading={isLoading}
        query={query}
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