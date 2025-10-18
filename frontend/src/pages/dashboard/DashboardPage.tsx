import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { RealTimeMap } from '../../components/map/RealTimeMap';
import { useLocation } from '../../hooks/useLocation';
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
  Bell,
  Plus,
  Eye,
  Activity
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
          setFacilities((res.data.data || []).filter(f => f.kind === 'recycler'));
        })
        .catch(() => setFacilities([]))
        .finally(() => setFacilityLoading(false));
    }
  }, [user?.role]);

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
      interval = setInterval(fetchNotifications, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user?.role]);

  const getLiveStats = () => {
    const total = userPickups.length;
    const pending = userPickups.filter(p => p.status === 'pending').length;
    const completed = userPickups.filter(p => ['completed', 'processed'].includes(p.status)).length;
    const totalWeight = userPickups.reduce((sum, p) => sum + (p.actualWeightKg || p.estimatedWeightKg), 0);
    const assigned = userPickups.filter(p => p.status === 'assigned').length;
    const pickedUp = userPickups.filter(p => p.status === 'picked_up').length;

    switch (user?.role) {
      case 'DRIVER':
        return [
          { name: 'Assigned', value: String(assigned), icon: Trash2, color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
          { name: 'Picked Up', value: String(pickedUp), icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20' },
          { name: 'Pending', value: String(pending), icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20' },
          { name: 'Total Weight', value: `${totalWeight.toFixed(1)} kg`, icon: Package, color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-900/20' },
        ];
      case 'RECYCLER':
        return getRecyclerStats();
      default:
        return [
          { name: 'Total Pickups', value: String(total), icon: Trash2, color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
          { name: 'Pending', value: String(pending), icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20' },
          { name: 'Completed', value: String(completed), icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20' },
          { name: 'Total Weight', value: `${totalWeight.toFixed(1)} kg`, icon: Package, color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-900/20' },
        ];
    }
  };

  const getRecyclerStats = () => {
    const facilityIds = facilities.map(f => f._id);
    const relevantPickups = userPickups.filter(p => p.facilityId && facilityIds.includes(p.facilityId));
    const received = relevantPickups.filter(p => p.status === 'processed').length;
    const rejected = relevantPickups.filter(p => p.status === 'rejected').length;
    const totalWeight = relevantPickups.reduce((sum, p) => sum + (p.receivedWeightKg || p.actualWeightKg || p.estimatedWeightKg), 0);
    const totalCapacity = facilities.reduce((sum, f) => sum + (f.capacityKg || 0), 0);
    const usedCapacity = totalCapacity ? Math.min(100, Math.round((totalWeight / totalCapacity) * 100)) : 0;
    return [
      { name: 'Facilities', value: String(facilities.length), icon: MapPin, color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
      { name: 'Received', value: String(received), icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20' },
      { name: 'Rejected', value: String(rejected), icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-900/20' },
      { name: 'Capacity Used', value: `${usedCapacity}%`, icon: TrendingUp, color: 'text-yellow-600', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20' },
    ];
  };

  const stats = getLiveStats();
  const activePickup = userPickups.find(p => ['assigned', 'picked_up', 'completed'].includes(p.status));

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Modern Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-blue-100 text-lg">
                Here's your waste management overview
              </p>
            </div>
            <button
              type="button"
              className="relative bg-white/20 backdrop-blur-sm p-3 rounded-full hover:bg-white/30 transition-all duration-200"
              onClick={() => navigate('/notifications')}
              aria-label="Notifications"
            >
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-2 py-1 font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Modern Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {loadingStats ? (
            <div className="col-span-4 text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">Loading stats...</p>
            </div>
          ) : (
            stats.map((stat) => (
              <div
                key={stat.name}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{stat.name}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stat.value}</p>
                  </div>
                  <div className={`p-4 rounded-2xl ${stat.bgColor}`}>
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Role-specific Content */}
        {user?.role === 'DRIVER' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <MapPin className="h-7 w-7 text-blue-600" />
                Available Pickups
              </h2>
              <Link
                to="/pickups"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                View All
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availablePickups.slice(0, 6).map(pickup => (
                <div key={pickup._id} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-3">
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                      {pickup.wasteType}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">
                      {pickup.estimatedWeightKg}kg
                    </span>
                  </div>
                  <p className="text-gray-900 dark:text-white font-medium mb-2">{pickup.address}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                      {new Date(pickup.createdAt).toLocaleDateString()}
                    </span>
                    <Link
                      to={`/pickups/${pickup._id}`}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm transition-colors duration-200"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
              {availablePickups.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                  <Trash2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No available pickups</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recycler Dashboard */}
        {user?.role === 'RECYCLER' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                <MapPin className="h-7 w-7 text-blue-600" />
                My Facilities
              </h2>
              {facilityLoading ? (
                <div className="text-gray-600 dark:text-gray-400 text-center py-8">Loading facilities...</div>
              ) : facilities.length === 0 ? (
                <div className="text-gray-600 dark:text-gray-400 text-center py-8">No facilities found.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {facilities.map(facility => (
                    <div key={facility._id} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">{facility.name}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{facility.address}</p>
                      <div className="space-y-1">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          Capacity: {facility.capacityKg ? `${facility.capacityKg} kg` : 'N/A'}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          Accepts: {facility.accepts.join(', ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Council Dashboard */}
        {(user?.role === 'COUNCIL' || user?.role === 'ADMIN') && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                <Users className="h-7 w-7 text-blue-600" />
                Council Overview
              </h2>
              {councilLoading ? (
                <div className="text-gray-600 dark:text-gray-400 text-center py-8">Loading overview...</div>
              ) : !councilOverview ? (
                <div className="text-gray-600 dark:text-gray-400 text-center py-8">No data available.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
                    <div className="text-blue-600 dark:text-blue-400 text-sm font-medium">Total Pickups</div>
                    <div className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-2">
                      {councilOverview.totals?.total ?? 0}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6 border border-green-200 dark:border-green-700">
                    <div className="text-green-600 dark:text-green-400 text-sm font-medium">Total Weight (kg)</div>
                    <div className="text-3xl font-bold text-green-900 dark:text-green-100 mt-2">
                      {(councilOverview.totals?.totalWeightKg ?? 0).toFixed(1)}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 border border-purple-200 dark:border-purple-700">
                    <div className="text-purple-600 dark:text-purple-400 text-sm font-medium">Avg Contamination</div>
                    <div className="text-3xl font-bold text-purple-900 dark:text-purple-100 mt-2">
                      {Math.round(councilOverview.totals?.avgContamination ?? 0)}%
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Notifications */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Activity className="h-7 w-7 text-blue-600" />
              Recent Notifications
            </h2>
            <button
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
              onClick={() => navigate('/notifications')}
            >
              View all
            </button>
          </div>
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div key={notif._id} className={`flex items-center space-x-4 p-4 rounded-xl transition-all duration-200 ${notif.isRead
                    ? 'bg-gray-50 dark:bg-gray-700/50'
                    : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
                  }`}>
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                    <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">{notif.title || notif.message}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{new Date(notif.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {user?.role === 'HOUSEHOLD' || user?.role === 'SME' ? (
              <Link to="/pickups/create" className="group bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-600 p-3 rounded-xl group-hover:scale-110 transition-transform duration-200">
                    <Plus className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white">Request Pickup</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Schedule a waste collection</div>
                  </div>
                </div>
              </Link>
            ) : user?.role === 'DRIVER' ? (
              <>
                <Link to="/pickups" className="group bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-700 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-600 p-3 rounded-xl group-hover:scale-110 transition-transform duration-200">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white">Available Pickups</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Find nearby requests</div>
                    </div>
                  </div>
                </Link>
                <Link to="/pickups" className="group bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-700 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center gap-4">
                    <div className="bg-purple-600 p-3 rounded-xl group-hover:scale-110 transition-transform duration-200">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white">My Assignments</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">View assigned pickups</div>
                    </div>
                  </div>
                </Link>
              </>
            ) : user?.role === 'RECYCLER' ? (
              <>
                <Link to="/facilities" className="group bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-600 p-3 rounded-xl group-hover:scale-110 transition-transform duration-200">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white">Manage Facilities</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Update facility info</div>
                    </div>
                  </div>
                </Link>
                <Link to="/pickups" className="group bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-700 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-600 p-3 rounded-xl group-hover:scale-110 transition-transform duration-200">
                      <Package className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white">Received Pickups</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">View delivered waste</div>
                    </div>
                  </div>
                </Link>
              </>
            ) : user?.role === 'COUNCIL' || user?.role === 'ADMIN' ? (
              <>
                <Link to="/pickups" className="group bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-600 p-3 rounded-xl group-hover:scale-110 transition-transform duration-200">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white">All Pickups</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Monitor all requests</div>
                    </div>
                  </div>
                </Link>
                <Link to="/facilities" className="group bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-700 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-600 p-3 rounded-xl group-hover:scale-110 transition-transform duration-200">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white">Facilities</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Manage facilities</div>
                    </div>
                  </div>
                </Link>
              </>
            ) : null}
          </div>
        </div>

        {/* Real-time Map Section */}
        {(user?.role === 'HOUSEHOLD' || user?.role === 'SME' || user?.role === 'DRIVER') && activePickup && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <MapPin className="h-7 w-7 text-blue-600" />
              {user?.role === 'DRIVER' ? 'Your Active Pickup' : 'Active Pickup Location'}
            </h2>

            <RealTimeMap
              className="w-full rounded-xl overflow-hidden"
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
              <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {isTracking ? 'Location tracking active' : 'Location tracking stopped'}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    {!isTracking ? (
                      <button
                        type="button"
                        onClick={startTracking}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                      >
                        Start Tracking
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopTracking}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                      >
                        Stop Tracking
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
                <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                <p className="font-semibold text-gray-900 dark:text-white">{activePickup.status.replace('_', ' ')}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
                <p className="text-sm text-gray-600 dark:text-gray-400">Waste Type</p>
                <p className="font-semibold text-gray-900 dark:text-white">{activePickup.wasteType}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
                <p className="text-sm text-gray-600 dark:text-gray-400">Address</p>
                <p className="font-semibold text-gray-900 dark:text-white">{activePickup.address}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}