import { useAuth } from '@/contexts/AuthContext';
import { useFeatures } from '@/contexts/FeatureContext';
import { AppLayout } from '@/components/layout';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  CheckSquare, 
  Calendar, 
  FileText, 
  BarChart3,
  Plus,
  ArrowRight,
  Target,
  Timer,
  Clock
} from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();
  const { features: featurePreferences, loading } = useFeatures();
  const { t } = useTranslation('common');
  
  const allFeatures = [
    {
      key: 'todos' as const,
      title: t('dashboard.cards.todos.title'),
      description: t('dashboard.cards.todos.description'),
      icon: CheckSquare,
      href: '/todos',
      gradient: 'from-blue-500 to-cyan-500',
      stats: t('dashboard.cards.todos.stats', { count: 5 })
    },
    {
      key: 'goals' as const,
      title: t('dashboard.cards.goals.title'),
      description: t('dashboard.cards.goals.description'),
      icon: Target,
      href: '/goals',
      gradient: 'from-green-500 to-emerald-500',
      stats: t('dashboard.cards.goals.stats', { count: 3 })
    },
    {
      key: 'pomodoro' as const,
      title: t('dashboard.cards.pomodoro.title'),
      description: t('dashboard.cards.pomodoro.description'),
      icon: Timer,
      href: '/pomodoro',
      gradient: 'from-indigo-500 to-purple-500',
      stats: t('dashboard.cards.pomodoro.stats', { count: 0 })
    },
    {
      key: 'calendar' as const,
      title: t('dashboard.cards.calendar.title'),
      description: t('dashboard.cards.calendar.description'),
      icon: Calendar,
      href: '/calendar',
      gradient: 'from-purple-500 to-pink-500',
      stats: t('dashboard.cards.calendar.stats', { count: 2 })
    },
    {
      key: 'notes' as const,
      title: t('dashboard.cards.notes.title'),
      description: t('dashboard.cards.notes.description'),
      icon: FileText,
      href: '/notes',
      gradient: 'from-orange-500 to-red-500',
      stats: t('dashboard.cards.notes.stats', { count: 12 })
    },
    {
      key: 'moments' as const,
      title: t('dashboard.cards.moments.title'),
      description: t('dashboard.cards.moments.description'),
      icon: Clock,
      href: '/moments',
      gradient: 'from-yellow-500 to-amber-500',
      stats: t('dashboard.cards.moments.stats', { count: 0 })
    },
    {
      key: 'analytics' as const,
      title: t('dashboard.cards.analytics.title'),
      description: t('dashboard.cards.analytics.description'),
      icon: BarChart3,
      href: '/analytics',
      gradient: 'from-teal-500 to-cyan-500',
      stats: t('dashboard.cards.analytics.stats', { rate: 85 })
    }
  ];

  // Filter features based on user preferences
  const enabledFeatures = allFeatures.filter(
    feature => featurePreferences[feature.key] !== false
  );

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="sr-only">{t('messages.loading')}</span>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            {t('dashboard.welcome', { username: user?.username })}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {t('dashboard.subtitle')}
          </p>
        </div>

        {/* Quick Actions */}
        {featurePreferences.todos && (
          <div className="flex justify-center">
            <Link 
              to="/todos"
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-medium rounded-lg hover:from-primary/90 hover:to-primary/70 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              {t('dashboard.quickActions.newTodo')}
            </Link>
          </div>
        )}

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enabledFeatures.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <Link key={feature.title} to={feature.href}>
                <div className="bg-card rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer group h-full p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.gradient} flex items-center justify-center`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300 transition-colors" />
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {feature.description}
                      </p>
                    </div>
                    
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {feature.stats}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {featurePreferences.calendar && (
            <div className="bg-card rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t('dashboard.sections.todaysEvents')}
                </h2>
                <Link to="/calendar" className="text-success hover:text-success/80 text-sm">
                  {t('messages.viewAll')}
                </Link>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{t('dashboard.sections.noEvents')}</p>
            </div>
          )}

          {featurePreferences.notes && (
            <div className="bg-card rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t('dashboard.sections.recentNotes')}
                </h2>
                <Link to="/notes" className="text-primary hover:text-primary/80 text-sm">
                  {t('messages.viewAll')}
                </Link>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{t('dashboard.sections.noNotes')}</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}