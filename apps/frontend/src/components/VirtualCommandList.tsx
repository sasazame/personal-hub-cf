import React, { useRef, useEffect, useState, memo, useCallback } from 'react';
import { Command } from '../types/command-palette';

interface VirtualCommandListProps {
  commands: Command[];
  selectedIndex: number;
  itemHeight: number;
  containerHeight: number;
  renderItem: (command: Command, index: number, isSelected: boolean) => React.ReactNode;
}

export const VirtualCommandList = memo(({
  commands,
  selectedIndex,
  itemHeight = 48,
  containerHeight = 400,
  renderItem
}: VirtualCommandListProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  
  // Calculate visible range
  const totalHeight = commands.length * itemHeight;
  const visibleStartIndex = Math.floor(scrollTop / itemHeight);
  const visibleEndIndex = Math.min(
    commands.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight)
  );
  
  // Add buffer for smoother scrolling
  const bufferSize = 3;
  const startIndex = Math.max(0, visibleStartIndex - bufferSize);
  const endIndex = Math.min(commands.length, visibleEndIndex + bufferSize);
  
  // Auto-scroll to selected item
  useEffect(() => {
    if (scrollContainerRef.current && selectedIndex >= 0) {
      const selectedTop = selectedIndex * itemHeight;
      const selectedBottom = selectedTop + itemHeight;
      const containerTop = scrollTop;
      const containerBottom = scrollTop + containerHeight;
      
      if (selectedBottom > containerBottom) {
        // Scroll down to show selected item
        scrollContainerRef.current.scrollTop = selectedBottom - containerHeight;
      } else if (selectedTop < containerTop) {
        // Scroll up to show selected item
        scrollContainerRef.current.scrollTop = selectedTop;
      }
    }
  }, [selectedIndex, itemHeight, containerHeight, scrollTop]);
  
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop((e.target as HTMLDivElement).scrollTop);
  }, []);
  
  // Only render if we have more than 50 commands
  if (commands.length <= 50) {
    return (
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
        style={{ maxHeight: `${containerHeight}px` }}
      >
        {commands.map((command, index) => 
          renderItem(command, index, index === selectedIndex)
        )}
      </div>
    );
  }
  
  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto"
      style={{ maxHeight: `${containerHeight}px` }}
      onScroll={handleScroll}
    >
      {/* Total height container to maintain scrollbar */}
      <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
        {/* Render only visible items */}
        {commands.slice(startIndex, endIndex).map((command, idx) => {
          const actualIndex = startIndex + idx;
          return (
            <div
              key={command.id}
              style={{
                position: 'absolute',
                top: `${actualIndex * itemHeight}px`,
                left: 0,
                right: 0,
                height: `${itemHeight}px`
              }}
            >
              {renderItem(command, actualIndex, actualIndex === selectedIndex)}
            </div>
          );
        })}
      </div>
    </div>
  );
});

VirtualCommandList.displayName = 'VirtualCommandList';