import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, LogIn, CheckCircle, Mail, Lock, Sparkles } from 'lucide-react'
import { z } from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from 'react-i18next'

const createLoginSchema = (t: (key: string) => string) => z.object({
  email: z.string().email(t('validation.email')),
  password: z.string().min(1, t('validation.required')),
})

type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>

export function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const { t } = useTranslation(['auth', 'common'])
  
  const { login, isLoading, isAuthenticated, clearError } = useAuth()

  const loginSchema = createLoginSchema(t)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  useEffect(() => {
    // Check for registration success message
    if (searchParams.get('registered') === 'true') {
      setSuccessMessage(t('auth:register.success') + ' ' + t('auth:login.subtitle'))
    }
  }, [searchParams])

  // Redirect when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const redirectParam = searchParams.get('redirect')
      const redirectTo = redirectParam ? decodeURIComponent(redirectParam) : '/dashboard'
      navigate(redirectTo)
    }
  }, [isAuthenticated, navigate, searchParams])

  const onSubmit = async (data: LoginFormData) => {
    try {
      clearError()
      await login(data.email, data.password)
    } catch {
      // Error is already handled by the auth context
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-card to-background">
      {/* Premium Glass Card */}
      <div className="w-full max-w-md">
        <div className="bg-card backdrop-blur-2xl border border-border rounded-3xl p-10 shadow-2xl">
          {/* Brand Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center justify-center w-20 h-20 bg-primary rounded-3xl">
                <Sparkles className="h-10 w-10 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-2">{t('auth:login.title')}</h1>
            <p className="text-muted-foreground text-base">
              {t('auth:login.subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {successMessage && (
              <div className="p-4 text-sm text-success-foreground bg-success/20 border border-success/30 rounded-xl flex items-center gap-2 backdrop-blur-sm">
                <CheckCircle className="h-4 w-4" />
                {successMessage}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('auth:login.email')}</label>
              <div className="relative">
                <input
                  {...register('email')}
                  type="email"
                  placeholder={t('auth:login.emailPlaceholder')}
                  className="w-full px-4 py-3 pl-12 bg-input backdrop-blur-md border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200"
                  autoComplete="email"
                  disabled={isLoading}
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('auth:login.password')}</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth:login.passwordPlaceholder')}
                  className="w-full px-4 py-3 pl-12 pr-12 bg-input backdrop-blur-md border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200"
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="text-sm">
              <Link
                to="/forgot-password"
                className="text-primary hover:text-primary/80 transition-colors"
              >
                {t('auth:login.forgotPassword')}
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  {t('auth:login.submit')}
                </>
              )}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-transparent px-2 text-muted-foreground">{t('auth:login.orContinueWith')}</span>
              </div>
            </div>

            <button
              type="button"
              className="w-full bg-secondary hover:bg-secondary/80 border border-border text-secondary-foreground font-semibold py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t('auth:login.orContinueWith')} Google
            </button>

            <div className="text-center text-sm text-muted-foreground mt-6">
              {t('auth:login.noAccount')}{' '}
              <Link
                to="/register"
                className="text-primary hover:text-primary/80 transition-colors font-medium"
              >
                {t('auth:login.signUp')}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}