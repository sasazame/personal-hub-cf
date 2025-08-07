import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, UserPlus, Mail, Lock, User, Sparkles, ArrowLeft } from 'lucide-react'
import { z } from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from 'react-i18next'

const createRegisterSchema = (t: (key: string) => string) => {
  return z.object({
    username: z.string()
      .min(3, t('auth:register.validation.usernameMinLength'))
      .max(20, t('auth:register.validation.usernameMaxLength')),
    email: z.string().email(t('validation.email')),
    password: z.string()
      .min(8, t('auth:register.validation.passwordMinLength'))
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).*$/,
        t('auth:register.validation.passwordComplexity')
      ),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('auth:register.passwordMismatch'),
    path: ['confirmPassword'],
  })
}

type RegisterFormData = z.infer<ReturnType<typeof createRegisterSchema>>

export function Register() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { t } = useTranslation(['auth', 'common'])
  
  const { register: registerUser, isLoading, isAuthenticated, clearError } = useAuth()
  
  const registerSchema = createRegisterSchema(t)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  // Redirect when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  const onSubmit = async (data: RegisterFormData) => {
    try {
      clearError()
      await registerUser(data.username, data.email, data.password)
      // Don't navigate - let useEffect handle redirect when authenticated
    } catch {
      // Error is already handled by the auth context
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-card to-background">
      {/* Back to Home Link */}
      <Link
        to="/"
        className="absolute top-4 left-4 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
        <span className="text-sm font-medium">Back to Home</span>
      </Link>
      
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
            <h1 className="text-4xl font-bold text-foreground mb-2">{t('auth:register.title')}</h1>
            <p className="text-muted-foreground text-base">
              {t('auth:register.subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('auth:register.username')}</label>
              <div className="relative">
                <input
                  {...register('username')}
                  type="text"
                  placeholder={t('auth:register.usernamePlaceholder')}
                  className="w-full px-4 py-3 pl-12 bg-input backdrop-blur-md border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200"
                  autoComplete="username"
                  disabled={isLoading}
                />
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-destructive">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('auth:register.email')}</label>
              <div className="relative">
                <input
                  {...register('email')}
                  type="email"
                  placeholder={t('auth:register.emailPlaceholder')}
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
              <label className="block text-sm font-medium text-foreground mb-2">{t('auth:register.password')}</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth:register.passwordPlaceholder')}
                  className="w-full px-4 py-3 pl-12 pr-12 bg-input backdrop-blur-md border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200"
                  autoComplete="new-password"
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

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t('auth:register.confirmPassword')}</label>
              <div className="relative">
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder={t('auth:register.confirmPasswordPlaceholder')}
                  className="w-full px-4 py-3 pl-12 pr-12 bg-input backdrop-blur-md border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200"
                  autoComplete="new-password"
                  disabled={isLoading}
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="text-xs text-muted-foreground text-center">
              {t('auth:register.agreeToTerms')}{' '}
              <Link to="/terms" className="text-primary hover:text-primary/80">{t('auth:register.termsOfService')}</Link>{' '}
              <Link to="/privacy" className="text-primary hover:text-primary/80">{t('auth:register.privacyPolicy')}</Link>
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
                  <UserPlus className="h-5 w-5" />
                  {t('auth:register.submit')}
                </>
              )}
            </button>

            <div className="text-center text-sm text-muted-foreground">
              {t('auth:register.haveAccount')}{' '}
              <Link
                to="/login"
                className="text-primary hover:text-primary/80 transition-colors font-medium"
              >
                {t('auth:register.signIn')}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}