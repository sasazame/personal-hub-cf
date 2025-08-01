import { useMemo } from 'react';
import { format, eachDayOfInterval } from 'date-fns';
import { cn } from '@/lib/cn';

interface ActivityHeatmapProps {
  data: Array<{ date: string; value: number }>;
  startDate: Date;
  endDate: Date;
}

export function ActivityHeatmap({ data, startDate, endDate }: ActivityHeatmapProps) {
  const dataMap = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach(item => {
      map.set(item.date, item.value);
    });
    return map;
  }, [data]);

  const days = useMemo(() => {
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [startDate, endDate]);

  const weeks = Math.ceil(days.length / 7);
  
  const getColor = (value: number) => {
    if (value === 0) return 'bg-muted';
    if (value <= 2) return 'bg-success/20';
    if (value <= 4) return 'bg-success/40';
    if (value <= 6) return 'bg-success/60';
    return 'bg-success';
  };

  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
  const months = useMemo(() => {
    const monthsMap = new Map<number, string>();
    days.forEach((day, index) => {
      if (index === 0 || day.getDate() === 1) {
        const weekIndex = Math.floor(index / 7);
        monthsMap.set(weekIndex, format(day, 'MMM'));
      }
    });
    return monthsMap;
  }, [days]);

  return (
    <div className="bg-card rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">アクティビティ</h3>
      
      <div className="overflow-x-auto">
        <div className="inline-block">
          {/* Month labels */}
          <div className="flex mb-2">
            <div className="w-10" /> {/* Space for day labels */}
            {Array.from({ length: weeks }).map((_, weekIndex) => (
              <div key={weekIndex} className="w-[13px] text-center">
                {months.get(weekIndex) && (
                  <span className="text-xs text-muted-foreground">
                    {months.get(weekIndex)}
                  </span>
                )}
              </div>
            ))}
          </div>
          
          {/* Heatmap grid */}
          <div className="flex">
            {/* Day labels */}
            <div className="flex flex-col justify-between mr-2">
              {weekDays.map((day, index) => (
                <div
                  key={day}
                  className={cn(
                    "text-xs text-muted-foreground h-[13px] flex items-center",
                    index % 2 === 1 && "invisible"
                  )}
                >
                  {day}
                </div>
              ))}
            </div>
            
            {/* Activity squares */}
            <div className="flex gap-[3px]">
              {Array.from({ length: weeks }).map((_, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[3px]">
                  {Array.from({ length: 7 }).map((_, dayIndex) => {
                    const dayOffset = weekIndex * 7 + dayIndex;
                    const currentDay = days[dayOffset];
                    
                    if (!currentDay) {
                      return <div key={dayIndex} className="w-[10px] h-[10px]" />;
                    }
                    
                    const dateStr = format(currentDay, 'yyyy-MM-dd');
                    const value = dataMap.get(dateStr) || 0;
                    
                    return (
                      <div
                        key={dayIndex}
                        className={cn(
                          "w-[10px] h-[10px] rounded-sm transition-colors cursor-pointer",
                          "hover:ring-1 hover:ring-border",
                          getColor(value)
                        )}
                        title={`${dateStr}: ${value} アクティビティ`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
            <span>少ない</span>
            <div className="flex gap-[3px]">
              {[0, 2, 4, 6, 8].map((value) => (
                <div
                  key={value}
                  className={cn(
                    "w-[10px] h-[10px] rounded-sm",
                    getColor(value)
                  )}
                />
              ))}
            </div>
            <span>多い</span>
          </div>
        </div>
      </div>
    </div>
  );
}