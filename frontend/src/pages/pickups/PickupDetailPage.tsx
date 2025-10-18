import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { RealTimeMap } from '../../components/map/RealTimeMap';
import { useLocation } from '../../contexts/LocationContext';
import { type Pickup } from '../../types';
import { Package, Clock, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  assigned: 'bg-blue-100 text-blue-800',
  picked_up: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  processed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  pending: Clock,
  assigned: AlertCircle,
  picked_up: Package,
  completed: CheckCircle,
  processed: CheckCircle,
  rejected: AlertCircle,
  cancelled: AlertCircle,
};

export function PickupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentLocation, startTracking, stopTracking, isTracking } = useLocation();
  const [pickup, setPickup] = useState<Pickup | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

  const fetchPickup = useCallback(async (pickupId: string) => {
    try {
      setLoading(true);
      const response = await apiService.getPickup(pickupId);
      setPickup(response.data.data || null);
    } catch {
      toast.error('Failed to fetch pickup details');
      navigate('/pickups');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (id) {
      fetchPickup(id);
    }
  }, [id, fetchPickup]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!pickup) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Pickup not found</h3>
          <p className="text-gray-600 mb-4">The pickup you're looking for doesn't exist.</p>
          <Link to="/pickups">
            <Button>Back to Pickups</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const StatusIcon = statusIcons[pickup.status];
  const statusColorClass = statusColors[pickup.status];

  const canClaim = user?.role === 'DRIVER' && pickup.status === 'pending';
  const canMarkPickedUp = user?.role === 'DRIVER' && pickup.status === 'assigned';
  const canMarkCompleted = user?.role === 'DRIVER' && pickup.status === 'picked_up';
  const canAcceptOrReject = user?.role === 'RECYCLER' && pickup.status === 'completed';
  const canTrackLocation = user?.role === 'DRIVER' && ['assigned', 'picked_up', 'completed'].includes(pickup.status);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Link to="/pickups">
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-ink-900 dark:text-ink-100">Pickup Details</h1>
            <p className="text-ink-600 dark:text-ink-400 text-sm sm:text-base">Request ID: {pickup._id}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="xl:col-span-2 space-y-6">
            {/* Status Card */}
            <div className="bg-white dark:bg-ink-800 rounded-lg shadow-sm border border-ink-200 dark:border-ink-700 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h2 className="text-lg font-medium text-ink-900 dark:text-ink-100">Status</h2>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColorClass}`}>
                  <StatusIcon className="h-4 w-4 mr-2" />
                  {pickup.status.replace('_', ' ')}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-ink-500 dark:text-ink-400">Created:</span>
                  <p className="font-medium text-ink-900 dark:text-ink-100">{new Date(pickup.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-ink-500 dark:text-ink-400">Last Updated:</span>
                  <p className="font-medium text-ink-900 dark:text-ink-100">{new Date(pickup.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Waste Details */}
            <div className="bg-white dark:bg-ink-800 rounded-lg shadow-sm border border-ink-200 dark:border-ink-700 p-4 sm:p-6">
              <h2 className="text-lg font-medium text-ink-900 dark:text-ink-100 mb-4">Waste Details</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="order-1 space-y-4">
                  <div>
                    <span className="text-sm text-ink-500 dark:text-ink-400">Waste Type</span>
                    <p className="font-medium text-ink-900 dark:text-ink-100 capitalize">{pickup.wasteType.replace('_', ' ')}</p>
                  </div>

                  <div>
                    <span className="text-sm text-ink-500 dark:text-ink-400">Estimated Weight</span>
                    <p className="font-medium text-ink-900 dark:text-ink-100">{pickup.estimatedWeightKg} kg</p>
                  </div>

                  {pickup.actualWeightKg && (
                    <div>
                      <span className="text-sm text-ink-500 dark:text-ink-400">Actual Weight</span>
                      <p className="font-medium text-ink-900 dark:text-ink-100">{pickup.actualWeightKg} kg</p>
                    </div>
                  )}

                  {pickup.description && (
                    <div>
                      <span className="text-sm text-ink-500 dark:text-ink-400">Description</span>
                      <p className="font-medium text-ink-900 dark:text-ink-100">{pickup.description}</p>
                    </div>
                  )}

                  {pickup.contaminationScore !== undefined && (
                    <div>
                      <span className="text-sm text-ink-500 dark:text-ink-400">Contamination Score</span>
                      <p className="font-medium text-ink-900 dark:text-ink-100">
                        {pickup.contaminationScore}%
                        <span className={`ml-2 text-xs px-2 py-1 rounded-full ${pickup.contaminationScore > 70 ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
                          pickup.contaminationScore > 40 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                            'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                          }`}>
                          {pickup.contaminationScore > 70 ? 'High' :
                            pickup.contaminationScore > 40 ? 'Medium' : 'Low'}
                        </span>
                      </p>
                      {pickup.contaminationLabel && (
                        <p className="text-xs text-ink-400 dark:text-ink-500 mt-1">
                          {pickup.contaminationLabel}
                        </p>
                      )}
                    </div>
                  )}

                </div>
              </div>
            </div>

            {/* Location Details */}
            <div className="bg-white dark:bg-ink-800 rounded-lg shadow-sm border border-ink-200 dark:border-ink-700 p-4 sm:p-6">
              <h2 className="text-lg font-medium text-ink-900 dark:text-ink-100 mb-4">Location</h2>

              <div className="space-y-4">
                <div>
                  <span className="text-sm text-ink-600 dark:text-ink-400">Pickup Address</span>
                  <p className="font-medium text-ink-900 dark:text-ink-100">{pickup.address}</p>
                </div>

                {pickup.lat && pickup.lng && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-ink-600 dark:text-ink-400">Latitude</span>
                      <p className="font-medium text-ink-900 dark:text-ink-100">{pickup.lat}</p>
                    </div>
                    <div>
                      <span className="text-sm text-ink-600 dark:text-ink-400">Longitude</span>
                      <p className="font-medium text-ink-900 dark:text-ink-100">{pickup.lng}</p>
                    </div>
                  </div>
                )}

                {pickup.deliveredAddress && (
                  <div>
                    <span className="text-sm text-ink-600 dark:text-ink-400">Delivered To</span>
                    <p className="font-medium text-ink-900 dark:text-ink-100">{pickup.deliveredAddress}</p>
                  </div>
                )}

                <div className="mt-4">
                  <RealTimeMap
                    className="w-full"
                    height={300}
                    pickupLocation={pickup.lat && pickup.lng ? { lat: pickup.lat, lng: pickup.lng } : undefined}
                    driverLocation={currentLocation || undefined}
                    householdLocation={pickup.lat && pickup.lng ? { lat: pickup.lat, lng: pickup.lng, timestamp: Date.now() } : undefined}
                    showDriverTracking={canTrackLocation}
                    onLocationUpdate={(location) => {
                      // Location updates are handled by the LocationContext
                      console.log('Location updated:', location);
                    }}
                  />

                  {canTrackLocation && (
                    <div className="mt-4 flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span className="text-sm font-medium">
                          {isTracking ? 'Location tracking active' : 'Location tracking stopped'}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        {!isTracking ? (
                          <Button
                            size="sm"
                            onClick={startTracking}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Start Tracking
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={stopTracking}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            Stop Tracking
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            {(canClaim || canMarkPickedUp || canMarkCompleted || canAcceptOrReject) && (
              <div className="bg-white rounded-lg shadow-sm border border-ink-200 p-4 sm:p-6">
                <h2 className="text-lg font-medium text-ink-900 mb-4">Actions</h2>

                <div className="flex flex-col sm:flex-row gap-4">
                  {canClaim && (
                    <Button
                      onClick={async () => {
                        try {
                          await apiService.claimPickup(pickup._id);
                          toast.success('Pickup claimed successfully!');
                          fetchPickup(pickup._id);
                        } catch {
                          toast.error('Failed to claim pickup');
                        }
                      }}
                      className="w-full sm:w-auto"
                    >
                      Claim Pickup
                    </Button>
                  )}

                  {canMarkPickedUp && (
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          await apiService.markPickedUp(pickup._id, {});
                          toast.success('Pickup marked as picked up!');
                          fetchPickup(pickup._id);
                        } catch {
                          toast.error('Failed to mark as picked up');
                        }
                      }}
                      className="w-full sm:w-auto"
                    >
                      Mark as Picked Up
                    </Button>
                  )}

                  {canMarkCompleted && (
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          await apiService.markCompleted(pickup._id, { actualWeightKg: pickup.actualWeightKg || 0 });
                          toast.success('Pickup marked as completed!');
                          fetchPickup(pickup._id);
                        } catch {
                          toast.error('Failed to mark as completed');
                        }
                      }}
                      className="w-full sm:w-auto"
                    >
                      Mark as Completed
                    </Button>
                  )}

                  {canAcceptOrReject && (
                    <>
                      <Button
                        variant="success"
                        disabled={acceptLoading}
                        onClick={async () => {
                          setAcceptLoading(true);
                          try {
                            await apiService.receivePickup(pickup._id, { receivedWeightKg: pickup.actualWeightKg || 0 });
                            toast.success('Pickup accepted successfully!');
                            fetchPickup(pickup._id);
                          } catch {
                            toast.error('Failed to accept pickup');
                          } finally {
                            setAcceptLoading(false);
                          }
                        }}
                        className="w-full sm:w-auto"
                      >
                        Accept Pickup
                      </Button>
                      <Button
                        variant="error"
                        disabled={rejectLoading}
                        onClick={() => setShowRejectModal(true)}
                        className="w-full sm:w-auto"
                      >
                        Reject Pickup
                      </Button>
                    </>
                  )}
                </div>
                {/* Reject Modal */}
                {showRejectModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                      <h3 className="text-lg font-bold mb-2">Reject Pickup</h3>
                      <p className="mb-4 text-sm">Please provide a reason for rejection:</p>
                      <textarea
                        className="w-full border rounded p-2 mb-4"
                        rows={3}
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        placeholder="Reason for rejection"
                      />
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setShowRejectModal(false)}>Cancel</Button>
                        <Button
                          variant="error"
                          disabled={rejectLoading || !rejectReason}
                          onClick={async () => {
                            setRejectLoading(true);
                            try {
                              await apiService.rejectPickup(pickup._id, { reason: rejectReason });
                              toast.success('Pickup rejected successfully!');
                              setShowRejectModal(false);
                              fetchPickup(pickup._id);
                            } catch {
                              toast.error('Failed to reject pickup');
                            } finally {
                              setRejectLoading(false);
                            }
                          }}
                        >
                          Confirm Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Timeline */}
            <div className="bg-white rounded-lg shadow-sm border border-ink-200 p-4 sm:p-6">
              <h2 className="text-lg font-medium text-ink-900 mb-4">Timeline</h2>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink-900">Request Created</p>
                    <p className="text-xs text-ink-500">{new Date(pickup.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                {pickup.status !== 'pending' && (
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink-900">Assigned</p>
                      <p className="text-xs text-ink-500">Recently</p>
                    </div>
                  </div>
                )}

                {['completed', 'processed'].includes(pickup.status) && (
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink-900">Completed</p>
                      <p className="text-xs text-ink-500">Recently</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {pickup.notes && (
              <div className="bg-white rounded-lg shadow-sm border border-ink-200 p-4 sm:p-6">
                <h2 className="text-lg font-medium text-ink-900 mb-4">Notes</h2>
                <p className="text-sm text-ink-600">{pickup.notes}</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
