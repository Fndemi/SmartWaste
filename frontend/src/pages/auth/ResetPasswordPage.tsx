import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Navbar } from '../../components/layout/Navbar';
import { apiService } from '../../services/api';
import { type ResetPasswordRequest } from '../../types';
import toast from 'react-hot-toast';

const resetPasswordSchema = yup.object({
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

type ResetPasswordFormData = {
  password: string;
  confirmPassword: string;
};

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetStatus, setResetStatus] = useState<'loading' | 'valid' | 'invalid' | 'success'>('loading');
  const [token, setToken] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: yupResolver(resetPasswordSchema),
  });

  useEffect(() => {
    const resetToken = searchParams.get('token');
    if (!resetToken) {
      setResetStatus('invalid');
      return;
    }
    
    setToken(resetToken);
    // For now, assume token is valid. In a real app, you might want to validate the token first
    setResetStatus('valid');
  }, [searchParams]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast.error('Invalid reset token');
      return;
    }

    setIsLoading(true);
    try {
      const resetData: ResetPasswordRequest = {
        token,
        password: data.password,
      };
      
      await apiService.resetPassword(resetData);
      setResetStatus('success');
      toast.success('Password reset successfully!');
    } catch (error: any) {
      console.error('Reset password error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to reset password';
      
      if (errorMessage.includes('expired') || errorMessage.includes('invalid')) {
        setResetStatus('invalid');
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    navigate('/login', {
      state: {
        message: 'Password reset successfully! You can now log in with your new password.'
      }
    });
  };

  // Loading state
  if (resetStatus === 'loading') {
    return (
      <div className="min-h-screen flex flex-col bg-ink-50 dark:bg-ink-900">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8 text-center">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
              <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
            </div>
            <h2 className="text-3xl font-extrabold text-ink-900 dark:text-ink-100">
              Validating Reset Link
            </h2>
            <p className="text-ink-600 dark:text-ink-400">
              Please wait while we validate your password reset link...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (resetStatus === 'invalid') {
    return (
      <div className="min-h-screen flex flex-col bg-ink-50 dark:bg-ink-900">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              {/* Error Icon */}
              <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 mb-6">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>

              {/* Title */}
              <h2 className="text-3xl font-extrabold text-ink-900 dark:text-ink-100 mb-4">
                Invalid Reset Link
              </h2>

              {/* Error Message */}
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-700 mb-6">
                <p className="text-red-800 dark:text-red-200">
                  This password reset link is invalid or has expired. Reset links are only valid for 1 hour.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <Link to="/forgot-password" className="block">
                <Button variant="primary" className="w-full">
                  Request New Reset Link
                </Button>
              </Link>

              <Link to="/login" className="block">
                <Button variant="outline" className="w-full">
                  Back to Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (resetStatus === 'success') {
    return (
      <div className="min-h-screen flex flex-col bg-ink-50 dark:bg-ink-900">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              {/* Success Icon */}
              <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20 mb-6">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>

              {/* Title */}
              <h2 className="text-3xl font-extrabold text-ink-900 dark:text-ink-100 mb-4">
                Password Reset Successfully!
              </h2>

              {/* Description */}
              <p className="text-lg text-ink-700 dark:text-ink-300 mb-6">
                Your password has been updated. You can now log in with your new password.
              </p>
            </div>

            {/* Success Message */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-700">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-green-800 dark:text-green-200">
                  <p className="font-medium mb-2">Password Updated</p>
                  <p>Your account is now secure with your new password. You can log in immediately.</p>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="space-y-4">
              <Button
                onClick={handleLoginRedirect}
                variant="primary"
                className="w-full"
              >
                Continue to Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Reset password form
  return (
    <div className="min-h-screen flex flex-col bg-ink-50 dark:bg-ink-900">
      <Navbar />
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900">
              <Lock className="h-6 w-6 text-brand-600 dark:text-brand-400" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-ink-900 dark:text-ink-100">
              Reset Your Password
            </h2>
            <p className="mt-2 text-center text-sm text-ink-700 dark:text-ink-300">
              Enter your new password below
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div className="relative">
                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  label="New Password"
                  placeholder="Enter your new password"
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

              <div className="relative">
                <Input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  label="Confirm New Password"
                  placeholder="Confirm your new password"
                  error={errors.confirmPassword?.message}
                  className="pl-10 pr-10"
                />
                <Lock className="absolute left-3 top-8 h-5 w-5 text-ink-400" />
                <button
                  type="button"
                  className="absolute right-3 top-8 h-5 w-5 text-ink-400 hover:text-ink-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              loading={isLoading}
              disabled={isLoading}
            >
              Reset Password
            </Button>
          </form>

          {/* Password Requirements */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p className="font-medium mb-2">Password Requirements:</p>
              <ul className="space-y-1 list-disc list-inside ml-2">
                <li>At least 6 characters long</li>
                <li>Should be unique and not easily guessable</li>
                <li>Consider using a mix of letters, numbers, and symbols</li>
              </ul>
            </div>
          </div>

          {/* Back to Login */}
          <div className="text-center">
            <Link
              to="/login"
              className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-500 dark:hover:text-brand-300"
            >
              Remember your password? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
