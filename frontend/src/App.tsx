import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LocationProvider } from './contexts/LocationContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { EmailVerificationSentPage } from './pages/auth/EmailVerificationSentPage';
import { VerificationSuccessPage } from './pages/auth/VerificationSuccessPage';
import { VerificationExpiredPage } from './pages/auth/VerificationExpiredPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { CreatePickupPage } from './pages/pickups/CreatePickupPage';
import { PickupsPage } from './pages/pickups/PickupsPage';
import { PickupDetailPage } from './pages/pickups/PickupDetailPage';
import { FacilitiesPage } from './pages/facilities/FacilitiesPage';
import { LoadingPage } from './components/ui/LoadingSpinner';
import { HomePage } from './pages/HomePage';
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
      />
      <Route
        path="/verify-email-sent"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <EmailVerificationSentPage />}
      />
      <Route
        path="/verify-email"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <VerificationSuccessPage />}
      />
      <Route
        path="/verify-email-expired"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <VerificationExpiredPage />}
      />
      <Route
        path="/users/verify-email"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <VerificationSuccessPage />}
      />
      <Route
        path="/users/verify-email-expired"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <VerificationExpiredPage />}
      />
      <Route
        path="/forgot-password"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ForgotPasswordPage />}
      />
      <Route
        path="/reset-password"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ResetPasswordPage />}
      />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/pickups"
        element={
          <ProtectedRoute>
            <PickupsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/pickups/create"
        element={
          <ProtectedRoute>
            <CreatePickupPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/pickups/:id"
        element={
          <ProtectedRoute>
            <PickupDetailPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/facilities"
        element={
          <ProtectedRoute>
            <FacilitiesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Public home */}
      <Route path="/" element={<HomePage />} />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LocationProvider>
          <Router>
            <div className="App">
              <AppRoutes />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#22c55e',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    duration: 5000,
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </div>
          </Router>
        </LocationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
