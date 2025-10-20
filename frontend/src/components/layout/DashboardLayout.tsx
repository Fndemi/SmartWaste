import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, Bell, Menu, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { type UserRole, type NavigationItem } from '../../types';
import { apiService } from '../../services/api';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigationItems: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Pickups', href: '/pickups', icon: '🗑️' },
  { name: 'Facilities', href: '/facilities', icon: '🏭' },
  { name: 'Admin', href: '/admin', icon: '⚙️' },
];

const roleBasedNavigation: Record<UserRole, string[]> = {
  HOUSEHOLD: ['Dashboard', 'Pickups'],
  SME: ['Dashboard', 'Pickups'],
  DRIVER: ['Dashboard', 'Pickups'],
  RECYCLER: ['Dashboard', 'Facilities', 'Pickups'],
  COUNCIL: ['Dashboard', 'Pickups', 'Facilities'],
  ADMIN: ['Dashboard', 'Pickups', 'Facilities', 'Admin'],
  USER: ['Dashboard', 'Pickups'],
  COLLECTOR: ['Dashboard', 'Pickups'],
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Poll unread notifications for drivers (realtime)
  useEffect(() => {
    let interval: number | undefined;
    const fetchUnread = async () => {
      try {
        const res = await apiService.getUnreadCount();
        setUnreadCount(res.data.data?.unreadCount || 0);
      } catch {
        setUnreadCount(0);
      }
    };
    fetchUnread();
    if (user?.role === 'DRIVER') {
      interval = window.setInterval(fetchUnread, 5000); // Poll every 5s for drivers
    }
    return () => {
      if (interval !== undefined) {
        window.clearInterval(interval);
      }
    };
  }, [user?.role]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const allowedNavItems = user ? roleBasedNavigation[user.role] || [] : [];
  const filteredNavItems = navigationItems.filter(item =>
    allowedNavItems.includes(item.name) || user?.role === 'ADMIN'
  );

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-900 flex">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className={`flex flex-col h-screen transition-all duration-200 bg-white dark:bg-ink-800 border-r border-ink-200 dark:border-ink-700 ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
          <div className="flex items-center justify-between px-4 py-4 border-b border-ink-200 dark:border-ink-700">
            <h1 className={`text-xl font-bold text-ink-900 dark:text-ink-100 transition-all duration-200 ${sidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>WasteVortex</h1>
            <button
              className="ml-2 p-1 rounded hover:bg-ink-100 dark:hover:bg-ink-700"
              onClick={() => setSidebarCollapsed((v) => !v)}
              aria-label="Toggle sidebar"
            >
              {sidebarCollapsed ? <Menu className="h-5 w-5 text-ink-700 dark:text-ink-300" /> : <X className="h-5 w-5 text-ink-700 dark:text-ink-300" />}
            </button>
          </div>
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {filteredNavItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-2 py-2 text-base font-medium rounded-md text-ink-700 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-700 hover:text-ink-900 dark:hover:text-ink-100 transition-all duration-200 ${sidebarCollapsed ? 'justify-center' : ''}`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className={`ml-3 transition-all duration-200 ${sidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true" 
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-ink-800 shadow-xl">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white hover:bg-white hover:bg-opacity-20 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            
            {/* Mobile sidebar header */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-4 border-b border-ink-200 dark:border-ink-700">
              <h1 className="text-xl font-bold text-ink-900 dark:text-ink-100">WasteVortex</h1>
              <button
                className="lg:hidden p-1 rounded-md text-ink-400 hover:text-ink-600 dark:hover:text-ink-100 hover:bg-ink-100 dark:hover:bg-ink-700 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Mobile navigation */}
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <nav className="px-2 space-y-1">
                {filteredNavItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="group flex items-center px-3 py-3 text-base font-medium rounded-lg text-ink-700 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-700 hover:text-ink-900 dark:hover:text-ink-100 transition-all active:bg-ink-100 dark:active:bg-ink-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="text-xl mr-4">{item.icon}</span>
                    <span className="font-medium">{item.name}</span>
                  </Link>
                ))}
              </nav>
            </div>
            
            {/* Mobile user profile section */}
            <div className="flex-shrink-0 flex border-t border-ink-200 dark:border-ink-700 p-4">
              <div className="flex items-center w-full">
                <div className="flex items-center flex-1">
                  <div className="h-10 w-10 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center">
                    <User className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-ink-900 dark:text-ink-100">{user?.name}</div>
                    <div className="text-sm text-ink-600 dark:text-ink-400 capitalize">{user?.role?.toLowerCase()}</div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="ml-3 flex items-center space-x-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 transition-all duration-200">
        {/* Mobile top navigation */}
        <div className="sticky top-0 z-30 flex-shrink-0 flex h-16 bg-white dark:bg-ink-800 border-b border-ink-200 dark:border-ink-700 lg:hidden">
          <button
            className="px-4 border-r border-ink-200 dark:border-ink-700 text-ink-500 dark:text-ink-400 hover:text-ink-600 dark:hover:text-ink-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500 lg:hidden transition-colors"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 flex justify-between px-4 sm:px-6">
            <div className="flex-1 flex items-center">
              <h1 className="text-lg font-semibold text-ink-900 dark:text-ink-100">WasteVortex</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                className="relative p-2 rounded-full text-ink-400 dark:text-ink-300 hover:text-ink-600 dark:hover:text-ink-100 hover:bg-ink-100 dark:hover:bg-ink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all"
                onClick={() => navigate('/notifications')}
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              <Link 
                to="/profile" 
                className="flex items-center p-1 rounded-full hover:bg-ink-100 dark:hover:bg-ink-700 transition-colors"
                aria-label="Profile"
              >
                <div className="h-8 w-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center">
                  <User className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Desktop top navigation */}
        <div className="hidden lg:flex sticky top-0 z-10 flex-shrink-0 h-16 bg-white dark:bg-ink-800 border-b border-ink-200 dark:border-ink-700">
          <div className="flex-1 px-8 flex justify-between items-center">
            <div className="flex-1 flex" />
            <div className="ml-4 flex items-center md:ml-6">
              <button
                type="button"
                className="relative bg-white dark:bg-ink-700 p-1 rounded-full text-ink-400 dark:text-ink-300 hover:text-ink-600 dark:hover:text-ink-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
                onClick={() => navigate('/notifications')}
                aria-label="Notifications"
              >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-error-600 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">{unreadCount}</span>
                )}
              </button>
              <div className="ml-3 relative">
                <div className="flex items-center space-x-3">
                  <Link to="/profile" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                    <div className="h-9 w-9 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center">
                      <User className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                    </div>
                    <div className="hidden md:block">
                      <div className="text-base font-medium text-ink-900 dark:text-ink-100">{user?.name}</div>
                      <div className="text-xs text-ink-600 dark:text-ink-400 capitalize">{user?.role?.toLowerCase()}</div>
                    </div>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="flex items-center space-x-1"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-8">
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-8 lg:px-12">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
