import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Upload, MapPin, Package, Camera } from 'lucide-react';
import { AddressAutocomplete } from '../../components/map/AddressAutocomplete';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Input';
import { apiService } from '../../services/api';
import { type WasteType } from '../../types';
import toast from 'react-hot-toast';

const wasteTypes: { value: WasteType; label: string; description: string; icon: string }[] = [
  { value: 'organic', label: 'Organic Waste', description: 'Food scraps, garden waste', icon: '🍎' },
  { value: 'plastic', label: 'Plastic', description: 'Bottles, containers, packaging', icon: '🥤' },
  { value: 'metal', label: 'Metal', description: 'Cans, scrap metal, electronics', icon: '🥫' },
  { value: 'paper', label: 'Paper', description: 'Newspapers, cardboard, books', icon: '📄' },
  { value: 'glass', label: 'Glass', description: 'Bottles, jars, broken glass', icon: '🍾' },
  { value: 'e_waste', label: 'E-Waste', description: 'Electronics, batteries, devices', icon: '🔌' },
  { value: 'other', label: 'Other', description: 'Mixed or unspecified waste', icon: '🗑️' },
];

export function CreatePickupPage() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  type CreatePickupForm = {
    wasteType: WasteType;
    estimatedWeightKg: number;
    description?: string;
    address: string;
    lat?: number;
    lng?: number;
    image?: File;
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreatePickupForm>();

  const selectedWasteType = watch('wasteType');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setValue('lat', position.coords.latitude);
          setValue('lng', position.coords.longitude);
          toast.success('Location detected successfully!');
        },
        (error) => {
          toast.error('Unable to get your location. Please enter it manually.');
          console.error('Geolocation error:', error);
        }
      );
    } else {
      toast.error('Geolocation is not supported by this browser.');
    }
  };

  const onSubmit = async (data: CreatePickupForm) => {
    if (!selectedImage) {
      toast.error('Please select an image of your waste');
      return;
    }

    setIsSubmitting(true);
    try {
      // Extract only the fields we need for the API call
      const { wasteType, estimatedWeightKg, description, address, lat, lng } = data;
      const payload = {
        wasteType,
        estimatedWeightKg,
        description,
        address,
        lat: lat ?? 0,
        lng: lng ?? 0,
      };
      await apiService.createPickup(payload, selectedImage);
      toast.success('Pickup request created successfully!');
      navigate('/dashboard');
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create pickup request';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-ink-900">Request Waste Pickup</h1>
          <p className="text-ink-700 mt-1">
            Schedule a pickup for your waste materials
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Image Upload */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-ink-900 flex items-center">
                <Camera className="h-5 w-5 mr-2" />
                Waste Photo
              </h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-ink-300 border-dashed rounded-lg cursor-pointer bg-ink-50 hover:bg-white">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-4 text-ink-500" />
                    <p className="mb-2 text-sm text-ink-600">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-ink-600">PNG, JPG, GIF up to 5MB</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              </div>

              {imagePreview && (
                <div className="mt-4">
                  <img
                    src={imagePreview}
                    alt="Waste preview"
                    className="w-full h-48 object-cover rounded-lg border border-ink-200"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Waste Type Selection */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-ink-900 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Waste Type
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {wasteTypes.map((type) => (
                <label
                  key={type.value}
                  className={`relative flex items-center p-4 border rounded-lg cursor-pointer hover:bg-ink-50 ${selectedWasteType === type.value
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-ink-200'
                    }`}
                >
                  <input
                    {...register('wasteType')}
                    type="radio"
                    value={type.value}
                    className="sr-only"
                  />
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{type.icon}</span>
                    <div>
                      <div className="text-sm font-medium text-ink-900">{type.label}</div>
                      <div className="text-xs text-ink-600">{type.description}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            {errors.wasteType && (
              <p className="mt-2 text-sm text-error-600">{errors.wasteType.message as string}</p>
            )}
          </div>

          {/* Weight and Description */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-ink-900">Details</h3>
            </div>

            <div className="space-y-4">
              <Input
                {...register('estimatedWeightKg', { valueAsNumber: true })}
                type="number"
                step="0.1"
                min="0.1"
                label="Estimated Weight (kg)"
                placeholder="Enter estimated weight"
                error={errors.estimatedWeightKg?.message as string}
              />

              <Textarea
                {...register('description')}
                label="Description (Optional)"
                placeholder="Describe your waste or any special instructions..."
                error={errors.description?.message as string}
                rows={3}
              />
            </div>
          </div>

          {/* Location */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-ink-900 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Pickup Location
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <AddressAutocomplete
                  label="Address"
                  placeholder="Start typing your pickup address..."
                  onAddressSelected={({ address, lat, lng }) => {
                    setValue('address', address, { shouldValidate: true });
                    if (lat && lng) {
                      setValue('lat', lat);
                      setValue('lng', lng);
                    }
                  }}
                  error={errors.address?.message as string}
                />
              </div>

              <div className="flex items-center space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={getCurrentLocation}
                  className="flex items-center"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Use Current Location
                </Button>
                <span className="text-sm text-ink-600">
                  Or enter coordinates manually
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  {...register('lat', { valueAsNumber: true })}
                  type="number"
                  step="any"
                  label="Latitude"
                  placeholder="e.g., 40.7128"
                  error={errors.lat?.message as string}
                />
                <Input
                  {...register('lng', { valueAsNumber: true })}
                  type="number"
                  step="any"
                  label="Longitude"
                  placeholder="e.g., -74.0060"
                  error={errors.lng?.message as string | undefined}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting || !selectedImage}
            >
              Create Pickup Request
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
