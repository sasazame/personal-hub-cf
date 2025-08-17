import React, { Suspense, lazy, memo } from 'react';
import { LucideProps } from 'lucide-react';

// Icon loading component
const IconLoader = () => (
  <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
);

// Map of icon names to their lazy imports
const iconMap: Record<string, React.LazyExoticComponent<React.FC<LucideProps>>> = {
  Home: lazy(() => import('lucide-react').then(m => ({ default: m.Home }))),
  CheckSquare: lazy(() => import('lucide-react').then(m => ({ default: m.CheckSquare }))),
  Calendar: lazy(() => import('lucide-react').then(m => ({ default: m.Calendar }))),
  StickyNote: lazy(() => import('lucide-react').then(m => ({ default: m.StickyNote }))),
  Target: lazy(() => import('lucide-react').then(m => ({ default: m.Target }))),
  Heart: lazy(() => import('lucide-react').then(m => ({ default: m.Heart }))),
  Timer: lazy(() => import('lucide-react').then(m => ({ default: m.Timer }))),
  BarChart3: lazy(() => import('lucide-react').then(m => ({ default: m.BarChart3 }))),
  Settings: lazy(() => import('lucide-react').then(m => ({ default: m.Settings }))),
  User: lazy(() => import('lucide-react').then(m => ({ default: m.User }))),
  Plus: lazy(() => import('lucide-react').then(m => ({ default: m.Plus }))),
  Search: lazy(() => import('lucide-react').then(m => ({ default: m.Search }))),
  Moon: lazy(() => import('lucide-react').then(m => ({ default: m.Moon }))),
  Sun: lazy(() => import('lucide-react').then(m => ({ default: m.Sun }))),
  Globe: lazy(() => import('lucide-react').then(m => ({ default: m.Globe }))),
  LogOut: lazy(() => import('lucide-react').then(m => ({ default: m.LogOut }))),
  Command: lazy(() => import('lucide-react').then(m => ({ default: m.Command }))),
};

interface LazyIconProps extends LucideProps {
  name: keyof typeof iconMap;
}

export const LazyIcon = memo(({ name, ...props }: LazyIconProps) => {
  const Icon = iconMap[name];
  
  if (!Icon) {
    console.warn(`Icon "${name}" not found in lazy icon map`);
    return <IconLoader />;
  }
  
  return (
    <Suspense fallback={<IconLoader />}>
      <Icon {...props} />
    </Suspense>
  );
});

LazyIcon.displayName = 'LazyIcon';