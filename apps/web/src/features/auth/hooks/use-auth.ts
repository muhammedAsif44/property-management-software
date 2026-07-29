'use client';

import { useState } from 'react';
import { authService } from '../services/auth.service';
import {
  LoginPayload,
  LoginResponse,
  OwnerSignupPayload,
  OwnerSignupResponse,
} from '../types/auth.types';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const login = async (payload: LoginPayload): Promise<LoginResponse> => {
    setLoading(true);
    setError(null);
    try {
      return await authService.login(payload);
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

  const logout = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await authService.logout();
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
    logout,
  };
}
