import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Home, 
  CheckSquare, 
  Calendar,
  FileText,
  BarChart3,
  Target,
  Clock,
  Timer,
  Settings,
  X
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const location = useLocation();
  const { t } = useTranslation('common');

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (isOpen && onClose) {
      onClose();
    }
  }, [location.pathname, isOpen, onClose]);

  const navItems: NavItem[] = [
    {
      href: '/dashboard',
      label: t('navigation.dashboard'),
      icon: <Home className="h-5 w-5" />
    },
    {
      href: '/todos',
      label: t('navigation.todos'),
      icon: <CheckSquare className="h-5 w-5" />
    },
    {
      href: '/calendar',
      label: t('navigation.calendar'),
      icon: <Calendar className="h-5 w-5" />
    },
    {
      href: '/notes',
      label: t('navigation.notes'),
      icon: <FileText className="h-5 w-5" />
    },
    {
      href: '/moments',
      label: t('navigation.moments'),
      icon: <Clock className="h-5 w-5" />
    },
    {
      href: '/goals',
      label: t('navigation.goals'),
      icon: <Target className="h-5 w-5" />
    },
    {
      href: '/pomodoro',
      label: t('navigation.pomodoro'),
      icon: <Timer className="h-5 w-5" />
    },
    {
      href: '/analytics',
      label: t('navigation.analytics'),
      icon: <BarChart3 className="h-5 w-5" />
    }
  ];

  const bottomNavItems: NavItem[] = [
    {
      href: '/settings',
      label: t('navigation.settings'),
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
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed left-0 top-16 bottom-0 w-64 bg-card border-r border-border z-50
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:block
        `}
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-between p-4 md:hidden">
          <h2 className="text-lg font-semibold">{t('app.menu')}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-foreground hover:bg-muted"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

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
    </>
  );
}