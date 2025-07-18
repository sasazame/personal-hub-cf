import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { MomentItem } from './MomentItem';
import { MomentForm } from './MomentForm';
import { Search, X } from 'lucide-react';
import { momentsApi } from '../lib/moments-api';
import type { MomentQuery } from '@personal-hub/shared';

export function MomentList() {
  const [query, setQuery] = useState<MomentQuery>({ limit: 20, offset: 0 });
  const [searchInput, setSearchInput] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | undefined>();

  const { data, isLoading, error, isError } = useQuery({
    queryKey: ['moments', query],
    queryFn: () => momentsApi.list(query),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery({ ...query, search: searchInput || undefined, offset: 0 });
  };

  const handleTagFilter = (tag: string) => {
    setSelectedTag(tag);
    setQuery({ ...query, tag, offset: 0 });
  };

  const clearTagFilter = () => {
    setSelectedTag(undefined);
    setQuery({ ...query, tag: undefined, offset: 0 });
  };

  const loadMore = () => {
    if (data && data.offset + data.limit < data.total) {
      setQuery({ ...query, offset: query.offset + query.limit });
    }
  };

  // Extract all unique tags from moments
  const allTags = data?.items.reduce((tags, moment) => {
    moment.tags.forEach(tag => tags.add(tag));
    return tags;
  }, new Set<string>());

  return (
    <div className="space-y-6">
      <MomentForm />

      <div className="space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search moments..."
            className="flex-1"
          />
          <Button type="submit">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        {allTags && allTags.size > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-500">Filter by tag:</span>
            {Array.from(allTags).map((tag) => (
              <Badge
                key={tag}
                variant={selectedTag === tag ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => handleTagFilter(tag)}
              >
                {tag}
              </Badge>
            ))}
            {selectedTag && (
              <Button
                size="sm"
                variant="ghost"
                onClick={clearTagFilter}
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
        )}
      </div>

      {isLoading && <div className="text-center py-4">Loading moments...</div>}
      
      {isError && (
        <div className="text-center py-4 text-red-500">
          Failed to load moments: {error?.message || 'Unknown error'}
        </div>
      )}

      {data && (
        <>
          <div className="space-y-4">
            {data.items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {query.search || query.tag 
                  ? 'No moments found matching your search.' 
                  : 'No moments yet. Start capturing your thoughts!'}
              </div>
            ) : (
              data.items.map((moment) => (
                <MomentItem key={moment.id} moment={moment} />
              ))
            )}
          </div>

          {data.items.length > 0 && data.offset + data.limit < data.total && (
            <div className="text-center">
              <Button
                variant="outline"
                onClick={loadMore}
              >
                Load More ({data.total - data.offset - data.limit} remaining)
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}