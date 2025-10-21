import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2, LogIn } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Navbar } from '../../components/layout/Navbar';

export function VerificationSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleVerificationResult = () => {
      const status = searchParams.get('status');
      const message = searchParams.get('message');
      
      if (status === 'success') {
        setVerificationStatus('success');
      } else if (status === 'error') {
        setVerificationStatus('error');
        setErrorMessage(message || 'Verification failed. The link may be expired or invalid.');
      } else {
        // If no status parameter, this might be a direct access - redirect to expired page
        setVerificationStatus('error');
        setErrorMessage('Invalid verification link. Please check your email and try again.');
      }
    };

    handleVerificationResult();
  }, [searchParams]);

  const handleLoginRedirect = () => {
    navigate('/login', { 
      state: { 
        message: 'Your account has been verified successfully! You can now log in.' 
      } 
    });
  };

  if (verificationStatus === 'loading') {
    return (
      <div className="min-h-screen flex flex-col bg-ink-50 dark:bg-ink-900">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8 text-center">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
              <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
            </div>
            <h2 className="text-3xl font-extrabold text-ink-900 dark:text-ink-100">
              Verifying Your Email
            </h2>
            <p className="text-ink-600 dark:text-ink-400">
              Please wait while we verify your account...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (verificationStatus === 'error') {
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
                Verification Failed
              </h2>

              {/* Error Message */}
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-700 mb-6">
                <p className="text-red-800 dark:text-red-200">
                  {errorMessage}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <Link to="/verify-email-expired" className="block">
                <Button variant="primary" className="w-full">
                  Get New Verification Link
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
              Email Verified Successfully!
            </h2>

            {/* Description */}
            <p className="text-lg text-ink-700 dark:text-ink-300 mb-6">
              Your account has been verified and is now active. You can now log in to access your dashboard.
            </p>
          </div>

          {/* Success Message */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-700">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-800 dark:text-green-200">
                <p className="font-medium mb-2">Account Activated</p>
                <p>Welcome to WasteVortex! You can now:</p>
                <ul className="mt-2 space-y-1 list-disc list-inside ml-4">
                  <li>Access your personalized dashboard</li>
                  <li>Schedule waste pickups</li>
                  <li>Track your environmental impact</li>
                  <li>Connect with local waste management services</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="space-y-4">
            <Button
              onClick={handleLoginRedirect}
              variant="primary"
              className="w-full flex items-center justify-center space-x-2"
            >
              <LogIn className="h-4 w-4" />
              <span>Continue to Login</span>
            </Button>

            <div className="text-center">
              <p className="text-sm text-ink-600 dark:text-ink-400">
                Ready to start managing your waste efficiently?{' '}
                <Link
                  to="/login"
                  className="font-medium text-brand-600 dark:text-brand-400 hover:text-brand-500 dark:hover:text-brand-300"
                >
                  Log in now
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
