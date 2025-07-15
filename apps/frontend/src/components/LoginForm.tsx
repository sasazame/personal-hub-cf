import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { loginSchema, LoginInput, authApi } from '../lib/auth';
import { useState } from 'react';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: () => {
      setError(null);
      onSuccess?.();
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || 'Login failed');
    },
  });

  const onSubmit = (data: LoginInput) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="login-form">
      <h2>Login</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        {error && (
          <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
            {error}
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            {...register('email')}
            placeholder="Enter your email"
          />
          {errors.email && (
            <span className="field-error" style={{ color: 'red', fontSize: '0.875rem' }}>
              {errors.email.message}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            {...register('password')}
            placeholder="Enter your password"
          />
          {errors.password && (
            <span className="field-error" style={{ color: 'red', fontSize: '0.875rem' }}>
              {errors.password.message}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={loginMutation.isPending}
          style={{ marginTop: '1rem' }}
        >
          {loginMutation.isPending ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {onSwitchToRegister && (
        <p style={{ marginTop: '1rem' }}>
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            style={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer' }}
          >
            Register here
          </button>
        </p>
      )}
    </div>
  );
}