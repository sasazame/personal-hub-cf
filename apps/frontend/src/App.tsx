import { useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { TodoList } from './components/TodoList';
import { GoalList } from './components/GoalList';
import { EventList } from './components/EventList';
import EventCalendar from './components/EventCalendar';
import { NoteList } from './components/NoteList';
import { MomentList } from './components/MomentList';
import { PomodoroTimer } from './components/PomodoroTimer';
import { PomodoroStats } from './components/PomodoroStats';
import { Dashboard } from './components/Dashboard';
import { SearchPage } from './components/SearchPage';
import { Button } from '@personal-hub/ui';
import { Search } from 'lucide-react';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function AuthenticatedApp() {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'todos' | 'goals' | 'events' | 'notes' | 'moments' | 'pomodoro' | 'search'>('dashboard');
  const [eventsViewMode, setEventsViewMode] = useState<'list' | 'calendar'>('list');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'todos':
        return <TodoList />;
      case 'goals':
        return <GoalList />;
      case 'events':
        return eventsViewMode === 'calendar' ? 
          <EventCalendar onViewChange={() => setEventsViewMode('list')} /> : 
          <EventList onViewChange={() => setEventsViewMode('calendar')} />;
      case 'notes':
        return <NoteList />;
      case 'moments':
        return <MomentList />;
      case 'pomodoro':
        return (
          <div className="space-y-6">
            <PomodoroTimer />
            <PomodoroStats />
          </div>
        );
      case 'search':
        return <SearchPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Personal Hub</h1>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setActiveTab('search')}
              variant="ghost"
              size="icon"
              className={activeTab === 'search' ? 'bg-accent' : ''}
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button onClick={logout} variant="outline">Logout</Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 border-b">
          <nav className="flex gap-4">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`pb-2 px-1 font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('todos')}
              className={`pb-2 px-1 font-medium transition-colors ${
                activeTab === 'todos'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setActiveTab('goals')}
              className={`pb-2 px-1 font-medium transition-colors ${
                activeTab === 'goals'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Goals
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`pb-2 px-1 font-medium transition-colors ${
                activeTab === 'events'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Events
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`pb-2 px-1 font-medium transition-colors ${
                activeTab === 'notes'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Notes
            </button>
            <button
              onClick={() => setActiveTab('moments')}
              className={`pb-2 px-1 font-medium transition-colors ${
                activeTab === 'moments'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Moments
            </button>
            <button
              onClick={() => setActiveTab('pomodoro')}
              className={`pb-2 px-1 font-medium transition-colors ${
                activeTab === 'pomodoro'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Pomodoro
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`pb-2 px-1 font-medium transition-colors ${
                activeTab === 'search'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Search
            </button>
          </nav>
        </div>
        {renderTabContent()}
      </main>
    </div>
  );
}

function UnauthenticatedApp() {
  const [showRegister, setShowRegister] = useState(false);
  const queryClient = useQueryClient();

  const handleAuthSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Personal Hub</h1>
          <p className="text-muted-foreground mt-2">
            {showRegister ? 'Create your account' : 'Sign in to your account'}
          </p>
        </div>
        {showRegister ? (
          <RegisterForm
            onSuccess={handleAuthSuccess}
            onSwitchToLogin={() => setShowRegister(false)}
          />
        ) : (
          <LoginForm
            onSuccess={handleAuthSuccess}
            onSwitchToRegister={() => setShowRegister(true)}
          />
        )}
      </div>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return isAuthenticated ? <AuthenticatedApp /> : <UnauthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;