import React from 'react';
import { Card, CardContent } from '@personal-hub/ui';
import { Calendar, CheckCircle2, Target, FileText, Zap, Loader2 } from 'lucide-react';
import type { SearchResultItem } from '@personal-hub/shared';
import { formatDistanceToNow } from 'date-fns';

interface SearchResultsProps {
  results: SearchResultItem[];
  isLoading?: boolean;
  query: string;
  total: number;
}

const typeConfig = {
  todos: { icon: CheckCircle2, color: 'text-blue-500', label: 'Todo' },
  goals: { icon: Target, color: 'text-purple-500', label: 'Goal' },
  events: { icon: Calendar, color: 'text-green-500', label: 'Event' },
  notes: { icon: FileText, color: 'text-yellow-500', label: 'Note' },
  moments: { icon: Zap, color: 'text-pink-500', label: 'Moment' },
};

export function SearchResults({ results, isLoading, query, total }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (results.length === 0 && query) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No results found for "{query}"</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {query && (
        <p className="text-sm text-muted-foreground">
          Found {total} result{total !== 1 ? 's' : ''} for "{query}"
        </p>
      )}
      
      {results.map((result) => {
        const config = typeConfig[result.type];
        const Icon = config.icon;
        
        return (
          <div 
            key={`${result.type}-${result.id}`} 
            className="block cursor-pointer"
          >
            <Card className="transition-colors hover:bg-accent">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className={`mt-1 ${config.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium leading-none truncate">
                        {result.title}
                      </h3>
                      <span className="text-xs px-2 py-1 bg-secondary rounded-md shrink-0">
                        {config.label}
                      </span>
                    </div>
                    
                    {result.content && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {result.content}
                      </p>
                    )}
                    
                    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                      {result.status && (
                        <span className="capitalize">{result.status.toLowerCase()}</span>
                      )}
                      {result.priority && (
                        <span className="capitalize">{result.priority.toLowerCase()}</span>
                      )}
                      {result.date && (
                        <span>{new Date(result.date).toLocaleDateString()}</span>
                      )}
                      {result.tags && result.tags.length > 0 && (
                        <div className="flex gap-1">
                          {result.tags.slice(0, 3).map((tag, index) => (
                            <span key={index} className="text-xs px-1.5 py-0.5 border rounded">
                              {tag}
                            </span>
                          ))}
                          {result.tags.length > 3 && (
                            <span>+{result.tags.length - 3}</span>
                          )}
                        </div>
                      )}
                      <span className="ml-auto">
                        {formatDistanceToNow(new Date(result.updatedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}