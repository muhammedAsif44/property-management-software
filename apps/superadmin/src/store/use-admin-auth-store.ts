import { create } from 'zustand';

export interface AdminUserSession {
  id: string;
  email: string;
  role: string;
  organizationId?: string;
  fullName?: string;
}

interface AdminAuthState {
  user: AdminUserSession | null;
  isAuthenticated: boolean;
  isSessionChecking: boolean;
  setUser: (user: AdminUserSession | null) => void;
  setSessionChecking: (checking: boolean) => void;
  clearSession: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isSessionChecking: true,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setSessionChecking: (isSessionChecking) => set({ isSessionChecking }),
  clearSession: () => set({ user: null, isAuthenticated: false, isSessionChecking: false }),
}));
