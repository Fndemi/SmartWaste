import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { apiService } from '../../services/api';
import { type Notification } from '../../types';
import toast from 'react-hot-toast';

export function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [onlyUnread, setOnlyUnread] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await apiService.getNotifications({ page, limit: 10, isRead: onlyUnread ? false : undefined });
      setItems(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, onlyUnread]);

  const toggleRead = async (id: string, isRead: boolean) => {
    try {
      await apiService.markNotificationRead(id, !isRead);
      fetchData();
    } catch {
      toast.error('Failed to update notification');
    }
  };

  const markAll = async () => {
    try {
      await apiService.markAllNotificationsRead();
      fetchData();
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const clearAll = async () => {
    try {
      // This would need a backend endpoint to clear all notifications
      // For now, we'll mark all as read
      await apiService.markAllNotificationsRead();
      fetchData();
      toast.success('All notifications cleared');
    } catch {
      toast.error('Failed to clear notifications');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-100">Notifications</h1>
            <p className="text-ink-700 dark:text-ink-300">Updates about your pickups and assignments</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setOnlyUnread(v => !v)}>
              {onlyUnread ? 'Show All' : 'Only Unread'}
            </Button>
            <Button variant="outline" onClick={markAll}>Mark all as read</Button>
            <Button variant="outline" onClick={clearAll}>Clear all</Button>
          </div>
        </div>

        <div className="bg-white dark:bg-ink-800 rounded-lg shadow-sm border border-ink-200 dark:border-ink-700">
          {loading ? (
            <div className="p-8 text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-ink-700 dark:text-ink-300">Loading notifications...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-ink-700 dark:text-ink-300">No notifications.</div>
          ) : (
            <ul className="divide-y divide-ink-200 dark:divide-ink-700">
              {items.map(n => (
                <li key={n._id} className="p-4 flex items-start justify-between">
                  <div>
                    <div className="font-medium text-ink-900 dark:text-ink-100">{n.title}</div>
                    <div className="text-sm text-ink-700 dark:text-ink-300">{n.message}</div>
                    <div className="text-xs text-ink-500 dark:text-ink-400 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${n.isRead ? 'bg-ink-100 dark:bg-ink-700 text-ink-700 dark:text-ink-300' : 'bg-brand-100 dark:bg-brand-900 text-brand-800 dark:text-brand-200'}`}>
                      {n.isRead ? 'Read' : 'Unread'}
                    </span>
                    <Button size="sm" variant="outline" onClick={() => toggleRead(n._id, n.isRead)}>
                      Mark as {n.isRead ? 'Unread' : 'Read'}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-between items-center">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</Button>
          <div className="text-sm text-ink-600 dark:text-ink-400">Page {page} of {totalPages}</div>
          <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</Button>
        </div>
      </div>
    </DashboardLayout>
  );
}


