import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { type LoginRequest } from '../../types';
import { Navbar } from '../../components/layout/Navbar';

const loginSchema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({
    resolver: yupResolver(loginSchema),
  });

  const onSubmit = async (data: LoginRequest) => {
    try {
      await login(data);
      navigate('/dashboard');
    } catch {
      // Error is handled in the auth context
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-ink-50 dark:bg-ink-900">
      <Navbar />
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-brand-100">
              <svg className="h-6 w-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-ink-900">
              Sign in to your account
            </h2>
            <p className="mt-2 text-center text-sm text-ink-700">
              Or{' '}
              <Link
                to="/register"
                className="font-medium text-brand-600 hover:text-brand-500"
              >
                create a new account
              </Link>
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div className="relative">
                <Input
                  {...register('email')}
                  type="email"
                  label="Email address"
                  placeholder="Enter your email"
                  error={errors.email?.message}
                  className="pl-10"
                />
                <Mail className="absolute left-3 top-8 h-5 w-5 text-ink-400" />
              </div>

              <div className="relative">
                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  label="Password"
                  placeholder="Enter your password"
                  error={errors.password?.message}
                  className="pl-10 pr-10"
                />
                <Lock className="absolute left-3 top-8 h-5 w-5 text-ink-400" />
                <button
                  type="button"
                  className="absolute right-3 top-8 h-5 w-5 text-ink-400 hover:text-ink-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-brand-600 hover:text-brand-500"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              loading={isLoading}
              disabled={isLoading}
            >
              Sign in
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-ink-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-ink-50 text-ink-500">Demo Accounts</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <div className="text-xs text-ink-700 space-y-1">
                <p><strong>Household:</strong> household@demo.com / password123</p>
                <p><strong>Driver:</strong> driver@demo.com / password123</p>
                <p><strong>Admin:</strong> admin@demo.com / password123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
