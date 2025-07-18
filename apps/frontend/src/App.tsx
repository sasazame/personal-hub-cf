import { useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { TodoList } from './components/TodoList';
import { GoalList } from './components/GoalList';
import { EventList } from './components/EventList';
import { NoteList } from './components/NoteList';
import { MomentList } from './components/MomentList';
import { Button } from '@personal-hub/ui';
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
  const [activeTab, setActiveTab] = useState<'todos' | 'goals' | 'events' | 'notes' | 'moments'>('todos');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'todos':
        return <TodoList />;
      case 'goals':
        return <GoalList />;
      case 'events':
        return <EventList />;
      case 'notes':
        return <NoteList />;
      case 'moments':
        return <MomentList />;
      default:
        return <TodoList />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Personal Hub</h1>
          <Button onClick={logout} variant="outline">Logout</Button>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 border-b">
          <nav className="flex gap-4">
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