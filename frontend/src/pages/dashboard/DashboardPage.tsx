import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import { RealTimeMap } from '../../components/map/RealTimeMap';
import { useLocation } from '../../contexts/LocationContext';
import { type Pickup, type Notification, type Facility } from '../../types';
import {
  Trash2,
  MapPin,
  Clock,
  CheckCircle,
  TrendingUp,
  Users,
  Package,
  AlertCircle,
  Bell
} from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { currentLocation, startTracking, stopTracking, isTracking } = useLocation();
  const [userPickups, setUserPickups] = useState<Pickup[]>([]);
  const [availablePickups, setAvailablePickups] = useState<Pickup[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [facilityLoading, setFacilityLoading] = useState(false);
  const [councilOverview, setCouncilOverview] = useState<{ byStatus: Array<{ _id: string; count: number }>; byType: Array<{ _id: string; count: number; totalWeightKg: number; avgContamination: number }>; totals: { total: number; totalWeightKg: number; avgContamination: number; processed: number; rejected: number } } | null>(null);
  const [councilLoading, setCouncilLoading] = useState(false);
  const [driverPickupFilter, setDriverPickupFilter] = useState<'available' | 'assigned' | 'all'>('available');

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const res = await apiService.getPickups();
        let pickupsData = res.data.data || [];
        if (user?.role === 'DRIVER') {
          pickupsData = pickupsData.filter(p => p.assignedTo === user._id);
        } else if (user?.role === 'HOUSEHOLD' || user?.role === 'SME' || user?.role === 'USER') {
          pickupsData = pickupsData.filter(p => p.requestedBy === user._id);
        }
        setUserPickups(pickupsData);
      } catch {
        setUserPickups([]);
      }
    };
    fetchUserStats();
    // Fetch available pickups for drivers
    if (user?.role === 'DRIVER') {
      apiService.getAvailablePickups().then(res => {
        setAvailablePickups(res.data.data || []);
      }).catch(() => setAvailablePickups([]));
    }
    setLoadingStats(false);
  }, [user?.role, user?._id]);

  useEffect(() => {
    if (user?.role === 'RECYCLER') {
      setFacilityLoading(true);
      apiService.getFacilities()
        .then(res => {
          // Only show recycler facilities
          setFacilities((res.data.data || []).filter(f => f.kind === 'recycler'));
        })
        .catch(() => setFacilities([]))
        .finally(() => setFacilityLoading(false));
    }
  }, [user?.role]);

  // Council overview
  useEffect(() => {
    if (user?.role === 'COUNCIL' || user?.role === 'ADMIN') {
      setCouncilLoading(true);
      apiService.getCouncilOverview()
        .then(res => {
          setCouncilOverview(res.data.data || null);
        })
        .catch(() => setCouncilOverview(null))
        .finally(() => setCouncilLoading(false));
    }
  }, [user?.role]);

  // Fetch notifications and unread count
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    const fetchNotifications = async () => {
      try {
        const res = await apiService.getNotifications({ limit: 5 });
        const payload = res.data?.data as unknown;
        const docs = Array.isArray(payload)
          ? payload
          : Array.isArray((payload as { docs?: Notification[] })?.docs)
            ? (payload as { docs: Notification[] }).docs
            : [];
        setNotifications(docs);
        try {
          const unreadRes = await apiService.getUnreadCount();
          const unread = unreadRes.data?.data?.unreadCount ?? 0;
          setUnreadCount(unread);
        } catch {
          setUnreadCount(0);
        }
      } catch {
        setNotifications([]);
        setUnreadCount(0);
      }
    };
    fetchNotifications();
    if (user?.role === 'DRIVER') {
      interval = setInterval(fetchNotifications, 5000); // Poll every 5s for drivers
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user?.role]);

  // Compute live stats based on role
  const getLiveStats = () => {
    // Always use userPickups for stats, regardless of role
    const total = userPickups.length;
    const pending = userPickups.filter(p => p.status === 'pending').length;
    const completed = userPickups.filter(p => ['completed', 'processed'].includes(p.status)).length;
    const totalWeight = userPickups.reduce((sum, p) => sum + (p.actualWeightKg || p.estimatedWeightKg), 0);
    const assigned = userPickups.filter(p => p.status === 'assigned').length;
    const pickedUp = userPickups.filter(p => p.status === 'picked_up').length;
    // const received = userPickups.filter(p => p.status === 'processed').length;

    switch (user?.role) {
      case 'DRIVER':
        return [
          { name: 'Assigned Pickups', value: String(assigned), icon: Trash2, color: 'text-blue-600' },
          { name: 'Picked Up Today', value: String(pickedUp), icon: CheckCircle, color: 'text-green-600' },
          { name: 'Pending', value: String(pending), icon: Clock, color: 'text-yellow-600' },
          { name: 'Total Weight', value: `${totalWeight.toFixed(1)} kg`, icon: Package, color: 'text-purple-600' },
        ];
      case 'RECYCLER':
        return getRecyclerStats();
      default:
        return [
          { name: 'Total Pickups', value: String(total), icon: Trash2, color: 'text-blue-600' },
          { name: 'Pending', value: String(pending), icon: Clock, color: 'text-yellow-600' },
          { name: 'Completed', value: String(completed), icon: CheckCircle, color: 'text-green-600' },
          { name: 'Total Weight', value: `${totalWeight.toFixed(1)} kg`, icon: Package, color: 'text-purple-600' },
        ];
    }
  };

  // Compute recycler stats
  const getRecyclerStats = () => {
    // Only show pickups delivered to recycler facilities
    const facilityIds = facilities.map(f => f._id);
    const relevantPickups = userPickups.filter(p => p.facilityId && facilityIds.includes(p.facilityId));
    const received = relevantPickups.filter(p => p.status === 'processed').length;
    const rejected = relevantPickups.filter(p => p.status === 'rejected').length;
    const pending = relevantPickups.filter(p => p.status === 'completed').length;
    const totalWeight = relevantPickups.reduce((sum, p) => sum + (p.receivedWeightKg || p.actualWeightKg || p.estimatedWeightKg), 0);
    // Capacity used: sum of all processed weights / total capacity
    const totalCapacity = facilities.reduce((sum, f) => sum + (f.capacityKg || 0), 0);
    const usedCapacity = totalCapacity ? Math.min(100, Math.round((totalWeight / totalCapacity) * 100)) : 0;
    return [
      { name: 'Facilities', value: String(facilities.length), icon: MapPin, color: 'text-blue-600' },
      { name: 'Received', value: String(received), icon: CheckCircle, color: 'text-green-600' },
      { name: 'Rejected', value: String(rejected), icon: AlertCircle, color: 'text-red-600' },
      { name: 'Capacity Used', value: `${usedCapacity}%`, icon: TrendingUp, color: 'text-yellow-600' },
      { name: 'Total Weight', value: `${totalWeight.toFixed(1)} kg`, icon: Package, color: 'text-purple-600' },
      { name: 'Pending Processing', value: String(pending), icon: Clock, color: 'text-accent-600' },
    ];
  };

  const stats = getLiveStats();

  // Get active pickup for map display
  const activePickup = userPickups.find(p =>
    ['assigned', 'picked_up', 'completed'].includes(p.status)
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-white dark:bg-ink-800 rounded-lg shadow-sm border border-ink-200 dark:border-ink-700 p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-100">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-ink-700 dark:text-ink-300 mt-1">
              Here's what's happening with your waste management today.
            </p>
          </div>
          <button
            type="button"
            className="relative bg-white dark:bg-ink-700 p-2 rounded-full text-ink-400 dark:text-ink-300 hover:text-ink-600 dark:hover:text-ink-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
            onClick={() => navigate('/notifications')}
            aria-label="Notifications"
          >
            <Clock className="h-7 w-7" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-error-600 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">{unreadCount}</span>
            )}
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loadingStats ? (
            <div className="col-span-4 text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
              <p className="mt-2 text-ink-600 dark:text-ink-400">Loading stats...</p>
            </div>
          ) : (
            stats.map((stat) => (
              <div
                key={stat.name}
                className="relative bg-white dark:bg-ink-800 overflow-hidden shadow-md border border-ink-200 dark:border-ink-700 rounded-xl flex flex-col justify-between h-full min-h-[120px]"
              >
                {/* Accent bar */}
                <div className={`absolute left-0 top-0 h-full w-2 ${stat.color} rounded-l-xl`} />
                <div className="flex items-center gap-4 p-6">
                  <div className={`flex items-center justify-center rounded-full h-12 w-12 ${stat.color} bg-opacity-10 dark:bg-opacity-20`}>
                    <stat.icon className={`h-7 w-7 ${stat.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-semibold text-ink-900 dark:text-ink-100 truncate">{stat.name}</div>
                    <div className="text-2xl font-bold text-ink-900 dark:text-ink-100 mt-1">{stat.value}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Driver Pickup Filter Buttons */}
        {user?.role === 'DRIVER' && (
          <div className="flex gap-2 mb-4">
            <button
              className={`px-3 py-1 rounded ${driverPickupFilter === 'available' ? 'bg-blue-600 text-white' : 'bg-ink-100 dark:bg-ink-700 text-ink-900 dark:text-ink-100'}`}
              onClick={() => setDriverPickupFilter('available')}
            >
              Available
            </button>
            <button
              className={`px-3 py-1 rounded ${driverPickupFilter === 'assigned' ? 'bg-blue-600 text-white' : 'bg-ink-100 dark:bg-ink-700 text-ink-900 dark:text-ink-100'}`}
              onClick={() => setDriverPickupFilter('assigned')}
            >
              Assigned
            </button>
            <button
              className={`px-3 py-1 rounded ${driverPickupFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-ink-100 dark:bg-ink-700 text-ink-900 dark:text-ink-100'}`}
              onClick={() => setDriverPickupFilter('all')}
            >
              All
            </button>
          </div>
        )}

        {/* Driver Pickups Table (filtered) */}
        {user?.role === 'DRIVER' && (
          <div className="bg-white dark:bg-ink-800 rounded-lg shadow-sm border border-ink-200 dark:border-ink-700 p-6 mt-6">
            <h2 className="text-lg font-bold text-ink-900 dark:text-ink-100 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-brand-600" /> Pickups
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-ink-200 dark:divide-ink-700">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-ink-500 dark:text-ink-400 uppercase">Waste Type</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-ink-500 dark:text-ink-400 uppercase">Weight (kg)</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-ink-500 dark:text-ink-400 uppercase">Address</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-ink-500 dark:text-ink-400 uppercase">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-ink-500 dark:text-ink-400 uppercase">Requested</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-ink-500 dark:text-ink-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let pickups: Pickup[] = [];
                    if (driverPickupFilter === 'available') {
                      pickups = availablePickups;
                    } else if (driverPickupFilter === 'assigned') {
                      pickups = userPickups;
                    } else {
                      // 'all': merge and dedupe by _id
                      const all = [...availablePickups, ...userPickups];
                      const seen = new Set();
                      pickups = all.filter(p => {
                        if (seen.has(p._id)) return false;
                        seen.add(p._id);
                        return true;
                      });
                    }
                    if (pickups.length === 0) {
                      return (
                        <tr><td colSpan={6} className="text-center text-ink-600 dark:text-ink-400 py-4">No pickups found.</td></tr>
                      );
                    }
                    return pickups.map(pickup => (
                      <tr key={pickup._id} className="hover:bg-ink-50 dark:hover:bg-ink-700/30 transition-colors">
                        <td className="px-3 py-2 text-ink-900 dark:text-ink-100">{pickup.wasteType}</td>
                        <td className="px-3 py-2 text-ink-900 dark:text-ink-100">{pickup.estimatedWeightKg}</td>
                        <td className="px-3 py-2 text-ink-900 dark:text-ink-100">{pickup.address}</td>
                        <td className="px-3 py-2 text-ink-900 dark:text-ink-100 capitalize">{pickup.status.replace('_', ' ')}</td>
                        <td className="px-3 py-2 text-ink-600 dark:text-ink-400">{new Date(pickup.createdAt).toLocaleDateString()}</td>
                        <td className="px-3 py-2 text-ink-900 dark:text-ink-100">
                          <Link to={`/pickups/${pickup._id}`} className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700">View</Link>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recycler Dashboard Section */}
        {user?.role === 'RECYCLER' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-ink-800 rounded-lg shadow-sm border border-ink-200 dark:border-ink-700 p-6">
              <h2 className="text-lg font-bold text-ink-900 dark:text-ink-100 mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" /> My Facilities
              </h2>
              {facilityLoading ? (
                <div className="text-ink-600 dark:text-ink-400">Loading facilities...</div>
              ) : facilities.length === 0 ? (
                <div className="text-ink-600 dark:text-ink-400">No facilities found.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {facilities.map(facility => (
                    <div key={facility._id} className="bg-ink-50 dark:bg-ink-700/50 rounded-lg p-4 border border-ink-200 dark:border-ink-700">
                      <div className="font-semibold text-ink-900 dark:text-ink-100 text-lg">{facility.name}</div>
                      <div className="text-sm text-ink-600 dark:text-ink-400">{facility.address}</div>
                      <div className="text-xs text-ink-500 dark:text-ink-400 mt-1">Capacity: {facility.capacityKg ? `${facility.capacityKg} kg` : 'N/A'}</div>
                      <div className="text-xs text-ink-500 dark:text-ink-400">Accepts: {facility.accepts.join(', ')}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-white dark:bg-ink-800 rounded-lg shadow-sm border border-ink-200 dark:border-ink-700 p-6">
              <h2 className="text-lg font-bold text-ink-900 dark:text-ink-100 mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-purple-600" /> Pickups to Process
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-ink-200 dark:divide-ink-700">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-ink-500 dark:text-ink-400 uppercase">Waste Type</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-ink-500 dark:text-ink-400 uppercase">Weight (kg)</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-ink-500 dark:text-ink-400 uppercase">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-ink-500 dark:text-ink-400 uppercase">Requested</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-ink-500 dark:text-ink-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userPickups.filter(p => p.facilityId && facilities.some(f => f._id === p.facilityId)).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-ink-600 dark:text-ink-400 py-4 text-center">No pickups for your facilities.</td>
                      </tr>
                    ) : (
                      userPickups.filter(p => p.facilityId && facilities.some(f => f._id === p.facilityId)).map(pickup => (
                        <tr key={pickup._id} className="hover:bg-ink-50 dark:hover:bg-ink-700/30 transition-colors">
                          <td className="px-3 py-2 text-ink-900 dark:text-ink-100">{pickup.wasteType}</td>
                          <td className="px-3 py-2 text-ink-900 dark:text-ink-100">{pickup.receivedWeightKg || pickup.actualWeightKg || pickup.estimatedWeightKg}</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${pickup.status === 'processed' ? 'bg-teal-100 text-teal-800' : pickup.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-accent-100 text-accent-800'}`}>
                              {pickup.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-ink-600 dark:text-ink-400">{new Date(pickup.createdAt).toLocaleDateString()}</td>
                          <td className="px-3 py-2 text-ink-900 dark:text-ink-100">
                            {pickup.status === 'completed' && (
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  className="px-2 py-1 text-xs rounded bg-teal-600 text-white hover:bg-teal-700"
                                  onClick={async () => {
                                    const weightStr = window.prompt('Enter received weight (kg)', String(pickup.actualWeightKg || pickup.estimatedWeightKg || 0));
                                    if (weightStr == null) return;
                                    const weight = Number(weightStr);
                                    if (Number.isNaN(weight) || weight <= 0) {
                                      toast.error('Please enter a valid weight');
                                      return;
                                    }
                                    try {
                                      await apiService.receivePickup(pickup._id, { receivedWeightKg: weight });
                                      toast.success('Pickup accepted');
                                      // Refresh list
                                      const res = await apiService.getPickups();
                                      let data = res.data.data || [];
                                      const facilityIds = facilities.map(f => f._id);
                                      data = data.filter(p => p.facilityId && facilityIds.includes(p.facilityId));
                                      setUserPickups(data);
                                    } catch {
                                      toast.error('Failed to accept');
                                    }
                                  }}
                                >
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700"
                                  onClick={async () => {
                                    const reason = window.prompt('Reason for rejection?');
                                    if (!reason) return;
                                    try {
                                      await apiService.rejectPickup(pickup._id, { reason });
                                      toast.success('Pickup rejected');
                                      const res = await apiService.getPickups();
                                      let data = res.data.data || [];
                                      const facilityIds = facilities.map(f => f._id);
                                      data = data.filter(p => p.facilityId && facilityIds.includes(p.facilityId));
                                      setUserPickups(data);
                                    } catch {
                                      toast.error('Failed to reject');
                                    }
                                  }}
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Council Dashboard Section */}
        {(user?.role === 'COUNCIL' || user?.role === 'ADMIN') && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-ink-800 rounded-lg shadow-sm border border-ink-200 dark:border-ink-700 p-6">
              <h2 className="text-lg font-bold text-ink-900 dark:text-ink-100 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-brand-600" /> Council Overview
              </h2>
              {councilLoading ? (
                <div className="text-ink-600 dark:text-ink-400">Loading overview...</div>
              ) : !councilOverview ? (
                <div className="text-ink-600 dark:text-ink-400">No data available.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-ink-50 dark:bg-ink-700/50 rounded-lg p-4 border border-ink-200 dark:border-ink-700">
                    <div className="text-sm text-ink-600 dark:text-ink-400">Total Pickups</div>
                    <div className="text-2xl font-bold text-ink-900 dark:text-ink-100">{councilOverview.totals?.total ?? 0}</div>
                  </div>
                  <div className="bg-ink-50 dark:bg-ink-700/50 rounded-lg p-4 border border-ink-200 dark:border-ink-700">
                    <div className="text-sm text-ink-600 dark:text-ink-400">Total Weight (kg)</div>
                    <div className="text-2xl font-bold text-ink-900 dark:text-ink-100">{(councilOverview.totals?.totalWeightKg ?? 0).toFixed(1)}</div>
                  </div>
                  <div className="bg-ink-50 dark:bg-ink-700/50 rounded-lg p-4 border border-ink-200 dark:border-ink-700">
                    <div className="text-sm text-ink-600 dark:text-ink-400">Avg Contamination</div>
                    <div className="text-2xl font-bold text-ink-900 dark:text-ink-100">{Math.round(councilOverview.totals?.avgContamination ?? 0)}%</div>
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-ink-800 rounded-lg shadow-sm border border-ink-200 dark:border-ink-700 p-6">
                <h3 className="text-base font-semibold text-ink-900 dark:text-ink-100 mb-4">By Status</h3>
                {!councilOverview ? (
                  <div className="text-ink-600 dark:text-ink-400">No data.</div>
                ) : (
                  <div className="space-y-2">
                    {(councilOverview.byStatus || []).map((s) => (
                      <div key={s._id} className="flex items-center justify-between text-sm">
                        <span className="capitalize text-ink-700 dark:text-ink-300">{String(s._id).replace('_', ' ')}</span>
                        <span className="font-semibold text-ink-900 dark:text-ink-100">{s.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-white dark:bg-ink-800 rounded-lg shadow-sm border border-ink-200 dark:border-ink-700 p-6">
                <h3 className="text-base font-semibold text-ink-900 dark:text-ink-100 mb-4">By Waste Type</h3>
                {!councilOverview ? (
                  <div className="text-ink-600 dark:text-ink-400">No data.</div>
                ) : (
                  <div className="space-y-2">
                    {(councilOverview.byType || []).map((t) => (
                      <div key={t._id} className="grid grid-cols-5 gap-2 text-sm items-center">
                        <span className="col-span-2 capitalize text-ink-700 dark:text-ink-300">{String(t._id).replace('_', ' ')}</span>
                        <span className="text-ink-700 dark:text-ink-300">{t.count} pickups</span>
                        <span className="text-ink-700 dark:text-ink-300">{t.totalWeightKg.toFixed(1)} kg</span>
                        <span className="text-ink-700 dark:text-ink-300">{Math.round(t.avgContamination)}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Recent Notifications */}
        <div className="bg-white dark:bg-ink-800 rounded-lg shadow-sm border border-ink-200 dark:border-ink-700 p-6">
          <h2 className="text-lg font-medium text-ink-900 dark:text-ink-100 mb-4 flex items-center justify-between">
            <span>Recent Notifications</span>
            <button
              className="text-brand-600 hover:underline text-sm"
              onClick={() => navigate('/notifications')}
            >
              View all
            </button>
          </h2>
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="text-ink-600 dark:text-ink-400">No notifications yet.</div>
            ) : (
              notifications.map((notif) => (
                <div key={notif._id} className={`flex items-center space-x-3 p-3 rounded-lg ${notif.isRead ? 'bg-ink-50 dark:bg-ink-700/50' : 'bg-brand-50 dark:bg-brand-900/30'}`}>
                  <Bell className="h-5 w-5 text-brand-600" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-ink-900 dark:text-ink-100">{notif.title || notif.message}</div>
                    <div className="text-xs text-ink-600 dark:text-ink-400">{new Date(notif.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-ink-800 rounded-lg shadow-sm border border-ink-200 dark:border-ink-700 p-6">
          <h2 className="text-lg font-medium text-ink-900 dark:text-ink-100 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {user?.role === 'HOUSEHOLD' || user?.role === 'SME' ? (
              <>
                <Link to="/pickups/create" className="p-4 border border-ink-200 dark:border-ink-700 rounded-lg hover:bg-ink-50 dark:hover:bg-ink-700/50 text-left block transition-colors duration-200">
                  <div className="flex items-center">
                    <Trash2 className="h-5 w-5 text-brand-600 mr-3 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-ink-900 dark:text-ink-100 truncate">Request Pickup</div>
                      <div className="text-sm text-ink-600 dark:text-ink-400 truncate">Schedule a waste collection</div>
                    </div>
                  </div>
                </Link>
                <Link to="/ai-assistant" className="p-4 border border-ink-200 dark:border-ink-700 rounded-lg hover:bg-ink-50 dark:hover:bg-ink-700/50 text-left block">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-teal-600 mr-3" />
                    <div>
                      <div className="font-medium text-ink-900 dark:text-ink-100">AI Assistant</div>
                      <div className="text-sm text-ink-600 dark:text-ink-400">Get waste management tips</div>
                    </div>
                  </div>
                </Link>
              </>
            ) : user?.role === 'DRIVER' ? (
              <>
                <Link to="/pickups" className="p-4 border border-ink-200 rounded-lg hover:bg-ink-50 text-left block">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-brand-600 mr-3" />
                    <div>
                      <div className="font-medium text-ink-900">View Available Pickups</div>
                      <div className="text-sm text-ink-600">Find nearby collection requests</div>
                    </div>
                  </div>
                </Link>
                <Link to="/pickups" className="p-4 border border-ink-200 rounded-lg hover:bg-ink-50 text-left block">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-teal-600 mr-3" />
                    <div>
                      <div className="font-medium text-ink-900">My Assignments</div>
                      <div className="text-sm text-ink-600">View assigned pickups</div>
                    </div>
                  </div>
                </Link>
              </>
            ) : user?.role === 'RECYCLER' ? (
              <>
                <Link to="/facilities" className="p-4 border border-ink-200 rounded-lg hover:bg-ink-50 text-left block">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-brand-600 mr-3" />
                    <div>
                      <div className="font-medium text-ink-900">Manage Facilities</div>
                      <div className="text-sm text-ink-600">Update facility information</div>
                    </div>
                  </div>
                </Link>
                <Link to="/pickups" className="p-4 border border-ink-200 rounded-lg hover:bg-ink-50 text-left block">
                  <div className="flex items-center">
                    <Package className="h-5 w-5 text-teal-600 mr-3" />
                    <div>
                      <div className="font-medium text-ink-900">Received Pickups</div>
                      <div className="text-sm text-ink-600">View delivered waste</div>
                    </div>
                  </div>
                </Link>
              </>
            ) : user?.role === 'COUNCIL' || user?.role === 'ADMIN' ? (
              <>
                <Link to="/pickups" className="p-4 border border-ink-200 rounded-lg hover:bg-ink-50 text-left block">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-brand-600 mr-3" />
                    <div>
                      <div className="font-medium text-ink-900">Manage Users</div>
                      <div className="text-sm text-ink-600">View and manage user accounts</div>
                    </div>
                  </div>
                </Link>
                <Link to="/pickups" className="p-4 border border-ink-200 rounded-lg hover:bg-ink-50 text-left block">
                  <div className="flex items-center">
                    <Trash2 className="h-5 w-5 text-teal-600 mr-3" />
                    <div>
                      <div className="font-medium text-ink-900">All Pickups</div>
                      <div className="text-sm text-ink-600">Monitor all pickup requests</div>
                    </div>
                  </div>
                </Link>
                <Link to="/facilities" className="p-4 border border-ink-200 rounded-lg hover:bg-ink-50 text-left block">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-accent-500 mr-3" />
                    <div>
                      <div className="font-medium text-ink-900">Facilities</div>
                      <div className="text-sm text-ink-600">Manage recycling facilities</div>
                    </div>
                  </div>
                </Link>
              </>
            ) : null}
          </div>
        </div>

        {/* Real-time Map Section */}
        {(user?.role === 'HOUSEHOLD' || user?.role === 'SME' || user?.role === 'DRIVER') && activePickup && (
          <div className="bg-white dark:bg-ink-800 rounded-lg shadow-sm border border-ink-200 dark:border-ink-700 p-6">
            <h2 className="text-lg font-medium text-ink-900 dark:text-ink-100 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-brand-600" />
              {user?.role === 'DRIVER' ? 'Your Active Pickup' : 'Active Pickup Location'}
            </h2>

            <RealTimeMap
              className="w-full"
              height={300}
              pickupLocation={activePickup.lat && activePickup.lng ? { lat: activePickup.lat, lng: activePickup.lng } : undefined}
              driverLocation={user?.role === 'DRIVER' ? currentLocation || undefined : undefined}
              householdLocation={user?.role === 'HOUSEHOLD' || user?.role === 'SME' ?
                (activePickup.lat && activePickup.lng ? { lat: activePickup.lat, lng: activePickup.lng, timestamp: Date.now() } : undefined) :
                undefined
              }
              showDriverTracking={user?.role === 'DRIVER'}
              onLocationUpdate={(location) => {
                console.log('Location updated:', location);
              }}
            />

            {user?.role === 'DRIVER' && (
              <div className="mt-4 flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span className="text-sm font-medium">
                    {isTracking ? 'Location tracking active' : 'Location tracking stopped'}
                  </span>
                </div>
                <div className="flex space-x-2">
                  {!isTracking ? (
                    <button
                      type="button"
                      onClick={startTracking}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Start Tracking
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopTracking}
                      className="px-3 py-1 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50"
                    >
                      Stop Tracking
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="mt-4 text-sm text-ink-600 dark:text-ink-400">
              <p><strong>Pickup Status:</strong> {activePickup.status.replace('_', ' ')}</p>
              <p><strong>Waste Type:</strong> {activePickup.wasteType}</p>
              <p><strong>Address:</strong> {activePickup.address}</p>
            </div>
          </div>
        )}

        {/* Removed dummy sections: Recent Activity and My Location to keep DB-backed info only */}
      </div>
    </DashboardLayout>
  );
}
