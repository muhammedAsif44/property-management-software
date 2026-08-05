'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  ShieldCheck,
  UserCheck,
  UserX,
  Clock,
  Building2,
  Mail,
  Phone,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Lock,
  LogOut,
  ArrowRight,
  Shield,
  LayoutDashboard,
  Users,
  FileCheck2,
  Activity,
  Sliders,
  Bell,
  ChevronRight,
} from 'lucide-react';

import { useAdminAuthStore } from '../store/use-admin-auth-store';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface PendingOwner {
  id: string;
  email: string;
  phone?: string;
  role: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  organization?: {
    id: string;
    name: string;
    slug: string;
  };
  owner?: {
    id: string;
    fullName: string;
    whatsappNumber?: string;
    defaultProperty?: {
      id: string;
      name: string;
    };
  };
}

export default function AdminDashboardPage() {
  const {
    user,
    isAuthenticated,
    isSessionChecking,
    setUser,
    setSessionChecking,
    clearSession,
  } = useAdminAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loadingLogin, setLoadingLogin] = useState(false);

  const [activeTab, setActiveTab] = useState<'approvals' | 'organizations' | 'security' | 'announcements'>('approvals');
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [announcementType, setAnnouncementType] = useState('SYSTEM');
  const [announcementTargetRole, setAnnouncementTargetRole] = useState('ALL');
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);
  const [pendingOwners, setPendingOwners] = useState<PendingOwner[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loadingOwners, setLoadingOwners] = useState(false);
  const [loadingOrganizations, setLoadingOrganizations] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Rejection Modal State
  const [rejectingUser, setRejectingUser] = useState<PendingOwner | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Robust Authenticated Fetch with Silent HTTP-Only Token Refresh
  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    let res = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      credentials: 'include',
    });

    if (res.status === 401) {
      // Attempt silent token refresh via HTTP-only cookie
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (refreshRes.ok) {
        // Retry original request with newly issued access cookie
        res = await fetch(url, {
          ...options,
          headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
          credentials: 'include',
        });
      }
    }

    return res;
  };

  // Login Super Admin
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingLogin(true);
    setLoginError('');

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const raw = await res.json();
      const payload = raw.data || raw;

      if (!res.ok) {
        throw new Error(raw.message || payload.message || 'Login failed');
      }

      const user = payload.user || raw.user;

      if (user?.role !== 'SUPER_ADMIN') {
        throw new Error('Only Super Admin accounts can access this portal');
      }

      setUser(user);
      showToast('Welcome Super Admin! Signed in successfully.');
      fetchPendingOwners();
      fetchOrganizations();
    } catch (err: any) {
      setLoginError(err.message || 'Super Admin login failed');
    } finally {
      setLoadingLogin(false);
    }
  };

  // Fetch Pending Owners
  const fetchPendingOwners = async () => {
    setLoadingOwners(true);
    try {
      const res = await authenticatedFetch(`${API_BASE}/admin/pending-owners`);

      if (res.status === 401) {
        clearSession();
        return;
      }

      const raw = await res.json();
      if (res.ok) {
        const payload = raw.data || raw;
        const ownersList = payload.pendingOwners || raw.pendingOwners || [];
        setPendingOwners(ownersList);
      }
    } catch (err) {
      console.error('Failed to fetch pending owners:', err);
    } finally {
      setLoadingOwners(false);
    }
  };

  // Fetch All Organizations
  const fetchOrganizations = async () => {
    setLoadingOrganizations(true);
    try {
      const res = await authenticatedFetch(`${API_BASE}/admin/organizations`);

      if (res.ok) {
        const raw = await res.json();
        const payload = raw.data || raw;
        const orgsList = payload.organizations || raw.organizations || [];
        setOrganizations(orgsList);
      }
    } catch (err) {
      console.error('Failed to fetch organizations:', err);
    } finally {
      setLoadingOrganizations(false);
    }
  };

  // Session Persistence via HTTP-Only Cookies & Automatic Token Rotation Fallback
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await authenticatedFetch(`${API_BASE}/auth/me`);

        if (res.ok) {
          const raw = await res.json();
          const payload = raw.data || raw;
          const user = payload.user || raw.user;

          if (user?.role === 'SUPER_ADMIN') {
            setUser(user);
            fetchPendingOwners();
            fetchOrganizations();
          } else {
            clearSession();
          }
        } else {
          clearSession();
        }
      } catch (err) {
        clearSession();
      } finally {
        setSessionChecking(false);
      }
    };
    checkSession();
  }, []);

  // Automatically refetch queue & directory when active tab changes or user authenticates
  useEffect(() => {
    if (isAuthenticated) {
      fetchPendingOwners();
      fetchOrganizations();
    }
  }, [activeTab, isAuthenticated]);

  // Approve Owner
  const handleApprove = async (userId: string, ownerName: string) => {
    setActionLoadingId(userId);
    try {
      const res = await authenticatedFetch(`${API_BASE}/admin/owners/${userId}/approve`, {
        method: 'PATCH',
      });

      const raw = await res.json();
      const data = raw.data || raw;

      if (!res.ok) {
        throw new Error(raw.message || data.message || 'Failed to approve owner');
      }

      showToast(`Approved owner application for ${ownerName || 'User'}!`);
      fetchPendingOwners();
      fetchOrganizations();
    } catch (err: any) {
      showToast(err.message || 'Approval failed', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Submit Rejection
  const handleConfirmReject = async () => {
    if (!rejectingUser) return;
    setActionLoadingId(rejectingUser.id);

    try {
      const res = await authenticatedFetch(`${API_BASE}/admin/owners/${rejectingUser.id}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ rejectionReason }),
      });

      const raw = await res.json();
      const data = raw.data || raw;

      if (!res.ok) {
        throw new Error(raw.message || data.message || 'Failed to reject owner application');
      }

      showToast(`Rejected owner application for ${rejectingUser.owner?.fullName || rejectingUser.email}`, 'error');
      setRejectingUser(null);
      setRejectionReason('');
      fetchPendingOwners();
      fetchOrganizations();
    } catch (err: any) {
      showToast(err.message || 'Rejection failed', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
    } catch (e) {
      // ignore
    }
    clearSession();
    showToast('Logged out of Super Admin Portal');
  };

  const [approvalStatusFilter, setApprovalStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  // Filter owners by status & search query
  const filteredOwners = pendingOwners.filter((owner) => {
    const query = searchQuery.toLowerCase();
    const name = owner.owner?.fullName?.toLowerCase() || '';
    const emailStr = owner.email.toLowerCase();
    const propName = owner.organization?.name?.toLowerCase() || '';
    const matchesQuery = name.includes(query) || emailStr.includes(query) || propName.includes(query);
    const matchesStatus = approvalStatusFilter === 'ALL' || owner.approvalStatus === approvalStatusFilter;
    return matchesQuery && matchesStatus;
  });

  const pendingCount = pendingOwners.filter((o) => o.approvalStatus === 'PENDING').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-[#360CAF] selection:text-white relative">
      
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[60] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-md transition-all duration-300 animate-fade-in-up ${
            toast.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : 'bg-rose-900 text-white border-rose-700'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-300" /> : <AlertCircle className="w-5 h-5 text-rose-300" />}
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Session Check Loading State */}
      {isSessionChecking ? (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#360CAF]" />
            <span className="text-sm font-semibold text-slate-500">Verifying Session...</span>
          </div>
        </div>
      ) : !isAuthenticated ? (
        /* SUPER ADMIN LOGIN FORM */
        <div className="min-h-screen flex flex-col justify-center items-center p-6 relative overflow-hidden bg-slate-50">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#360CAF]/10 rounded-full blur-3xl pointer-events-none" />

          <main className="max-w-md w-full z-10">
            <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-10 shadow-2xl shadow-indigo-950/10 backdrop-blur-xl animate-fade-in-up">
              
              <div className="text-center mb-8 flex flex-col items-center">
                <Image
                  src="/orvyn-logo.png"
                  alt="Orvyn PMS Logo"
                  width={220}
                  height={70}
                  className="h-16 w-auto object-contain drop-shadow-sm mb-4"
                  priority
                />

                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Super Admin Portal
                </h2>
                <p className="text-slate-500 text-xs mt-1">
                  Enter your administrative credentials to manage company approvals.
                </p>
              </div>

              {loginError && (
                <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Admin Email
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-4 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-[#360CAF] focus:ring-2 focus:ring-[#360CAF]/30 focus:bg-white transition-all"
                      placeholder="admin@orvyn.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-4 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-[#360CAF] focus:ring-2 focus:ring-[#360CAF]/30 focus:bg-white transition-all"
                      placeholder="••••••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loadingLogin}
                  className="w-full py-4 rounded-2xl bg-[#360CAF] hover:bg-[#2d0a94] active:bg-[#25087a] text-white font-bold text-sm shadow-xl shadow-[#360CAF]/25 transition-all duration-200 flex items-center justify-center gap-2 mt-6"
                >
                  {loadingLogin ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Authenticating...
                    </>
                  ) : (
                    <>
                      Sign In to Portal <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 text-center text-xs text-slate-400 font-medium">
                Protected Governance Gate — Powered by <strong>Orvyn Labs Inc.</strong>
              </div>
            </div>
          </main>
        </div>
      ) : (
        /* INDUSTRY STANDARD SUPER ADMIN DASHBOARD WITH LEFT SIDEBAR */
        <div className="flex min-h-screen bg-slate-50">

          {/* Mobile Sidebar Backdrop */}
          {mobileSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/40 z-30 lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
          )}
          
          {/* LEFT SIDEBAR NAVIGATION */}
          <aside className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between p-6 shrink-0 shadow-sm z-40 transition-transform duration-200 lg:translate-x-0 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
            <div>
              {/* Brand Logo Header */}
              <div className="mb-8 px-2">
                <Image
                  src="/orvyn-logo.png"
                  alt="Orvyn PMS Logo"
                  width={200}
                  height={60}
                  className="h-12 w-auto object-contain drop-shadow-sm"
                  priority
                />
              </div>

              {/* Sidebar Section Title */}
              <div className="px-3 mb-3 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                Management Portal
              </div>

              {/* Navigation Items */}
              <nav className="space-y-1.5">
                
                <button
                  onClick={() => setActiveTab('approvals')}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-bold text-xs transition-all duration-200 ${
                    activeTab === 'approvals'
                      ? 'bg-[#360CAF] text-white shadow-lg shadow-[#360CAF]/25'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FileCheck2 className="w-4 h-4" />
                    <span>Company Approvals</span>
                  </div>
                  {pendingOwners.length > 0 && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        activeTab === 'approvals'
                          ? 'bg-white text-[#360CAF]'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {pendingOwners.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('organizations')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs transition-all duration-200 ${
                    activeTab === 'organizations'
                      ? 'bg-[#360CAF] text-white shadow-lg shadow-[#360CAF]/25'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Organizations</span>
                </button>

                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs transition-all duration-200 ${
                    activeTab === 'security'
                      ? 'bg-[#360CAF] text-white shadow-lg shadow-[#360CAF]/25'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Security & Audit</span>
                </button>

                <button
                  onClick={() => setActiveTab('announcements')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs transition-all duration-200 ${
                    activeTab === 'announcements'
                      ? 'bg-[#360CAF] text-white shadow-lg shadow-[#360CAF]/25'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  <span>Announcements</span>
                </button>

              </nav>
            </div>

            {/* Bottom Admin User Profile Card */}
            <div className="pt-6 border-t border-slate-100 space-y-3">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#360CAF] text-white font-bold flex items-center justify-center text-xs">
                  SA
                </div>
                <div className="truncate flex-1">
                  <div className="font-bold text-slate-900 text-xs truncate">Super Admin</div>
                  <div className="text-[11px] text-slate-500 truncate">admin@orvyn.com</div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-rose-50 hover:text-rose-600 border border-slate-200 text-slate-700 text-xs font-bold shadow-sm transition-all duration-200 flex items-center justify-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>

          </aside>

          {/* RIGHT MAIN CONTENT AREA */}
          <div className="flex-1 flex flex-col min-w-0">
            
            {/* Top Navigation Bar */}
            <header className="h-20 bg-white border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm">
              
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                {/* Mobile Hamburger Toggle */}
                <button
                  onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                  className="lg:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors mr-2 cursor-pointer"
                >
                  <LayoutDashboard className="w-4 h-4" />
                </button>

                <span className="hidden sm:inline">Super Admin</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
                <span className="text-slate-900 font-bold capitalize truncate">
                  {activeTab === 'approvals'
                    ? 'Pending Company Approvals'
                    : activeTab === 'organizations'
                    ? 'Verified Organizations Directory'
                    : 'System Security & Governance'}
                </span>
              </div>

              {/* Top System Health Pill */}
              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 text-[11px] font-bold text-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  API Status: 100% Operational
                </div>

                <button
                  onClick={() => {
                    fetchPendingOwners();
                    fetchOrganizations();
                  }}
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  title="Refresh Queue"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingOwners || loadingOrganizations ? 'animate-spin' : ''}`} />
                </button>
              </div>

            </header>

            {/* Main Content Dashboard Views */}
            <main className="p-8 flex-1 space-y-8 animate-fade-in-up">
              
              {/* Top Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Registrations</span>
                    <h3 className="text-3xl font-black text-slate-900 mt-1">{pendingCount}</h3>
                    <span className="text-[11px] font-semibold text-amber-600 mt-2 block flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Action Required
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Organizations</span>
                    <h3 className="text-3xl font-black text-slate-900 mt-1">Verified</h3>
                    <span className="text-[11px] font-semibold text-emerald-600 mt-2 block flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Operating Live
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                    <Building2 className="w-6 h-6" />
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">System Governance</span>
                    <h3 className="text-3xl font-black text-[#360CAF] mt-1">Active</h3>
                    <span className="text-[11px] font-semibold text-[#360CAF] mt-2 block flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-[#360CAF]" /> Multi-Tenant Role Isolation
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-[#360CAF]/10 text-[#360CAF] border border-[#360CAF]/20 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                </div>

              </div>

              {/* Pending Approvals Queue View */}
              {activeTab === 'approvals' && (
                <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm">
                  
                  <div className="p-6 border-b border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-50/50">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                        Company Onboarding Queue
                        <span className="px-2.5 py-0.5 rounded-full bg-[#360CAF] text-white text-xs font-bold shadow-sm">
                          {filteredOwners.length}
                        </span>
                      </h2>
                      <p className="text-slate-500 text-xs mt-1">
                        Review property management company registrations before approving active portal access.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                      {/* Filter Tabs */}
                      <div className="flex items-center p-1 bg-slate-200/70 rounded-xl border border-slate-200 text-xs font-bold shrink-0">
                        <button
                          onClick={() => setApprovalStatusFilter('ALL')}
                          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                            approvalStatusFilter === 'ALL'
                              ? 'bg-white text-slate-900 shadow-xs font-extrabold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          All ({pendingOwners.length})
                        </button>

                        <button
                          onClick={() => setApprovalStatusFilter('PENDING')}
                          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                            approvalStatusFilter === 'PENDING'
                              ? 'bg-white text-amber-900 shadow-xs font-extrabold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Pending ({pendingCount})
                        </button>

                        <button
                          onClick={() => setApprovalStatusFilter('APPROVED')}
                          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                            approvalStatusFilter === 'APPROVED'
                              ? 'bg-white text-emerald-900 shadow-xs font-extrabold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Approved ({pendingOwners.filter((o) => o.approvalStatus === 'APPROVED').length})
                        </button>
                      </div>

                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search company or email..."
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#360CAF] focus:ring-1 focus:ring-[#360CAF]"
                        />
                      </div>
                    </div>
                  </div>

                  {loadingOwners ? (
                    <div className="p-12 text-center text-slate-500 text-sm flex flex-col items-center gap-3">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#360CAF]" />
                      Fetching pending approval applications...
                    </div>
                  ) : filteredOwners.length === 0 ? (
                    <div className="p-16 text-center text-slate-500 flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-bold text-slate-900">No Pending Approvals</h3>
                      <p className="text-xs text-slate-500 max-w-sm">
                        All company onboarding requests have been reviewed and processed.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100/80 text-slate-600 uppercase tracking-wider font-bold border-b border-slate-200/80">
                          <tr>
                            <th className="px-6 py-4">Company & Owner</th>
                            <th className="px-6 py-4">Contact Info</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Submitted</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {filteredOwners.map((owner) => {
                            const isActioning = actionLoadingId === owner.id;
                            return (
                              <tr key={owner.id} className="hover:bg-slate-50/80 transition-colors">
                                
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#360CAF]/10 border border-[#360CAF]/20 text-[#360CAF] flex items-center justify-center font-bold text-sm">
                                      {owner.organization?.name?.charAt(0) || 'O'}
                                    </div>
                                    <div>
                                      <div className="font-bold text-slate-900 text-sm">
                                        {owner.organization?.name || 'Unconfigured Company'}
                                      </div>
                                      <div className="text-slate-500 text-xs mt-0.5">
                                        Owner: {owner.owner?.fullName || 'Pending Setup'}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                <td className="px-6 py-4">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-slate-800">
                                      <Mail className="w-3.5 h-3.5 text-slate-400" /> {owner.email}
                                    </div>
                                    {owner.phone && (
                                      <div className="flex items-center gap-1.5 text-slate-500">
                                        <Phone className="w-3.5 h-3.5 text-slate-400" /> {owner.phone}
                                      </div>
                                    )}
                                  </div>
                                </td>

                                <td className="px-6 py-4">
                                  <span
                                    className={`px-3 py-1 rounded-full border text-[11px] font-extrabold inline-flex items-center gap-1.5 shadow-xs uppercase ${
                                      owner.approvalStatus === 'APPROVED'
                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                        : owner.approvalStatus === 'PENDING'
                                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                                        : 'bg-rose-100 text-rose-800 border-rose-200'
                                    }`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        owner.approvalStatus === 'APPROVED'
                                          ? 'bg-emerald-500'
                                          : owner.approvalStatus === 'PENDING'
                                          ? 'bg-amber-500 animate-pulse'
                                          : 'bg-rose-500'
                                      }`}
                                    />
                                    {owner.approvalStatus === 'APPROVED'
                                      ? 'APPROVED & VERIFIED'
                                      : owner.approvalStatus === 'PENDING'
                                      ? 'PENDING VERIFICATION'
                                      : 'APPLICATION REJECTED'}
                                  </span>
                                </td>

                                <td className="px-6 py-4 text-slate-500">
                                  {new Date(owner.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </td>

                                <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    {owner.approvalStatus === 'PENDING' && (
                                      <>
                                        <button
                                          onClick={() => handleApprove(owner.id, owner.owner?.fullName || owner.organization?.name || owner.email)}
                                          disabled={isActioning}
                                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                                        >
                                          {isActioning ? (
                                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                          ) : (
                                            <UserCheck className="w-3.5 h-3.5" />
                                          )}
                                          Approve
                                        </button>

                                        <button
                                          onClick={() => setRejectingUser(owner)}
                                          disabled={isActioning}
                                          className="px-4 py-2 rounded-xl bg-white hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-bold text-xs border border-slate-200 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                                        >
                                          <UserX className="w-3.5 h-3.5" /> Reject
                                        </button>
                                      </>
                                    )}

                                    {owner.approvalStatus === 'APPROVED' && (
                                      <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold inline-flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active Access
                                      </span>
                                    )}

                                    {owner.approvalStatus === 'REJECTED' && (
                                      <span className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold inline-flex items-center gap-1">
                                        <XCircle className="w-3.5 h-3.5 text-rose-600" /> Access Denied
                                      </span>
                                    )}
                                  </div>
                                </td>

                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>
              )}

              {/* Organizations View */}
              {activeTab === 'organizations' && (
                <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm">
                  
                  <div className="p-6 border-b border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/50">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                        Registered Organizations Directory
                        <span className="px-2.5 py-0.5 rounded-full bg-[#360CAF] text-white text-xs font-bold shadow-sm">
                          {organizations.length}
                        </span>
                      </h2>
                      <p className="text-slate-500 text-xs mt-1">
                        All property management companies registered on Orvyn PMS with multi-tenant data isolation.
                      </p>
                    </div>

                    <button
                      onClick={() => fetchOrganizations()}
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      title="Refresh Directory"
                    >
                      <RefreshCw className={`w-4 h-4 ${loadingOrganizations ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {loadingOrganizations ? (
                    <div className="p-12 text-center text-slate-500 text-sm flex flex-col items-center gap-3">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#360CAF]" />
                      Loading organizations directory...
                    </div>
                  ) : organizations.length === 0 ? (
                    <div className="p-16 text-center text-slate-500 flex flex-col items-center gap-3">
                      <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
                      <h3 className="text-base font-bold text-slate-800">No Organizations Registered Yet</h3>
                      <p className="text-xs text-slate-500 max-w-sm">
                        New company registrations will automatically populate here.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100/80 text-slate-600 uppercase tracking-wider font-bold border-b border-slate-200/80">
                          <tr>
                            <th className="px-6 py-4">Organization Name</th>
                            <th className="px-6 py-4">Owner & Email</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Properties / Users</th>
                            <th className="px-6 py-4">Created Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {organizations.map((org) => {
                            const ownerUser = org.users?.[0];
                            const ownerName = ownerUser?.owner?.fullName || 'Company Owner';
                            const ownerEmail = ownerUser?.email || org.billingEmail;
                            const status = ownerUser?.approvalStatus || 'APPROVED';

                            return (
                              <tr key={org.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm">
                                      {org.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <div className="font-extrabold text-slate-900 text-sm">{org.name}</div>
                                      <div className="text-slate-500 text-[10px] font-mono mt-0.5">Slug: {org.slug}</div>
                                    </div>
                                  </div>
                                </td>

                                <td className="px-6 py-4">
                                  <div className="space-y-0.5">
                                    <div className="font-bold text-slate-800">{ownerName}</div>
                                    <div className="text-slate-500 text-xs flex items-center gap-1">
                                      <Mail className="w-3 h-3 text-slate-400" /> {ownerEmail}
                                    </div>
                                  </div>
                                </td>

                                <td className="px-6 py-4">
                                  <span
                                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1.5 uppercase ${
                                      status === 'APPROVED'
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                        : status === 'PENDING'
                                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                                    }`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        status === 'APPROVED'
                                          ? 'bg-emerald-500'
                                          : status === 'PENDING'
                                          ? 'bg-amber-500 animate-pulse'
                                          : 'bg-rose-500'
                                      }`}
                                    />
                                    {status}
                                  </span>
                                </td>

                                <td className="px-6 py-4 text-slate-700">
                                  <div className="flex items-center gap-3">
                                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 font-bold text-[11px] text-slate-700">
                                      🏨 {org._count?.properties || 0} Properties
                                    </span>
                                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 font-bold text-[11px] text-slate-700">
                                      👥 {org._count?.users || 0} Team Members
                                    </span>
                                  </div>
                                </td>

                                <td className="px-6 py-4 text-slate-500">
                                  {new Date(org.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Security View */}
              {activeTab === 'security' && (
                <div className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-sm text-center">
                  <ShieldCheck className="w-12 h-12 text-[#360CAF] mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-slate-900">Governance & Security Protocol</h3>
                  <p className="text-slate-500 text-xs mt-1 max-w-md mx-auto">
                    All Super Admin actions are logged with session revocation capabilities.
                  </p>
                </div>
              )}

              {/* Announcements View */}
              {activeTab === 'announcements' && (
                <div className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-sm space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Bell className="w-5 h-5 text-[#360CAF]" />
                      Global Announcements & Push Notifications
                    </h3>
                    <p className="text-slate-500 text-xs mt-1">
                      Broadcast system update announcements and in-app alerts across all property instances. Mobile push plumbing is pre-wired.
                    </p>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!announcementTitle || !announcementMessage) {
                        showToast('Please provide a title and message.', 'error');
                        return;
                      }
                      setSendingAnnouncement(true);
                      try {
                        const res = await authenticatedFetch(`${API_BASE}/admin/notifications`, {
                          method: 'POST',
                          body: JSON.stringify({
                            title: announcementTitle,
                            message: announcementMessage,
                            type: announcementType,
                            targetRole: announcementTargetRole === 'ALL' ? undefined : announcementTargetRole,
                          }),
                        });
                        if (res.ok) {
                          showToast('Global Announcement broadcasted successfully!', 'success');
                          setAnnouncementTitle('');
                          setAnnouncementMessage('');
                        } else {
                          const errData = await res.json().catch(() => ({}));
                          showToast(errData.message || 'Failed to send announcement.', 'error');
                        }
                      } catch (err: any) {
                        showToast(err.message || 'Error broadcasting announcement.', 'error');
                      } finally {
                        setSendingAnnouncement(false);
                      }
                    }}
                    className="space-y-4 max-w-xl text-xs"
                  >
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Announcement Title</label>
                      <input
                        type="text"
                        value={announcementTitle}
                        onChange={(e) => setAnnouncementTitle(e.target.value)}
                        placeholder="e.g. Scheduled System Maintenance / Platform Upgrade"
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:border-[#360CAF]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Notification Type</label>
                        <select
                          value={announcementType}
                          onChange={(e) => setAnnouncementType(e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:border-[#360CAF]"
                        >
                          <option value="SYSTEM">System Announcement</option>
                          <option value="ALERT">Urgent Alert</option>
                          <option value="BOOKING">Booking Update</option>
                          <option value="PAYMENT">Payment Reminder</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Target Audience</label>
                        <select
                          value={announcementTargetRole}
                          onChange={(e) => setAnnouncementTargetRole(e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:border-[#360CAF]"
                        >
                          <option value="ALL">All Users & Staff</option>
                          <option value="OWNER">Property Owners Only</option>
                          <option value="MANAGER">Managers Only</option>
                          <option value="RECEPTIONIST">Reception Staff Only</option>
                          <option value="HOUSEKEEPING">Housekeeping Staff Only</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Message Content</label>
                      <textarea
                        value={announcementMessage}
                        onChange={(e) => setAnnouncementMessage(e.target.value)}
                        rows={4}
                        placeholder="Enter the full text of the announcement..."
                        className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:border-[#360CAF] resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={sendingAnnouncement}
                      className="px-6 py-3 rounded-2xl bg-[#360CAF] hover:bg-[#2b0991] text-white font-black transition-all shadow-lg shadow-[#360CAF]/25 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                    >
                      <Bell className="w-4 h-4" />
                      <span>{sendingAnnouncement ? 'Broadcasting...' : 'Broadcast Announcement'}</span>
                    </button>
                  </form>
                </div>
              )}

            </main>

            {/* Footer */}
            <footer className="py-6 text-center text-xs text-slate-400 font-medium border-t border-slate-200/60 bg-white">
              © {new Date().getFullYear()} Orvyn PMS. Super Admin Governance Portal powered by <strong>Orvyn Labs Inc.</strong>
            </footer>

          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in-up">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <XCircle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-slate-900">Reject Company Application</h3>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              Rejecting registration for <strong>{rejectingUser.organization?.name || rejectingUser.email}</strong> will deny access to the portal.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Rejection Reason (Optional)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Incomplete documentation or unverified business details..."
                className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 h-24"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectingUser(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-600/25 transition-all"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
