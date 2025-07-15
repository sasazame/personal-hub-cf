import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function AuthenticatedApp() {
  const { user, logout } = useAuth();

  return (
    <div>
      <h1>Welcome to Personal Hub</h1>
      <p>Hello, {user?.firstName || user?.username || user?.email}!</p>
      <button onClick={logout}>Logout</button>
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
    <div className="auth-container">
      <h1>Personal Hub</h1>
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
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
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