import { useState, useMemo, Suspense } from 'react';
import { AppLayout } from '@/components/layout';
import {
  StatsCard,
  ProductivityChart,
  CategoryBreakdown,
  ProductivityScore,
  ActivityHeatmap,
} from '@/components/analytics/lazy';
import { useAnalytics, useProductivityScore, useStreaks } from '@/hooks/useAnalytics';
import { CheckCircle, Clock, Calendar, Activity, Zap } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { cn } from '@/lib/cn';

type Period = 'week' | 'month' | 'year';

export function Analytics() {
  const [period, setPeriod] = useState<Period>('week');
  const { data: analytics, isLoading } = useAnalytics(period);
  const { data: productivityData } = useProductivityScore();
  const { data: streaks } = useStreaks();

  const taskCompletionData = useMemo(
    () => ({
      labels:
        analytics?.taskCompletionTrend?.map((item) => format(new Date(item.date), 'MM/dd')) || [],
      datasets: [
        {
          label: 'タスク完了率',
          data:
            analytics?.taskCompletionTrend?.map((item) =>
              item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0
            ) || [],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
        },
      ],
    }),
    [analytics?.taskCompletionTrend]
  );

  const pomodoroData = useMemo(
    () => ({
      labels: analytics?.pomodoroTrend?.map((item) => format(new Date(item.date), 'MM/dd')) || [],
      datasets: [
        {
          label: 'セッション数',
          data: analytics?.pomodoroTrend?.map((item) => item.sessions) || [],
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
        },
      ],
    }),
    [analytics?.pomodoroTrend]
  );

  // Generate heatmap data for the last 90 days
  const { heatmapData, heatmapStartDate, heatmapEndDate } = useMemo(() => {
    const endDate = new Date();
    const startDate = subDays(endDate, 89);

    const data = Array.from({ length: 90 }, (_, i) => {
      const date = format(subDays(endDate, 89 - i), 'yyyy-MM-dd');
      const trend = analytics?.taskCompletionTrend?.find((item) => item.date === date);
      return {
        date,
        value: trend ? trend.completed : 0,
      };
    });

    return {
      heatmapData: data,
      heatmapStartDate: startDate,
      heatmapEndDate: endDate,
    };
  }, [analytics?.taskCompletionTrend]);

  if (isLoading || !analytics) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="h-12 w-12 mx-auto mb-4 animate-pulse" />
            <p>分析データを読み込み中...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Activity className="h-8 w-8" />
              分析ダッシュボード
            </h1>

            {/* Period Selector */}
            <div className="flex gap-2">
              {(['week', 'month', 'year'] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    period === p
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                  )}
                >
                  {p === 'week' && '週間'}
                  {p === 'month' && '月間'}
                  {p === 'year' && '年間'}
                </button>
              ))}
            </div>
          </div>
          <p className="text-muted-foreground">生産性を可視化し、改善のヒントを見つけましょう</p>
        </div>

        {/* Stats Cards */}
        <Suspense
          fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-card rounded-lg p-6 shadow-sm animate-pulse">
                  <div className="h-20 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="完了タスク"
              value={analytics.stats.completedTasks}
              change={15}
              changeLabel="前期間比"
              icon={<CheckCircle className="w-6 h-6" />}
              color="green"
            />
            <StatsCard
              title="ポモドーロセッション"
              value={analytics.stats.totalPomodoros}
              change={8}
              changeLabel="前期間比"
              icon={<Clock className="w-6 h-6" />}
              color="blue"
            />
            <StatsCard
              title="集中時間"
              value={`${Math.floor(analytics.stats.totalFocusTime / 60)}h`}
              change={-5}
              changeLabel="前期間比"
              icon={<Zap className="w-6 h-6" />}
              color="purple"
            />
            <StatsCard
              title="連続記録"
              value={`${streaks?.currentStreak || 0}日`}
              icon={<Calendar className="w-6 h-6" />}
              color="orange"
            />
          </div>
        </Suspense>

        {/* Charts Row */}
        <Suspense
          fallback={
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-card rounded-lg p-6 shadow-sm animate-pulse">
                <div className="h-64 bg-muted rounded"></div>
              </div>
              <div className="bg-card rounded-lg p-6 shadow-sm animate-pulse">
                <div className="h-64 bg-muted rounded"></div>
              </div>
            </div>
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ProductivityChart data={taskCompletionData} title="タスク完了率の推移" />
            </div>
            <div>
              {productivityData && (
                <ProductivityScore
                  score={productivityData.score}
                  factors={productivityData.factors}
                />
              )}
            </div>
          </div>
        </Suspense>

        {/* Second Charts Row */}
        <Suspense
          fallback={
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-card rounded-lg p-6 shadow-sm animate-pulse">
                  <div className="h-64 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CategoryBreakdown data={analytics.categoryBreakdown} />
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">ポモドーロセッション</h3>
              <div style={{ height: 300 }}>
                <ProductivityChart data={pomodoroData} title="" height={260} />
              </div>
            </div>
          </div>
        </Suspense>

        {/* Activity Heatmap */}
        <Suspense
          fallback={
            <div className="bg-card rounded-lg p-6 shadow-sm animate-pulse">
              <div className="h-40 bg-muted rounded"></div>
            </div>
          }
        >
          <ActivityHeatmap
            data={heatmapData}
            startDate={heatmapStartDate}
            endDate={heatmapEndDate}
          />
        </Suspense>

        {/* Goals Progress */}
        <div className="bg-card rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">目標進捗</h3>
          <div className="space-y-4">
            {analytics.goalProgress.map((goal) => (
              <div key={goal.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{goal.title}</span>
                  <span className="text-sm text-muted-foreground">
                    {goal.progress}/{goal.target}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={cn('h-2 rounded-full transition-all duration-500', 'bg-primary')}
                    style={{ width: `${Math.min(100, (goal.progress / goal.target) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
