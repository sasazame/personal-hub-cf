import { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}

const colorVariants = {
  blue: 'bg-primary/10 text-primary',
  green: 'bg-success/10 text-success',
  purple: 'bg-purple-500/10 text-purple-500',
  orange: 'bg-warning/10 text-warning',
};

export function StatsCard({ 
  title, 
  value, 
  change, 
  changeLabel, 
  icon,
  color = 'blue' 
}: StatsCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div className="bg-card rounded-lg p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "p-3 rounded-lg",
          colorVariants[color]
        )}>
          {icon}
        </div>
        {change !== undefined && (
          <div className={cn(
            "flex items-center gap-1 text-sm",
            isPositive && "text-success",
            isNegative && "text-destructive",
            !isPositive && !isNegative && "text-muted-foreground"
          )}>
            {isPositive && <TrendingUp className="w-4 h-4" />}
            {isNegative && <TrendingDown className="w-4 h-4" />}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      
      <div>
        <p className="text-2xl font-bold text-foreground">
          {value}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {title}
        </p>
        {changeLabel && (
          <p className="text-xs text-muted-foreground mt-2">
            {changeLabel}
          </p>
        )}
      </div>
    </div>
  );
}