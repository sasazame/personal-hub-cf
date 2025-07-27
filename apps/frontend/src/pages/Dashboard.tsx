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
      color: 'bg-blue-500',
      stats: '5 incomplete tasks'
    },
    {
      title: 'Goals',
      description: 'Track your goals and achievements',
      icon: Target,
      href: '/goals',
      color: 'bg-indigo-500',
      stats: '3 active goals'
    },
    {
      title: 'Pomodoro',
      description: 'Boost productivity with time management',
      icon: Timer,
      href: '/pomodoro',
      color: 'bg-red-500',
      stats: '0 sessions today'
    },
    {
      title: 'Calendar',
      description: 'Schedule and manage your events',
      icon: Calendar,
      href: '/calendar',
      color: 'bg-green-500',
      stats: '2 events today'
    },
    {
      title: 'Notes',
      description: 'Create and organize your thoughts',
      icon: FileText,
      href: '/notes',
      color: 'bg-purple-500',
      stats: '12 notes'
    },
    {
      title: 'Analytics',
      description: 'Visualize your productivity',
      icon: BarChart3,
      href: '/analytics',
      color: 'bg-orange-500',
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
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md hover:shadow-lg transition-all"
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
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer group h-full p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center text-white`}>
                        <IconComponent className="w-6 h-6" />
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Today's Events
              </h2>
              <Link to="/calendar" className="text-green-600 hover:text-green-700 text-sm">
                View all →
              </Link>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">No events scheduled for today</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Recent Notes
              </h2>
              <Link to="/notes" className="text-purple-600 hover:text-purple-700 text-sm">
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