import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mail, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Navbar } from '../../components/layout/Navbar';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';

export function EmailVerificationSentPage() {
  const location = useLocation();
  const [email, setEmail] = useState<string>('');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    // Get email from navigation state if available
    const stateEmail = location.state?.email;
    if (stateEmail) {
      setEmail(stateEmail);
    }
  }, [location.state]);

  const handleResendEmail = async () => {
    if (!email.trim()) {
      toast.error('Email address is required');
      return;
    }

    setIsResending(true);
    try {
      await apiService.resendVerification(email.trim());
      toast.success('Verification email sent successfully!');
    } catch (error: any) {
      console.error('Error resending verification email:', error);
      toast.error(error.response?.data?.message || 'Failed to send verification email');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-ink-50 dark:bg-ink-900">
      <Navbar />
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            {/* Success Icon */}
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20 mb-6">
              <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>

            {/* Title */}
            <h2 className="text-3xl font-extrabold text-ink-900 dark:text-ink-100 mb-4">
              Check Your Email
            </h2>

            {/* Description */}
            <div className="space-y-4">
              <p className="text-lg text-ink-700 dark:text-ink-300">
                We've sent a verification email to:
              </p>
              
              {email && (
                <div className="bg-white dark:bg-ink-800 rounded-lg p-4 border border-ink-200 dark:border-ink-700">
                  <p className="font-semibold text-brand-600 dark:text-brand-400 break-all">
                    {email}
                  </p>
                </div>
              )}

              <p className="text-ink-600 dark:text-ink-400">
                Please click the verification link in the email to activate your account.
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-2">What to do next:</p>
                <ul className="space-y-1 list-disc list-inside ml-4">
                  <li>Check your email inbox (including spam folder)</li>
                  <li>Click the verification link in the email</li>
                  <li>Return to login once verified</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button
              onClick={handleResendEmail}
              disabled={isResending}
              variant="outline"
              className="w-full flex items-center justify-center space-x-2"
            >
              {isResending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  <span>Resend Verification Email</span>
                </>
              )}
            </Button>

            <Link to="/login" className="block">
              <Button variant="primary" className="w-full">
                Go to Login
              </Button>
            </Link>
          </div>

          {/* Help Text */}
          <div className="text-center">
            <p className="text-sm text-ink-600 dark:text-ink-400">
              Didn't receive the email?{' '}
              <button
                onClick={handleResendEmail}
                className="font-medium text-brand-600 dark:text-brand-400 hover:text-brand-500 dark:hover:text-brand-300"
                disabled={isResending}
              >
                Try resending it
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
