import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

function useUnreadCount() {
  const { user } = useAuth();
  const [count, setCount] = React.useState<number>(0);

  React.useEffect(() => {
    let mounted = true;
    const fetchCount = async () => {
      // Only show notifications for authenticated users with relevant roles
      if (!user || !['HOUSEHOLD', 'SME', 'DRIVER', 'RECYCLER', 'COUNCIL', 'ADMIN'].includes(user.role)) return;
      try {
        const res = await apiService.getUnreadCount();
        if (mounted) setCount(res.data.data?.unreadCount ?? 0);
      } catch {
        if (mounted) setCount(0);
      }
    };
    fetchCount();
    const id = window.setInterval(fetchCount, 30000);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, [user]);

  return count;
}

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);
  const unread = useUnreadCount();
  return (
    <header className="sticky top-0 z-40 w-full border-b border-ink-200 bg-white/80 backdrop-blur dark:bg-ink-900/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-brand-600" />
          <span className="font-semibold">Waste Vortex</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-4 text-sm">
          <NavLink to="/" className={({ isActive }) => isActive ? 'text-brand-700' : 'text-ink-700 hover:text-ink-900 dark:text-ink-200 dark:hover:text-white'}>
            Home
          </NavLink>
          {user && ['HOUSEHOLD', 'SME', 'DRIVER', 'RECYCLER', 'COUNCIL', 'ADMIN'].includes(user.role) && (
            <NavLink to="/notifications" className={({ isActive }) => isActive ? 'text-brand-700' : 'text-ink-700 hover:text-ink-900 dark:text-ink-200 dark:hover:text-white'}>
              Notifications{unread > 0 ? ` (${unread})` : ''}
            </NavLink>
          )}
          {!user && (
            <NavLink to="/login" className={({ isActive }) => isActive ? 'text-brand-700' : 'text-ink-700 hover:text-ink-900 dark:text-ink-200 dark:hover:text-white'}>
              Sign in
            </NavLink>
          )}
          <button
            type="button"
            aria-label="Toggle dark mode"
            onClick={toggleTheme}
            className="inline-flex items-center justify-center rounded-md border border-ink-200 px-3 py-1.5 text-ink-700 hover:bg-white/60 dark:text-ink-200 dark:border-ink-700 dark:hover:bg-ink-800"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          {!user && (
            <Link to="/register" className="btn-primary py-1.5 px-3">
              Get started
            </Link>
          )}
          {user && (
            <>
              <Link to="/dashboard" className="btn-primary py-1.5 px-3">
                Dashboard
              </Link>
              <Link to="/profile" className="text-ink-700 hover:text-ink-900 dark:text-ink-200 dark:hover:text-white">
                Profile
              </Link>
            </>
          )}
        </nav>

        <button
          type="button"
          className="sm:hidden inline-flex items-center justify-center rounded-md border border-ink-200 px-3 py-1.5 text-ink-700 dark:text-ink-200"
          onClick={() => setOpen(v => !v)}
          aria-label="Open menu"
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {open && (
        <div className="sm:hidden border-t border-ink-200 bg-white dark:bg-ink-900">
          <div className="mx-auto max-w-7xl px-4 py-3 flex flex-col gap-2">
            <NavLink to="/" onClick={() => setOpen(false)} className={({ isActive }) => isActive ? 'text-brand-700' : 'text-ink-700'}>
              Home
            </NavLink>
            {user && ['HOUSEHOLD', 'SME', 'DRIVER', 'RECYCLER', 'COUNCIL', 'ADMIN'].includes(user.role) && (
              <NavLink to="/notifications" onClick={() => setOpen(false)} className={({ isActive }) => isActive ? 'text-brand-700' : 'text-ink-700'}>
                Notifications{unread > 0 ? ` (${unread})` : ''}
              </NavLink>
            )}
            {!user && (
              <NavLink to="/login" onClick={() => setOpen(false)} className={({ isActive }) => isActive ? 'text-brand-700' : 'text-ink-700'}>
                Sign in
              </NavLink>
            )}
            {!user && (
              <Link to="/register" onClick={() => setOpen(false)} className="btn-primary py-2 px-3 w-full text-center">
                Get started
              </Link>
            )}
            {user && (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)} className="btn-primary py-2 px-3 w-full text-center">
                  Dashboard
                </Link>
                <Link to="/profile" onClick={() => setOpen(false)} className="text-ink-700">
                  Profile
                </Link>
              </>
            )}
            <button
              type="button"
              onClick={() => { toggleTheme(); setOpen(false); }}
              className="mt-1 inline-flex items-center justify-center rounded-md border border-ink-200 px-3 py-2 text-ink-700 dark:text-ink-200"
            >
              {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}


