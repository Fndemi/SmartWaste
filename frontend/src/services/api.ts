import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { 
  type AuthResponse, 
  type LoginRequest, 
  type RegisterRequest, 
  type ForgotPasswordRequest, 
  type ResetPasswordRequest,
  type ChangePasswordRequest,
  type User,
  type Pickup,
  type CreatePickupRequest,
  type AssignPickupRequest,
  type MarkPickedUpRequest,
  type MarkCompletedRequest,
  type AssignFacilityRequest,
  type RecyclerReceiveRequest,
  type RecyclerRejectRequest,
  type Facility,
  type CreateFacilityRequest,
  type  AIAdviceRequest,
  type  AIAdviceResponse,
  type ApiResponse,
  type Notification,
  type PaginatedResponse
} from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: 'http://localhost:3500', // Your backend URL
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              localStorage.setItem('accessToken', response.data.accessToken);
              localStorage.setItem('refreshToken', response.data.refreshToken);
              
              // Retry original request
              originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
              return this.api(originalRequest);
            }
          } catch {
            // Refresh failed, redirect to login
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<AxiosResponse<AuthResponse>> {
    return this.api.post('/auth/login', credentials);
  }

  async register(userData: RegisterRequest): Promise<AxiosResponse<ApiResponse<User>>> {
    return this.api.post('/auth/register', userData);
  }

  async forgotPassword(data: ForgotPasswordRequest): Promise<AxiosResponse<ApiResponse>> {
    return this.api.post('/auth/forgot-password', data);
  }

  async resetPassword(data: ResetPasswordRequest): Promise<AxiosResponse<ApiResponse>> {
    return this.api.post('/auth/reset-password', data);
  }

  async refreshToken(refreshToken: string): Promise<AxiosResponse<AuthResponse>> {
    return this.api.post('/auth/refresh-token', { refreshToken });
  }

  async logout(): Promise<AxiosResponse<ApiResponse>> {
    return this.api.post('/auth/logout');
  }

  // User endpoints
  async getCurrentUser(): Promise<AxiosResponse<User>> {
    return this.api.get('/users/me');
  }

  async updateProfile(data: Partial<User>): Promise<AxiosResponse<User>> {
    return this.api.put('/users/me', data);
  }

  async changePassword(data: ChangePasswordRequest): Promise<AxiosResponse<ApiResponse>> {
    return this.api.post('/users/me/change-password', data);
  }

  async verifyEmail(token: string): Promise<AxiosResponse<ApiResponse>> {
    return this.api.get(`/users/verify-email?token=${token}`);
  }

  async resendVerification(email: string): Promise<AxiosResponse<ApiResponse>> {
    return this.api.post('/users/resend-verification', { email });
  }

  // Pickup endpoints
  async createPickup(data: CreatePickupRequest, image: File): Promise<AxiosResponse<ApiResponse<Pickup>>> {
    const formData = new FormData();
    formData.append('image', image);
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });

    return this.api.post('/pickups', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async getPickups(): Promise<AxiosResponse<ApiResponse<Pickup[]>>> {
    return this.api.get('/pickups');
  }

  async getPickup(id: string): Promise<AxiosResponse<ApiResponse<Pickup>>> {
    return this.api.get(`/pickups/${id}`);
  }

  async getAvailablePickups(params?: {
    lat?: number;
    lng?: number;
    radiusMeters?: number;
    limit?: number;
  }): Promise<AxiosResponse<ApiResponse<Pickup[]>>> {
    return this.api.get('/pickups/available', { params });
  }

  async assignPickup(id: string, data: AssignPickupRequest): Promise<AxiosResponse<ApiResponse<Pickup>>> {
    return this.api.patch(`/pickups/${id}/assign`, data);
  }

  async claimPickup(id: string): Promise<AxiosResponse<ApiResponse<Pickup>>> {
    return this.api.patch(`/pickups/${id}/claim`);
  }

  async markPickedUp(id: string, data: MarkPickedUpRequest): Promise<AxiosResponse<ApiResponse<Pickup>>> {
    return this.api.patch(`/pickups/${id}/picked-up`, data);
  }

  async markCompleted(id: string, data: MarkCompletedRequest, photo?: File): Promise<AxiosResponse<ApiResponse<Pickup>>> {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });
    if (photo) {
      formData.append('photo', photo);
    }

    return this.api.patch(`/pickups/${id}/completed`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async assignFacility(id: string, data: AssignFacilityRequest): Promise<AxiosResponse<ApiResponse<Pickup>>> {
    return this.api.patch(`/pickups/${id}/assign-facility`, data);
  }

  async receivePickup(id: string, data: RecyclerReceiveRequest): Promise<AxiosResponse<ApiResponse<Pickup>>> {
    return this.api.patch(`/pickups/${id}/receive`, data);
  }

  async rejectPickup(id: string, data: RecyclerRejectRequest): Promise<AxiosResponse<ApiResponse<Pickup>>> {
    return this.api.patch(`/pickups/${id}/reject`, data);
  }

  // AI endpoints
  async getAIAdvice(data: AIAdviceRequest): Promise<AxiosResponse<AIAdviceResponse>> {
    return this.api.post('/pickups/ai/household-advice', data);
  }

  // Facility endpoints (if you have them)
  async getFacilities(): Promise<AxiosResponse<ApiResponse<Facility[]>>> {
    return this.api.get('/facility');
  }

  async createFacility(data: CreateFacilityRequest): Promise<AxiosResponse<ApiResponse<Facility>>> {
    return this.api.post('/facility', data);
  }

  async updateFacility(id: string, data: Partial<CreateFacilityRequest>): Promise<AxiosResponse<ApiResponse<Facility>>> {
    // Not supported by backend currently; keeping route for future use
    return this.api.put(`/facility/${id}`, data);
  }

  async deleteFacility(id: string): Promise<AxiosResponse<ApiResponse>> {
    // Not supported by backend currently; keeping route for future use
    return this.api.delete(`/facility/${id}`);
  }

  // Council dashboard endpoints
  async getCouncilOverview(params?: { from?: string; to?: string; }): Promise<AxiosResponse<ApiResponse<{ byStatus: Array<{ _id: string; count: number }>; byType: Array<{ _id: string; count: number; totalWeightKg: number; avgContamination: number }>; totals: { total: number; totalWeightKg: number; avgContamination: number; processed: number; rejected: number } }>>> {
    return this.api.get('/council/stats/overview', { params });
  }

  // Notifications
  async getNotifications(params?: { page?: number; limit?: number; type?: string; isRead?: boolean }): Promise<AxiosResponse<PaginatedResponse<Notification>>> {
    return this.api.get('/notifications', { params });
  }

  async getUnreadCount(): Promise<AxiosResponse<ApiResponse<{ unreadCount: number }>>> {
    return this.api.get('/notifications/unread-count');
  }

  async markNotificationRead(id: string, isRead: boolean): Promise<AxiosResponse<ApiResponse<Notification>>> {
    return this.api.patch(`/notifications/${id}/read`, { isRead });
  }

  async markAllNotificationsRead(): Promise<AxiosResponse<ApiResponse<{ modifiedCount: number }>>> {
    return this.api.patch('/notifications/read-all');
  }
}

export const apiService = new ApiService();
export default apiService;
