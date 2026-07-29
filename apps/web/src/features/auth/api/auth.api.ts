import { httpClient } from '@/lib/api/http-client';
import {
  LoginPayload,
  LoginResponse,
  OwnerSignupPayload,
  OwnerSignupResponse,
} from '../types/auth.types';

export const authApi = {
  /**
   * Owner Signup (Company & Owner account creation)
   */
  ownerSignup: (data: OwnerSignupPayload): Promise<OwnerSignupResponse> => {
    return httpClient.post<OwnerSignupResponse>('/auth/signup/owner', data);
  },

  /**
   * Login (Email + Password authentication)
   */
  login: (data: LoginPayload): Promise<LoginResponse> => {
    return httpClient.post<LoginResponse>('/auth/login', data);
  },

  /**
   * Get Current Authenticated Profile
   */
  getProfile: (): Promise<{ user: any }> => {
    return httpClient.get<{ user: any }>('/auth/me');
  },

  /**
   * Logout user and revoke tokens
   */
  logout: (): Promise<{ message: string }> => {
    return httpClient.post<{ message: string }>('/auth/logout');
  },

  /**
   * Request password reset token
   */
  forgotPassword: (email: string): Promise<{ message: string }> => {
    return httpClient.post<{ message: string }>('/auth/forgot-password', { email });
  },

  /**
   * Reset password with reset token
   */
  resetPassword: (payload: { token: string; email: string; newPassword: string }): Promise<{ message: string }> => {
    return httpClient.post<{ message: string }>('/auth/reset-password', payload);
  },
};
