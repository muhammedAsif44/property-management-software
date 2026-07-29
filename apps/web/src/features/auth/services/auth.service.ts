import { httpClient } from '@/lib/api/http-client';
import {
  LoginPayload,
  LoginResponse,
  OwnerSignupPayload,
  OwnerSignupResponse,
} from '../types/auth.types';

export const authService = {
  // Login user
  login: (data: LoginPayload) =>
    httpClient.post<LoginResponse>('/auth/login', data),

  // Register company & owner
  ownerSignup: (data: OwnerSignupPayload) =>
    httpClient.post<OwnerSignupResponse>('/auth/signup/owner', data),

  // Get current user profile
  getProfile: () => httpClient.get<{ user: any }>('/auth/me'),

  // Secure Logout (Clears session on server and revokes refresh_token)
  logout: () => httpClient.post<{ message: string }>('/auth/logout'),

  // Forgot password request
  forgotPassword: (email: string) =>
    httpClient.post<{ message: string; resetToken?: string }>('/auth/forgot-password', { email }),

  // Reset password using token
  resetPassword: (data: { email: string; token: string; newPassword: string }) =>
    httpClient.post<{ message: string }>('/auth/reset-password', data),

  // Change password (Requires current password verification)
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    httpClient.patch<{ message: string }>('/auth/change-password', data),

  // Change email (Requires password verification & tenant email uniqueness check)
  changeEmail: (data: { password: string; newEmail: string }) =>
    httpClient.patch<{ message: string; email: string }>('/auth/change-email', data),
};
