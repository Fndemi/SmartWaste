// User types
export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'USER' | 'ADMIN' | 'COLLECTOR' | 'RECYCLER' | 'HOUSEHOLD' | 'SME' | 'DRIVER' | 'COUNCIL';

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Pickup types
export type WasteType = 'organic' | 'plastic' | 'metal' | 'paper' | 'glass' | 'e_waste' | 'other';

export interface CreatePickupRequest {
  wasteType: WasteType;
  estimatedWeightKg: number;
  description?: string;
  address: string;
  lat: number;
  lng: number;
}

export interface Pickup {
  _id: string;
  wasteType: WasteType;
  estimatedWeightKg: number;
  actualWeightKg?: number;
  receivedWeightKg?: number;
  description?: string;
  address: string;
  lat: number;
  lng: number;
  deliveredAddress?: string;
  deliveredLat?: number;
  deliveredLng?: number;
  status: PickupStatus;
  requestedBy: string;
  assignedTo?: string;
  facilityId?: string;
  imageUrl: string;
  completionPhotoUrl?: string;
  contaminationScore?: number;
  contaminationLabel?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type PickupStatus =
  | 'pending'
  | 'assigned'
  | 'picked_up'
  | 'completed'
  | 'processed'
  | 'rejected'
  | 'cancelled';

export interface AssignPickupRequest {
  driverId: string;
}

export interface MarkPickedUpRequest {
  notes?: string;
}

export interface MarkCompletedRequest {
  actualWeightKg: number;
  deliveredAddress?: string;
  lat?: number;
  lng?: number;
}

export interface AssignFacilityRequest {
  facilityId: string;
}

export interface RecyclerReceiveRequest {
  receivedWeightKg: number;
  notes?: string;
}

export interface RecyclerRejectRequest {
  reason: string;
  notes?: string;
}

// Facility types
export interface Facility {
  _id: string;
  kind: 'recycler' | 'transfer' | 'landfill';
  name: string;
  address?: string;
  geom?: { type: 'Point'; coordinates: [number, number] }; // [lng, lat]
  accepts: WasteType[];
  capacityKg?: number;
  phone?: string;
  email?: string;
  hours?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFacilityRequest {
  kind: 'recycler' | 'transfer' | 'landfill';
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
  accepts: WasteType[];
  capacityKg?: number;
  phone?: string;
  email?: string;
  hours?: string;
  active?: boolean;
}

// AI types
export interface AIAdviceRequest {
  prompt: string;
}

export interface AIAdviceResponse {
  status: 'success';
  text: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  status: 'success';
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form types
export interface FormError {
  field: string;
  message: string;
}

// Dashboard stats
export interface DashboardStats {
  totalPickups: number;
  pendingPickups: number;
  completedPickups: number;
  totalWeight: number;
  monthlyStats: {
    month: string;
    pickups: number;
    weight: number;
  }[];
}

// Notification types
export interface Notification {
  _id: string;
  title: string;
  message: string;
  type:
    | 'PICKUP_CREATED'
    | 'PICKUP_ASSIGNED'
    | 'PICKUP_PICKED_UP'
    | 'PICKUP_COMPLETED'
    | 'PICKUP_PROCESSED'
    | 'PICKUP_REJECTED'
    | 'PICKUP_CANCELLED'
    | 'PICKUP_ASSIGNED_TO_YOU'
    | 'FACILITY_ASSIGNED'
    | 'PICKUP_REASSIGNED'
    | 'PICKUP_INCOMING'
    | 'HIGH_CONTAMINATION_WARNING';
  isRead: boolean;
  recipientId: string;
  pickupId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
