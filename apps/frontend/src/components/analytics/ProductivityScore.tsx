import { useState, useEffect } from 'react';
import { cn } from '@/lib/cn';
import { Info } from 'lucide-react';

interface ProductivityScoreProps {
  score: number;
  factors: Record<string, number>;
}

export function ProductivityScore({ score, factors }: ProductivityScoreProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 60;
    const increment = score / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setAnimatedScore(score);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score]);

  const getScoreColor = (value: number) => {
    if (value >= 80) return 'text-success';
    if (value >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreLabel = (value: number) => {
    if (value >= 80) return '素晴らしい';
    if (value >= 60) return '良好';
    if (value >= 40) return '改善の余地あり';
    return '要改善';
  };

  const factorLabels: Record<string, string> = {
    taskCompletion: 'タスク完了率',
    consistency: '継続性',
    focusTime: '集中時間',
    goalProgress: '目標達成率',
  };

  return (
    <div className="bg-card rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">生産性スコア</h3>
        <div className="group relative">
          <Info className="w-5 h-5 text-muted-foreground cursor-help" />
          <div className="absolute right-0 top-6 w-64 p-3 bg-popover text-popover-foreground text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border">
            生産性スコアは、タスク完了率、継続性、集中時間、目標達成率から算出されます。
          </div>
        </div>
      </div>

      <div className="text-center mb-6">
        <div className={cn(
          "text-5xl font-bold mb-2",
          getScoreColor(animatedScore)
        )}>
          {animatedScore}
        </div>
        <p className="text-sm text-muted-foreground">
          {getScoreLabel(score)}
        </p>
      </div>

      <div className="space-y-3">
        {Object.entries(factors).map(([key, value]) => (
          <div key={key}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">
                {factorLabels[key] || key}
              </span>
              <span className="font-medium">{value}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={cn(
                  "h-2 rounded-full transition-all duration-1000",
                  value >= 80 && "bg-success",
                  value >= 60 && value < 80 && "bg-warning",
                  value < 60 && "bg-destructive"
                )}
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}