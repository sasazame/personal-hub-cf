import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { FeatureProvider } from './contexts/FeatureContext'
import { CommandPaletteProvider } from './contexts/CommandPaletteContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { PublicRoute } from './components/PublicRoute'
import { CommandPalette } from './components/CommandPalette'
import { useCommandRegistration } from './hooks/useCommandRegistration'
import { I18nextProvider, useTranslation } from 'react-i18next'
import i18n from './i18n/config'

// Lazy load all pages for better performance
const Landing = lazy(() => import('./pages/Landing').then(m => ({ default: m.Landing })))
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })))
const Register = lazy(() => import('./pages/Register').then(m => ({ default: m.Register })))
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })))
const Terms = lazy(() => import('./pages/Terms').then(m => ({ default: m.Terms })))
const Privacy = lazy(() => import('./pages/Privacy').then(m => ({ default: m.Privacy })))
const Todos = lazy(() => import('./pages/Todos').then(m => ({ default: m.Todos })))
const Calendar = lazy(() => import('./pages/Calendar').then(m => ({ default: m.Calendar })))
const Notes = lazy(() => import('./pages/Notes').then(m => ({ default: m.Notes })))
const Goals = lazy(() => import('./pages/Goals').then(m => ({ default: m.Goals })))
const Moments = lazy(() => import('./pages/Moments').then(m => ({ default: m.Moments })))
const Pomodoro = lazy(() => import('./pages/Pomodoro').then(m => ({ default: m.Pomodoro })))
const Analytics = lazy(() => import('./pages/Analytics').then(m => ({ default: m.Analytics })))
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })))
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Loading component for Suspense fallback
const PageLoader = () => {
  const { t } = useTranslation('common')
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-lg text-muted-foreground">{t('app.loading')}</div>
    </div>
  )
}

// Component to setup command palette
const CommandPaletteSetup = ({ children }: { children: React.ReactNode }) => {
  useCommandRegistration()
  return (
    <>
      {children}
      <CommandPalette />
    </>
  )
}

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <Router>
            <AuthProvider>
              <FeatureProvider>
                <CommandPaletteProvider>
                  <CommandPaletteSetup>
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/todos"
              element={
                <ProtectedRoute>
                  <Todos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <Calendar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notes"
              element={
                <ProtectedRoute>
                  <Notes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/goals"
              element={
                <ProtectedRoute>
                  <Goals />
                </ProtectedRoute>
              }
            />
            <Route
              path="/moments"
              element={
                <ProtectedRoute>
                  <Moments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pomodoro"
              element={
                <ProtectedRoute>
                  <Pomodoro />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/" 
              element={
                <PublicRoute>
                  <Landing />
                </PublicRoute>
              }
            />
                      </Routes>
                    </Suspense>
                    <Toaster position="top-right" />
                  </CommandPaletteSetup>
                </CommandPaletteProvider>
              </FeatureProvider>
            </AuthProvider>
          </Router>
        </ThemeProvider>
      </QueryClientProvider>
    </I18nextProvider>
  )
}

export default App