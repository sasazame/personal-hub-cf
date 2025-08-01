import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  CheckSquare, 
  Calendar,
  FileText,
  BarChart3,
  Target,
  Clock,
  Timer,
  Settings
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export function Sidebar() {
  const location = useLocation();

  const navItems: NavItem[] = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: <Home className="h-5 w-5" />
    },
    {
      href: '/todos',
      label: 'TODOs',
      icon: <CheckSquare className="h-5 w-5" />
    },
    {
      href: '/calendar',
      label: 'Calendar',
      icon: <Calendar className="h-5 w-5" />
    },
    {
      href: '/notes',
      label: 'Notes',
      icon: <FileText className="h-5 w-5" />
    },
    {
      href: '/moments',
      label: 'Moments',
      icon: <Clock className="h-5 w-5" />
    },
    {
      href: '/goals',
      label: 'Goals',
      icon: <Target className="h-5 w-5" />
    },
    {
      href: '/pomodoro',
      label: 'Pomodoro',
      icon: <Timer className="h-5 w-5" />
    },
    {
      href: '/analytics',
      label: 'Analytics',
      icon: <BarChart3 className="h-5 w-5" />
    }
  ];

  const bottomNavItems: NavItem[] = [
    {
      href: '/settings',
      label: 'Settings',
      icon: <Settings className="h-5 w-5" />
    }
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard' && location.pathname === '/') {
      return true;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-card border-r border-border hidden md:block">
      <nav className="flex flex-col h-full">
        {/* Main Navigation */}
        <div className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${isActive(item.href)
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground hover:bg-muted'
                }
              `}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Bottom Navigation */}
        <div className="px-3 py-4 border-t border-border">
          {bottomNavItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${isActive(item.href)
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground hover:bg-muted'
                }
              `}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </aside>
  );
}