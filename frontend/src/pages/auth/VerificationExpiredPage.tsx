import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, Mail, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Navbar } from '../../components/layout/Navbar';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';

export function VerificationExpiredPage() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState<string>('');
  const [isResending, setIsResending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const errorMessage = searchParams.get('message') || 'Your verification link has expired or is invalid.';

  const handleResendEmail = async () => {
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setIsResending(true);
    try {
      await apiService.resendVerification(email.trim());
      setEmailSent(true);
      toast.success('Verification email sent successfully!');
    } catch (error: any) {
      console.error('Error resending verification email:', error);
      toast.error(error.response?.data?.message || 'Failed to send verification email');
    } finally {
      setIsResending(false);
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
                <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>

              {/* Title */}
              <h2 className="text-3xl font-extrabold text-ink-900 dark:text-ink-100 mb-4">
                Verification Email Sent!
              </h2>

              {/* Description */}
              <div className="space-y-4">
                <p className="text-lg text-ink-700 dark:text-ink-300">
                  We've sent a new verification email to:
                </p>
                
                <div className="bg-white dark:bg-ink-800 rounded-lg p-4 border border-ink-200 dark:border-ink-700">
                  <p className="font-semibold text-brand-600 dark:text-brand-400 break-all">
                    {email}
                  </p>
                </div>

                <p className="text-ink-600 dark:text-ink-400">
                  Please check your email and click the verification link to activate your account.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <Link to="/login" className="block">
                <Button variant="primary" className="w-full">
                  Go to Login
                </Button>
              </Link>

              <button
                onClick={() => {
                  setEmailSent(false);
                  setEmail('');
                }}
                className="w-full text-center text-sm text-ink-600 dark:text-ink-400 hover:text-ink-800 dark:hover:text-ink-200"
              >
                Need to resend to a different email?
              </button>
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
          <div className="text-center">
            {/* Error Icon */}
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 mb-6">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>

            {/* Title */}
            <h2 className="text-3xl font-extrabold text-ink-900 dark:text-ink-100 mb-4">
              Verification Link Expired
            </h2>

            {/* Error Message */}
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-700 mb-6">
              <p className="text-red-800 dark:text-red-200">
                {errorMessage}
              </p>
            </div>

            <p className="text-ink-600 dark:text-ink-400 mb-6">
              Don't worry! We can send you a new verification link. Just enter your email address below.
            </p>
          </div>

          {/* Resend Form */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Input
                  type="email"
                  label="Email Address"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
                <Mail className="absolute left-3 top-8 h-5 w-5 text-ink-400" />
              </div>

              <Button
                onClick={handleResendEmail}
                disabled={isResending || !email.trim()}
                variant="primary"
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
                    <span>Send New Verification Email</span>
                  </>
                )}
              </Button>
            </div>

            {/* Help Section */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-2">Having trouble?</p>
                <ul className="space-y-1 list-disc list-inside ml-2">
                  <li>Check your spam/junk folder</li>
                  <li>Make sure you entered the correct email address</li>
                  <li>Verification links expire after 24 hours</li>
                  <li>You can request a new link as many times as needed</li>
                </ul>
              </div>
            </div>

            {/* Alternative Actions */}
            <div className="space-y-3">
              <Link to="/register" className="block">
                <Button variant="outline" className="w-full flex items-center justify-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Create New Account</span>
                </Button>
              </Link>

              <Link to="/login" className="block">
                <Button variant="outline" className="w-full">
                  Back to Login
                </Button>
              </Link>
            </div>
          </div>

          {/* Contact Support */}
          <div className="text-center">
            <p className="text-sm text-ink-600 dark:text-ink-400">
              Still having issues?{' '}
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
