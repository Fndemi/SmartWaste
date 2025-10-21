import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Eye, EyeOff, User, Mail, Lock } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { type UserRole } from '../../types';
import { Navbar } from '../../components/layout/Navbar';

const registerSchema = yup.object({
  name: yup.string().min(2, 'Name must be at least 2 characters').required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: yup.string().oneOf([yup.ref('password')], 'Passwords must match').required('Please confirm your password'),
  role: yup.string().oneOf(['HOUSEHOLD', 'SME', 'DRIVER', 'RECYCLER', 'COUNCIL', 'USER', 'ADMIN', 'COLLECTOR'], 'Please select a role').required('Role is required'),
});

type RegisterFormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
};

const roleOptions: { value: UserRole; label: string; description: string }[] = [
  { value: 'HOUSEHOLD', label: 'Household', description: 'Residential waste management' },
  { value: 'SME', label: 'Small Business', description: 'Small business waste collection' },
  { value: 'DRIVER', label: 'Driver', description: 'Waste collection driver' },
  { value: 'RECYCLER', label: 'Recycler', description: 'Recycling facility operator' },
  { value: 'COUNCIL', label: 'Council', description: 'Municipal waste management' },
];

export function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register: registerUser, isLoading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const { confirmPassword: _confirmPassword, ...registerData } = data;
      await registerUser(registerData);
      navigate('/login', { state: { message: 'Registration successful! Please check your email to verify your account.' } });
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
              Create your account
            </h2>
            <p className="mt-2 text-center text-sm text-ink-700">
              Or{' '}
              <Link
                to="/login"
                className="font-medium text-brand-600 hover:text-brand-500"
              >
                sign in to your existing account
              </Link>
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div className="relative">
                <Input
                  {...register('name')}
                  type="text"
                  label="Full Name"
                  placeholder="Enter your full name"
                  error={errors.name?.message}
                  className="pl-10"
                />
                <User className="absolute left-3 top-8 h-5 w-5 text-ink-400" />
              </div>

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

              <div className="relative">
                <Input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  label="Confirm Password"
                  placeholder="Confirm your password"
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

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Account Type
                </label>
                <div className="space-y-2">
                  {roleOptions.map((role) => (
                    <label key={role.value} className="flex items-start space-x-3 p-3 border border-ink-200 rounded-lg hover:bg-ink-50 cursor-pointer">
                      <input
                        {...register('role')}
                        type="radio"
                        value={role.value}
                        className="mt-1 h-4 w-4 text-brand-600 focus:ring-brand-500 border-ink-300"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-ink-900">{role.label}</div>
                        <div className="text-xs text-ink-600">{role.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.role?.message && (
                  <p className="mt-1 text-sm text-error-600">{String(errors.role.message)}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              loading={isLoading}
              disabled={isLoading}
            >
              Create Account
            </Button>
          </form>

          <div className="text-xs text-ink-600 text-center">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </div>
        </div>
      </div>
    </div>
  );
}
