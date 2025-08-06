import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout';
import { Link } from 'react-router-dom';
import { 
  CheckSquare, 
  Calendar, 
  FileText, 
  BarChart3,
  Plus,
  ArrowRight,
  Target,
  Timer
} from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();
  
  const features = [
    {
      title: 'TODOs',
      description: 'Manage your tasks and stay organized',
      icon: CheckSquare,
      href: '/todos',
      gradient: 'from-blue-500 to-cyan-500',
      stats: '5 incomplete tasks'
    },
    {
      title: 'Goals',
      description: 'Track your goals and achievements',
      icon: Target,
      href: '/goals',
      gradient: 'from-green-500 to-emerald-500',
      stats: '3 active goals'
    },
    {
      title: 'Pomodoro',
      description: 'Boost productivity with time management',
      icon: Timer,
      href: '/pomodoro',
      gradient: 'from-indigo-500 to-purple-500',
      stats: '0 sessions today'
    },
    {
      title: 'Calendar',
      description: 'Schedule and manage your events',
      icon: Calendar,
      href: '/calendar',
      gradient: 'from-purple-500 to-pink-500',
      stats: '2 events today'
    },
    {
      title: 'Notes',
      description: 'Create and organize your thoughts',
      icon: FileText,
      href: '/notes',
      gradient: 'from-orange-500 to-red-500',
      stats: '12 notes'
    },
    {
      title: 'Analytics',
      description: 'Visualize your productivity',
      icon: BarChart3,
      href: '/analytics',
      gradient: 'from-teal-500 to-cyan-500',
      stats: '85% completion rate'
    }
  ];

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.username}!
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Your personal productivity hub for managing tasks, goals, and time effectively
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex justify-center">
          <Link 
            to="/todos"
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-medium rounded-lg hover:from-primary/90 hover:to-primary/70 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            New TODO
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
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
          <div className="bg-card rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Today's Events
              </h2>
              <Link to="/calendar" className="text-success hover:text-success/80 text-sm">
                View all →
              </Link>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">No events scheduled for today</p>
          </div>

          <div className="bg-card rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Recent Notes
              </h2>
              <Link to="/notes" className="text-primary hover:text-primary/80 text-sm">
                View all →
              </Link>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">No recent notes</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}