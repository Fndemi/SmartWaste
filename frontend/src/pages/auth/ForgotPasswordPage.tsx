import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Navbar } from '../../components/layout/Navbar';
import { apiService } from '../../services/api';
import { type ForgotPasswordRequest } from '../../types';
import toast from 'react-hot-toast';

const forgotPasswordSchema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
});

export function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordRequest>({
    resolver: yupResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordRequest) => {
    setIsLoading(true);
    try {
      await apiService.forgotPassword(data);
      setSubmittedEmail(data.email);
      setEmailSent(true);
      toast.success('Password reset instructions sent to your email!');
    } catch (error: any) {
      console.error('Forgot password error:', error);
      // Even on error, we show success message for security reasons
      setSubmittedEmail(data.email);
      setEmailSent(true);
      toast.success('Password reset instructions sent to your email!');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
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
                Check Your Email
              </h2>

              {/* Description */}
              <div className="space-y-4">
                <p className="text-lg text-ink-700 dark:text-ink-300">
                  We've sent password reset instructions to:
                </p>
                
                <div className="bg-white dark:bg-ink-800 rounded-lg p-4 border border-ink-200 dark:border-ink-700">
                  <p className="font-semibold text-brand-600 dark:text-brand-400 break-all">
                    {submittedEmail}
                  </p>
                </div>

                <p className="text-ink-600 dark:text-ink-400">
                  Please check your email and follow the instructions to reset your password.
                </p>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-2">What to do next:</p>
                <ul className="space-y-1 list-disc list-inside ml-2">
                  <li>Check your email inbox (including spam folder)</li>
                  <li>Click the reset password link in the email</li>
                  <li>Create a new password</li>
                  <li>The reset link expires in 1 hour</li>
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <Link to="/login" className="block">
                <Button variant="primary" className="w-full flex items-center justify-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Login</span>
                </Button>
              </Link>

              <button
                onClick={() => {
                  setEmailSent(false);
                  setSubmittedEmail('');
                }}
                className="w-full text-center text-sm text-ink-600 dark:text-ink-400 hover:text-ink-800 dark:hover:text-ink-200"
              >
                Try a different email address
              </button>
            </div>

            {/* Help Text */}
            <div className="text-center">
              <p className="text-sm text-ink-600 dark:text-ink-400">
                Didn't receive the email?{' '}
                <a
                  href="mailto:support@wastevortex.com"
                  className="font-medium text-brand-600 dark:text-brand-400 hover:text-brand-500 dark:hover:text-brand-300"
                >
                  Contact Support
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-ink-50 dark:bg-ink-900">
      <Navbar />
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900">
              <Mail className="h-6 w-6 text-brand-600 dark:text-brand-400" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-ink-900 dark:text-ink-100">
              Forgot your password?
            </h2>
            <p className="mt-2 text-center text-sm text-ink-700 dark:text-ink-300">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div className="relative">
                <Input
                  {...register('email')}
                  type="email"
                  label="Email address"
                  placeholder="Enter your email address"
                  error={errors.email?.message}
                  className="pl-10"
                />
                <Mail className="absolute left-3 top-8 h-5 w-5 text-ink-400" />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              loading={isLoading}
              disabled={isLoading}
            >
              Send Reset Instructions
            </Button>
          </form>

          {/* Back to Login */}
          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center space-x-2 text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-500 dark:hover:text-brand-300"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Login</span>
            </Link>
          </div>

          {/* Help Section */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p className="font-medium mb-2">Need help?</p>
              <ul className="space-y-1 list-disc list-inside ml-2">
                <li>Make sure you enter the email address you used to register</li>
                <li>Check your spam/junk folder for the reset email</li>
                <li>The reset link will expire after 1 hour</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
