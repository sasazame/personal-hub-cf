import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { registerSchema, RegisterInput, authApi } from '../lib/auth';
import { useState } from 'react';

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterInput) => {
      const { confirmPassword, ...registerData } = data;
      return authApi.register(registerData);
    },
    onSuccess: () => {
      setError(null);
      onSuccess?.();
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || 'Registration failed');
    },
  });

  const onSubmit = (data: RegisterInput) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="register-form">
      <h2>Register</h2>
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
          <label htmlFor="username">Username (optional)</label>
          <input
            id="username"
            type="text"
            {...register('username')}
            placeholder="Choose a username"
          />
          {errors.username && (
            <span className="field-error" style={{ color: 'red', fontSize: '0.875rem' }}>
              {errors.username.message}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="firstName">First Name (optional)</label>
          <input
            id="firstName"
            type="text"
            {...register('firstName')}
            placeholder="Enter your first name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="lastName">Last Name (optional)</label>
          <input
            id="lastName"
            type="text"
            {...register('lastName')}
            placeholder="Enter your last name"
          />
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

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            {...register('confirmPassword')}
            placeholder="Confirm your password"
          />
          {errors.confirmPassword && (
            <span className="field-error" style={{ color: 'red', fontSize: '0.875rem' }}>
              {errors.confirmPassword.message}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={registerMutation.isPending}
          style={{ marginTop: '1rem' }}
        >
          {registerMutation.isPending ? 'Creating account...' : 'Register'}
        </button>
      </form>

      {onSwitchToLogin && (
        <p style={{ marginTop: '1rem' }}>
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            style={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer' }}
          >
            Login here
          </button>
        </p>
      )}
    </div>
  );
}