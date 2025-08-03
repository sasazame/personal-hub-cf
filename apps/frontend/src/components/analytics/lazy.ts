import { lazy } from 'react';

// Lazy load all analytics components to reduce initial bundle size
export const StatsCard = lazy(() => import('./StatsCard').then(m => ({ default: m.StatsCard })));
export const ProductivityChart = lazy(() => import('./ProductivityChart').then(m => ({ default: m.ProductivityChart })));
export const CategoryBreakdown = lazy(() => import('./CategoryBreakdown').then(m => ({ default: m.CategoryBreakdown })));
export const ProductivityScore = lazy(() => import('./ProductivityScore').then(m => ({ default: m.ProductivityScore })));
export const ActivityHeatmap = lazy(() => import('./ActivityHeatmap').then(m => ({ default: m.ActivityHeatmap })));