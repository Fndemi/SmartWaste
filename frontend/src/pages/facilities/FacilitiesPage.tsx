import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { AddressAutocomplete } from '../../components/map/AddressAutocomplete';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { type Facility, type WasteType, type CreateFacilityRequest } from '../../types';
import {
  Building,
  MapPin,
  Package,
  Phone,
  Mail,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const wasteTypeColors: Record<WasteType, string> = {
  organic: 'bg-teal-100 text-teal-800',
  plastic: 'bg-brand-100 text-brand-800',
  metal: 'bg-ink-100 text-ink-800',
  paper: 'bg-accent-100 text-accent-800',
  glass: 'bg-teal-100 text-teal-800',
  e_waste: 'bg-red-100 text-red-800',
  other: 'bg-ink-100 text-ink-800',
};

export function FacilitiesPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const { user } = useAuth();

  const [formData, setFormData] = useState<CreateFacilityRequest>({
    kind: 'recycler',
    name: '',
    address: '',
    lat: undefined,
    lng: undefined,
    accepts: [] as WasteType[],
    capacityKg: undefined,
    phone: '',
    email: '',
    hours: '',
    active: true,
  });

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const response = await apiService.getFacilities();
      setFacilities(response.data.data || []);
    } catch {
      toast.error('Failed to fetch facilities');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.createFacility(formData);
      toast.success('Facility created successfully!');
      setShowCreateForm(false);
      resetForm();
      fetchFacilities();
    } catch {
      toast.error('Failed to create facility');
    }
  };

  const handleUpdateFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.error('Update not supported yet');
  };

  const handleDeleteFacility = async (facilityId: string) => {
    try {
      await apiService.deleteFacility(facilityId);
      toast.success('Facility deleted successfully!');
      fetchFacilities();
    } catch {
      toast.error('Failed to delete facility');
    }
    toast.error('Delete not supported yet');
  };

  const resetForm = () => {
    setFormData({
      kind: 'recycler',
      name: '',
      address: '',
      lat: undefined,
      lng: undefined,
      accepts: [],
      capacityKg: undefined,
      phone: '',
      email: '',
      hours: '',
      active: true,
    });
  };

  const startEdit = (facility: Facility) => {
    setEditingFacility(facility);
    setFormData({
      kind: facility.kind,
      name: facility.name,
      address: facility.address || '',
      lat: facility.geom?.coordinates?.[1],
      lng: facility.geom?.coordinates?.[0],
      accepts: facility.accepts,
      capacityKg: facility.capacityKg,
      phone: facility.phone || '',
      email: facility.email || '',
      hours: facility.hours || '',
      active: facility.active,
    });
    setShowCreateForm(true);
  };

  const cancelEdit = () => {
    setEditingFacility(null);
    setShowCreateForm(false);
    resetForm();
  };

  const toggleWasteType = (wasteType: WasteType) => {
    setFormData(prev => ({
      ...prev,
      accepts: prev.accepts.includes(wasteType)
        ? prev.accepts.filter(type => type !== wasteType)
        : [...prev.accepts, wasteType]
    }));
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }));
          toast.success('Location detected successfully!');
        },
        () => {
          toast.error('Unable to get your location. Please enter it manually.');
        }
      );
    } else {
      toast.error('Geolocation is not supported by this browser.');
    }
  };

  const canManageFacilities = user?.role === 'RECYCLER' || user?.role === 'ADMIN' || user?.role === 'COUNCIL';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-ink-900">Facilities</h1>
            <p className="text-ink-700 mt-1">
              Manage recycling and waste processing facilities
            </p>
          </div>
          {canManageFacilities && (
            <Button onClick={() => setShowCreateForm(true)} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add Facility</span>
            </Button>
          )}
        </div>

        {/* Create/Edit Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-sm border border-ink-200 p-6">
            <h2 className="text-lg font-medium text-ink-900 mb-4">
              {editingFacility ? 'Edit Facility' : 'Create New Facility'}
            </h2>

            <form onSubmit={editingFacility ? handleUpdateFacility : handleCreateFacility} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Facility Name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter facility name"
                  required
                />

                <Input
                  label="Capacity (kg)"
                  type="number"
                  value={formData.capacityKg ?? 0}
                  onChange={(e) => setFormData(prev => ({ ...prev, capacityKg: Number(e.target.value) }))}
                  placeholder="Enter capacity"
                />
              </div>

              <AddressAutocomplete
                label="Address"
                placeholder="Search facility address"
                defaultValue={formData.address}
                onAddressSelected={({ address, lat, lng }) => {
                  setFormData(prev => ({ ...prev, address }));
                  if (lat && lng) {
                    setFormData(prev => ({ ...prev, lat, lng }));
                  }
                }}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Phone"
                  value={formData.phone ?? ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                />

                <Input
                  label="Email"
                  type="email"
                  value={formData.email ?? ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Waste Types Accepted
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(wasteTypeColors).map(([type, colorClass]) => (
                    <label
                      key={type}
                      className={`flex items-center space-x-2 p-2 border rounded-lg cursor-pointer hover:bg-ink-50 ${formData.accepts.includes(type as WasteType)
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-ink-200'
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.accepts.includes(type as WasteType)}
                        onChange={() => toggleWasteType(type as WasteType)}
                        className="rounded"
                      />
                      <span className={`text-xs px-2 py-1 rounded-full ${colorClass}`}>
                        {type.replace('_', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Location Coordinates
                </label>
                <div className="flex items-center space-x-4 mb-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={getCurrentLocation}
                    className="flex items-center"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Use Current Location
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Latitude"
                    type="number"
                    step="any"
                    value={formData.lat ?? 0}
                    onChange={(e) => setFormData(prev => ({ ...prev, lat: Number(e.target.value) }))}
                    placeholder="e.g., 40.7128"
                  />
                  <Input
                    label="Longitude"
                    type="number"
                    step="any"
                    value={formData.lng ?? 0}
                    onChange={(e) => setFormData(prev => ({ ...prev, lng: Number(e.target.value) }))}
                    placeholder="e.g., -74.0060"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingFacility ? 'Update Facility' : 'Create Facility'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Facilities List */}
        <div className="bg-white rounded-lg shadow-sm border border-ink-200">
          {loading ? (
            <div className="p-8 text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-ink-700">Loading facilities...</p>
            </div>
          ) : facilities.length === 0 ? (
            <div className="p-8 text-center">
              <Building className="h-12 w-12 text-ink-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-ink-900 mb-2">No facilities found</h3>
              <p className="text-ink-700 mb-4">
                {canManageFacilities
                  ? "You haven't created any facilities yet."
                  : "No facilities are available at the moment."
                }
              </p>
              {canManageFacilities && (
                <Button onClick={() => setShowCreateForm(true)}>
                  Create Your First Facility
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-ink-200">
              {facilities.map((facility) => (
                <div key={facility._id} className="p-6 hover:bg-ink-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-ink-900">{facility.name}</h3>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${facility.active
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-red-100 text-red-800'
                          }`}>
                          {facility.active ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-ink-700 mb-4">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">{facility.address}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4" />
                          <span>Capacity: {facility.capacityKg ?? 0} kg</span>
                        </div>
                        {/* No currentLoad in backend */}
                      </div>

                      <div className="mb-4">
                        <span className="text-sm text-ink-600">Accepts:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {facility.accepts.map((type) => (
                            <span
                              key={type}
                              className={`text-xs px-2 py-1 rounded-full ${wasteTypeColors[type]}`}
                            >
                              {type.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>

                      {(facility.phone || facility.email) && (
                        <div className="flex items-center space-x-4 text-sm text-ink-700">
                          {facility.phone && (
                            <div className="flex items-center space-x-1">
                              <Phone className="h-4 w-4" />
                              <span>{facility.phone}</span>
                            </div>
                          )}
                          {facility.email && (
                            <div className="flex items-center space-x-1">
                              <Mail className="h-4 w-4" />
                              <span>{facility.email}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {canManageFacilities && (
                      <div className="ml-4 flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(facility)}
                          className="flex items-center space-x-1"
                        >
                          <Edit className="h-4 w-4" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          variant="error"
                          size="sm"
                          onClick={() => handleDeleteFacility(facility._id)}
                          className="flex items-center space-x-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
