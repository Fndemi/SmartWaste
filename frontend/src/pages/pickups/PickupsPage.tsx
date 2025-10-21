import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { type Pickup, type PickupStatus } from '../../types';
import {
  MapPin,
  Calendar,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Plus
} from 'lucide-react';
import toast from 'react-hot-toast';

const statusColors: Record<PickupStatus, string> = {
  pending: 'bg-accent-100 text-accent-800',
  assigned: 'bg-brand-100 text-brand-800',
  picked_up: 'bg-amber-100 text-amber-800',
  completed: 'bg-teal-100 text-teal-800',
  processed: 'bg-teal-100 text-teal-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-ink-200 text-ink-700',
};

const statusIcons: Record<PickupStatus, React.ComponentType<{ className?: string }>> = {
  pending: Clock,
  assigned: AlertCircle,
  picked_up: Package,
  completed: CheckCircle,
  processed: CheckCircle,
  rejected: AlertCircle,
  cancelled: AlertCircle,
};

export function PickupsPage() {
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PickupStatus | 'ALL'>('ALL');
  const [showAvailable, setShowAvailable] = useState(false);
  const { user } = useAuth();

  const fetchPickups = async () => {
    try {
      setLoading(true);
      if (user?.role === 'DRIVER' && showAvailable) {
        const res = await apiService.getAvailablePickups();
        setPickups(res.data.data || []);
      } else {
        const response = await apiService.getPickups();
        let pickupsData = response.data.data || [];
        if (user?.role === 'DRIVER') {
          pickupsData = pickupsData.filter(p => p.assignedTo === user._id);
        } else if (user?.role === 'HOUSEHOLD' || user?.role === 'SME' || user?.role === 'USER') {
          pickupsData = pickupsData.filter(p => p.requestedBy === user._id);
        }
        setPickups(pickupsData);
      }
    } catch {
      toast.error('Failed to fetch pickups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPickups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAvailable, user?.role]);

  const filteredPickups = filter === 'ALL'
    ? pickups
    : pickups.filter(pickup => pickup.status === filter);

  // Sort by contamination score (highest first) for pending pickups
  const sortedPickups = filteredPickups.sort((a, b) => {
    if (a.status === 'pending' && b.status === 'pending') {
      const scoreA = a.contaminationScore || 0;
      const scoreB = b.contaminationScore || 0;
      return scoreB - scoreA; // Higher contamination first
    }
    return 0;
  });

  const handleClaimPickup = async (pickupId: string) => {
    try {
      await apiService.claimPickup(pickupId);
      await fetchPickups();
      toast.success('Pickup claimed successfully');
    } catch {
      toast.error('Failed to claim pickup');
    }
  };

  const handleMarkPickedUp = async (pickupId: string) => {
    try {
      await apiService.markPickedUp(pickupId, {});
      await fetchPickups();
      toast.success('Pickup marked as picked up');
    } catch {
      toast.error('Failed to mark pickup as picked up');
    }
  };

  const handleMarkCompleted = async (pickupId: string) => {
    try {
      await apiService.markCompleted(pickupId, { actualWeightKg: 0 });
      await fetchPickups();
      toast.success('Pickup marked as completed');
    } catch {
      toast.error('Failed to mark pickup as completed');
    }
  };

  const canCreatePickup = user?.role === 'HOUSEHOLD' || user?.role === 'SME';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-100">Pickup Requests</h1>
            <p className="text-ink-700 dark:text-ink-300 mt-1">
              Manage and track your waste pickup requests
            </p>
          </div>
          {canCreatePickup && (
            <Link to="/pickups/create" className="w-full sm:w-auto">
              <Button className="flex items-center space-x-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                <span>New Pickup</span>
              </Button>
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-ink-800 rounded-lg shadow-sm border border-ink-200 dark:border-ink-700 p-4">
          <div className="flex flex-wrap gap-2">
            {user?.role === 'DRIVER' && (
              <button
                onClick={() => setShowAvailable(v => !v)}
                className={`px-3 py-1 rounded-full text-sm font-medium ${showAvailable ? 'bg-brand-100 dark:bg-brand-900 text-brand-800 dark:text-brand-200' : 'bg-ink-100 dark:bg-ink-700 text-ink-700 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-600'}`}
              >
                {showAvailable ? 'Showing Available' : 'Show Available'}
              </button>
            )}
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${filter === 'ALL'
                ? 'bg-brand-100 dark:bg-brand-900 text-brand-800 dark:text-brand-200'
                : 'bg-ink-100 dark:bg-ink-700 text-ink-700 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-600'
                }`}
            >
              All ({pickups.length})
            </button>
            {Object.entries(statusColors).map(([status, colorClass]) => {
              const count = pickups.filter(p => p.status === status).length;
              const Icon = statusIcons[status as PickupStatus];
              return (
                <button
                  key={status}
                  onClick={() => setFilter(status as PickupStatus)}
                  className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${filter === status
                    ? colorClass
                    : 'bg-ink-100 dark:bg-ink-700 text-ink-700 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-600'
                    }`}
                >
                  <Icon className="h-3 w-3" />
                  <span>{status.replace('_', ' ')} ({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Pickups List */}
        <div className="bg-white dark:bg-ink-800 rounded-lg shadow-sm border border-ink-200 dark:border-ink-700">
          {loading ? (
            <div className="p-8 text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-ink-700 dark:text-ink-300">Loading pickups...</p>
            </div>
          ) : filteredPickups.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="h-12 w-12 text-ink-400 dark:text-ink-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-ink-900 dark:text-ink-100 mb-2">No pickups found</h3>
              <p className="text-ink-700 dark:text-ink-300 mb-4">
                {filter === 'ALL'
                  ? "You haven't created any pickup requests yet."
                  : `No pickups with status "${filter.replace('_', ' ')}" found.`
                }
              </p>
              {canCreatePickup && (
                <Link to="/pickups/create">
                  <Button>Create Your First Pickup</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-ink-200 dark:divide-ink-700">
              {sortedPickups.map((pickup) => {
                const StatusIcon = statusIcons[pickup.status];
                const statusColorClass = statusColors[pickup.status];

                return (
                  <div key={pickup._id} className="p-4 sm:p-6 hover:bg-ink-50 dark:hover:bg-ink-700/50 transition-colors duration-200">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColorClass}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {pickup.status.replace('_', ' ')}
                          </div>
                          <span className="text-sm text-ink-600 dark:text-ink-400">
                            {new Date(pickup.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <h3 className="text-lg font-medium text-ink-900 dark:text-ink-100 mb-2">
                          {pickup.wasteType.charAt(0).toUpperCase() + pickup.wasteType.slice(1)} Waste
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm text-ink-700 dark:text-ink-300">
                          <div className="flex items-center space-x-2">
                            <Package className="h-4 w-4" />
                            <span>{pickup.estimatedWeightKg} kg</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4" />
                            <span className="truncate">{pickup.address}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {pickup.actualWeightKg
                                ? `${pickup.actualWeightKg} kg actual`
                                : 'Estimated weight'
                              }
                            </span>
                          </div>
                        </div>

                        {pickup.contaminationScore !== undefined && (
                          <div className="mt-2 flex items-center space-x-2">
                            <span className="text-xs text-ink-500 dark:text-ink-400">Contamination:</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${pickup.contaminationScore > 70 ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
                              pickup.contaminationScore > 40 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                                'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                              }`}>
                              {pickup.contaminationScore}% {pickup.contaminationScore > 70 ? 'High' :
                                pickup.contaminationScore > 40 ? 'Medium' : 'Low'}
                            </span>
                          </div>
                        )}

                        {pickup.description && (
                          <p className="mt-2 text-sm text-ink-700 dark:text-ink-300 line-clamp-2">
                            {pickup.description}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2">
                        {user?.role === 'DRIVER' && pickup.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleClaimPickup(pickup._id)}
                            className="w-full sm:w-auto"
                          >
                            Claim
                          </Button>
                        )}
                        {user?.role === 'DRIVER' && pickup.status === 'assigned' && (
                          <Button
                            size="sm"
                            onClick={() => handleMarkPickedUp(pickup._id)}
                            className="w-full sm:w-auto"
                          >
                            Mark Picked Up
                          </Button>
                        )}
                        {user?.role === 'DRIVER' && pickup.status === 'picked_up' && (
                          <Button
                            size="sm"
                            onClick={() => handleMarkCompleted(pickup._id)}
                            className="w-full sm:w-auto"
                          >
                            Mark Completed
                          </Button>
                        )}
                        <Link to={`/pickups/${pickup._id}`} className="w-full sm:w-auto">
                          <Button variant="outline" size="sm" className="flex items-center space-x-1 w-full sm:w-auto">
                            <Eye className="h-4 w-4" />
                            <span>View</span>
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
