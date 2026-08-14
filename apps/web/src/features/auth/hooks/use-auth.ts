'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/use-auth-store';
import { usePropertyStore } from '@/features/properties/store/use-property-store';
import {
  LoginPayload,
  LoginResponse,
  OwnerSignupPayload,
  OwnerSignupResponse,
} from '../types/auth.types';

export function useAuthProfileQuery() {
  const setUser = useAuthStore((state) => state.setUser);

  return useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: async () => {
      const data = await authService.getProfile();
      const userObj = data?.user || data?.data?.user || data;
      if (userObj) {
        setUser(userObj);
      }
      return data;
    },
    staleTime: 5000, // 5 seconds fresh stale time for immediate auth updates
    gcTime: 60000,
    refetchOnWindowFocus: true,
    retry: 1,
  });
}

export function useAuth() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  const setActiveProperty = usePropertyStore((state) => state.setActiveProperty);
  const setProperties = usePropertyStore((state) => state.setProperties);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const clearUserSession = () => {
    queryClient.clear();
    setUser(null);
    setActiveProperty(null);
    setProperties([]);
  };

  const login = async (payload: LoginPayload): Promise<LoginResponse> => {
    setLoading(true);
    setError(null);
    try {
      const res = await authService.login(payload);
      const userObj = res?.user || (res as any)?.data?.user;
      if (userObj) {
        setUser({
          id: userObj.id,
          email: userObj.email,
          role: userObj.role,
          organizationId: userObj.organizationId,
          name: userObj.fullName || userObj.name || userObj.email?.split('@')[0],
        });
        queryClient.setQueryData(['auth', 'profile'], { user: userObj, data: { user: userObj } });
      }
      return res;
    } catch (err: any) {
      setError(err.message || 'Login failed.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const ownerSignup = async (payload: OwnerSignupPayload): Promise<OwnerSignupResponse> => {
    setLoading(true);
    setError(null);
    try {
      return await authService.ownerSignup(payload);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const staffSignup = async (payload: { name: string; email: string; password: string; phone?: string }): Promise<LoginResponse> => {
    setLoading(true);
    setError(null);
    try {
      const res = await authService.staffSignup(payload);
      const userObj = res?.user || (res as any)?.data?.user;
      if (userObj) {
        setUser({
          id: userObj.id,
          email: userObj.email,
          role: userObj.role,
          organizationId: userObj.organizationId,
          name: userObj.fullName || userObj.name || userObj.email?.split('@')[0],
        });
        queryClient.setQueryData(['auth', 'profile'], { user: userObj, data: { user: userObj } });
      }
      return res;
    } catch (err: any) {
      setError(err.message || 'Staff registration failed.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await authService.logout();
      clearUserSession();
    } catch (err: any) {
      setError(err.message || 'Logout failed.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    clearError,
    login,
    ownerSignup,
    staffSignup,
    logout,
  };
}
