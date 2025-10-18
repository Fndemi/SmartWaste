import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, Bell, Menu, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { type UserRole } from '../../types';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Pickups', href: '/pickups', icon: '🗑️' },
  { name: 'Facilities', href: '/facilities', icon: '🏭' },
  { name: 'AI Assistant', href: '/ai-assistant', icon: '🤖' },
];

const roleBasedNavigation: Record<UserRole, string[]> = {
  HOUSEHOLD: ['Dashboard', 'Pickups', 'AI Assistant'],
  SME: ['Dashboard', 'Pickups', 'AI Assistant'],
  DRIVER: ['Dashboard', 'Pickups'],
  RECYCLER: ['Dashboard', 'Facilities', 'Pickups'],
  COUNCIL: ['Dashboard', 'Pickups', 'Facilities'],
  ADMIN: ['Dashboard', 'Pickups', 'Facilities', 'AI Assistant'],
  USER: ['Dashboard', 'Pickups', 'AI Assistant'],
  COLLECTOR: ['Dashboard', 'Pickups'],
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Poll unread notifications for drivers (realtime)
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    const fetchUnread = async () => {
      try {
        const res = await apiService.getUnreadCount();
        setUnreadCount(res.data.data.unreadCount || 0);
      } catch {
        setUnreadCount(0);
      }
    };
    fetchUnread();
    if (user?.role === 'DRIVER') {
      interval = setInterval(fetchUnread, 5000); // Poll every 5s for drivers
    }
    return () => interval && clearInterval(interval);
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

      {/* Main content */}
      <div className={`flex flex-col flex-1 transition-all duration-200 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        {/* Top navigation */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white dark:bg-ink-800 border-b border-ink-200 dark:border-ink-700 lg:hidden">
          <div className="flex-1 flex justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex-1 flex">
              <h1 className="text-lg font-semibold text-ink-900 dark:text-ink-100 self-center">WasteVortex</h1>
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
                  <div className="flex items-center space-x-2">
                    <div className="h-9 w-9 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center">
                      <User className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                    </div>
                    <div className="hidden md:block">
                      <div className="text-base font-medium text-ink-900 dark:text-ink-100">{user?.name}</div>
                      <div className="text-xs text-ink-600 dark:text-ink-400 capitalize">{user?.role?.toLowerCase()}</div>
                    </div>
                  </div>
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
