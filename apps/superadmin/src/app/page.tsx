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
  Database,
  History,
  TrendingUp,
  IndianRupee,
  Layers,
  Calendar,
  X,
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

  const [activeTab, setActiveTab] = useState<'overview' | 'tenants' | 'backups' | 'approvals' | 'announcements' | 'templates'>('overview');

  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [announcementType, setAnnouncementType] = useState('SYSTEM');
  const [announcementTargetRole, setAnnouncementTargetRole] = useState('ALL');
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);

  // Invoice Template Workspace State
  const [invoiceTemplates, setInvoiceTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState('Custom Modern Template');
  const [templateHtml, setTemplateHtml] = useState(
    `<div style="font-family: sans-serif; padding: 24px; border: 2px solid #0B6E4F; border-radius: 16px;">\n  <h1 style="color: #0B6E4F;">{{propertyName}}</h1>\n  <p style="color: #64748b;">{{propertyAddress}} | GSTIN: {{gstNumber}}</p>\n  <hr style="border-color: #e2e8f0; margin: 16px 0;"/>\n  <h2>Tax Invoice #{{invoiceId}}</h2>\n  <p>Guest: <strong>{{guestName}}</strong> | Check-in: {{checkInDate}} | Check-out: {{checkOutDate}}</p>\n  <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">\n    <tr style="background: #f1f5f9;"><th style="padding: 8px; text-align: left;">Item</th><th style="padding: 8px; text-align: right;">Amount</th></tr>\n    <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">{{roomCategory}} ({{nights}} Nights)</td><td style="padding: 8px; text-align: right; border-bottom: 1px solid #e2e8f0;">{{totalAmount}}</td></tr>\n  </table>\n  <div style="margin-top: 24px; background: #ecfdf5; padding: 12px; border-radius: 8px; color: #065f46;">\n    Payment Info: UPI: {{upiId}} | Bank: {{bankName}} ({{accountNumber}})\n  </div>\n</div>`
  );
  const [savingTemplate, setSavingTemplate] = useState(false);

  const [pendingOwners, setPendingOwners] = useState<PendingOwner[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [platformStats, setPlatformStats] = useState<any>(null);
  const [backupLogs, setBackupLogs] = useState<any[]>([]);

  const [loadingOwners, setLoadingOwners] = useState(false);
  const [loadingOrganizations, setLoadingOrganizations] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingBackups, setLoadingBackups] = useState(false);

  // Pagination states
  const [tenantPage, setTenantPage] = useState(1);
  const [ownerPage, setOwnerPage] = useState(1);
  const pageSize = 15;

  const [searchQuery, setSearchQuery] = useState('');
  const [approvalStatusFilter, setApprovalStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Tenant Deep Dive State
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [tenantDeepDiveData, setTenantDeepDiveData] = useState<any>(null);
  const [loadingDeepDive, setLoadingDeepDive] = useState(false);

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
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (refreshRes.ok) {
        res = await fetch(url, {
          ...options,
          headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
          credentials: 'include',
        });
      }
    }
    return res;
  };

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoadingLogin(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const raw = await res.json();
      const data = raw.data || raw;

      if (!res.ok) {
        throw new Error(raw.message || data.message || 'Authentication failed');
      }

      const loggedInUser = data.user || raw.user;

      if (loggedInUser?.role !== 'SUPER_ADMIN') {
        throw new Error('Access Denied: Only Super Admins can log into this portal.');
      }

      setUser(loggedInUser);
      showToast('Welcome back, Super Admin!');
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoadingLogin(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await authenticatedFetch(`${API_BASE}/auth/logout`, { method: 'POST' });
    } catch (err) {
      // Ignore
    } finally {
      clearSession();
      showToast('Signed out of Super Admin Portal');
    }
  };

  // Fetch Platform Dashboard Analytics
  const fetchDashboardStats = async () => {
    setLoadingStats(true);
    try {
      const res = await authenticatedFetch(`${API_BASE}/admin/dashboard`);
      if (res.ok) {
        const raw = await res.json();
        setPlatformStats(raw.data || raw);
      }
    } catch (err) {
      console.error('Failed to fetch platform stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch Pending Owners Queue
  const fetchPendingOwners = async () => {
    setLoadingOwners(true);
    try {
      const res = await authenticatedFetch(`${API_BASE}/admin/pending-owners`);
      if (res.ok) {
        const raw = await res.json();
        const data = raw.data || raw;
        setPendingOwners(data.pendingOwners || []);
      }
    } catch (err) {
      console.error('Failed to fetch pending owners:', err);
    } finally {
      setLoadingOwners(false);
    }
  };

  // Fetch Registered Organizations
  const fetchOrganizations = async () => {
    setLoadingOrganizations(true);
    try {
      const res = await authenticatedFetch(`${API_BASE}/admin/tenants`);
      if (res.ok) {
        const raw = await res.json();
        const data = raw.data || raw;
        setOrganizations(data.tenants || data.organizations || []);
      }
    } catch (err) {
      console.error('Failed to fetch organizations:', err);
    } finally {
      setLoadingOrganizations(false);
    }
  };

  // Fetch Backup Logs
  const fetchBackupLogs = async () => {
    setLoadingBackups(true);
    try {
      const res = await authenticatedFetch(`${API_BASE}/admin/backups`);
      if (res.ok) {
        const raw = await res.json();
        const data = raw.data || raw;
        setBackupLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch backup logs:', err);
    } finally {
      setLoadingBackups(false);
    }
  };

  // Fetch Invoice Templates
  const fetchInvoiceTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await authenticatedFetch(`${API_BASE}/admin/invoice-templates`);
      if (res.ok) {
        const raw = await res.json();
        const templates = raw.data || raw;
        setInvoiceTemplates(templates);
        if (templates.length > 0 && !editingTemplateId) {
          setEditingTemplateId(templates[0].id);
          setTemplateName(templates[0].name);
          setTemplateHtml(templates[0].htmlContent);
        }
      }
    } catch (err) {
      console.error('Failed to fetch invoice templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Save / Update Invoice Template
  const handleSaveTemplate = async () => {
    setSavingTemplate(true);
    try {
      const url = editingTemplateId
        ? `${API_BASE}/admin/invoice-templates/${editingTemplateId}`
        : `${API_BASE}/admin/invoice-templates`;
      const method = editingTemplateId ? 'PATCH' : 'POST';

      const res = await authenticatedFetch(url, {
        method,
        body: JSON.stringify({
          name: templateName,
          htmlContent: templateHtml,
        }),
      });

      if (res.ok) {
        showToast('Invoice template saved successfully!');
        fetchInvoiceTemplates();
      } else {
        showToast('Failed to save template', 'error');
      }
    } catch (err) {
      showToast('Error saving template', 'error');
    } finally {
      setSavingTemplate(false);
    }
  };

  // Set Default Template
  const handleSetDefaultTemplate = async (templateId: string) => {
    try {
      const res = await authenticatedFetch(`${API_BASE}/admin/invoice-templates/${templateId}/set-default`, {
        method: 'POST',
      });
      if (res.ok) {
        showToast('Default invoice template updated!');
        fetchInvoiceTemplates();
      }
    } catch (err) {
      showToast('Failed to set default template', 'error');
    }
  };

  // Toggle Organization Active/Suspended Status
  const handleToggleOrgStatus = async (orgId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'CANCELLED' : 'ACTIVE';
    try {
      const res = await authenticatedFetch(`${API_BASE}/admin/tenants/${orgId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showToast(`Tenant status set to ${newStatus}`);
        fetchOrganizations();
        if (selectedTenantId === orgId) fetchTenantDeepDive(orgId);
      }
    } catch (err) {
      showToast('Failed to update tenant status', 'error');
    }
  };

  // Fetch Tenant Deep Dive
  const fetchTenantDeepDive = async (tenantId: string) => {
    setSelectedTenantId(tenantId);
    setLoadingDeepDive(true);
    try {
      const res = await authenticatedFetch(`${API_BASE}/admin/tenants/${tenantId}`);
      if (res.ok) {
        const raw = await res.json();
        setTenantDeepDiveData(raw.data || raw);
      } else {
        showToast('Failed to load tenant deep dive details', 'error');
      }
    } catch (err) {
      showToast('Error loading tenant details', 'error');
    } finally {
      setLoadingDeepDive(false);
    }
  };


  // Session Persistence
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
            fetchDashboardStats();
            fetchPendingOwners();
            fetchOrganizations();
            fetchBackupLogs();
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

  // Refetch when active tab changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardStats();
      if (activeTab === 'approvals') fetchPendingOwners();
      if (activeTab === 'tenants') fetchOrganizations();
      if (activeTab === 'backups') fetchBackupLogs();
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
      fetchDashboardStats();
    } catch (err: any) {
      showToast(err.message || 'Approval failed', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Confirm Reject
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
      fetchDashboardStats();
    } catch (err: any) {
      showToast(err.message || 'Rejection failed', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered lists
  const pendingCount = pendingOwners.filter((o) => o.approvalStatus === 'PENDING').length;
  
  const filteredOwners = pendingOwners.filter((owner) => {
    if (approvalStatusFilter !== 'ALL' && owner.approvalStatus !== approvalStatusFilter) {
      return false;
    }
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      owner.email?.toLowerCase().includes(query) ||
      owner.organization?.name?.toLowerCase().includes(query) ||
      owner.owner?.fullName?.toLowerCase().includes(query)
    );
  });

  if (isSessionChecking) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center font-sans">
        <RefreshCw className="w-8 h-8 text-[#360CAF] animate-spin mb-4" />
        <p className="text-xs font-semibold text-slate-400">Authenticating Super Admin Portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans antialiased">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 border transition-all animate-bounce ${
            toast.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
              : 'bg-rose-900 text-rose-100 border-rose-700'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      {/* LOGIN SCREEN */}
      {!isAuthenticated ? (
        <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
          <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-[#360CAF] text-white flex items-center justify-center mx-auto shadow-lg shadow-[#360CAF]/30">
                <Shield className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white mt-4">Super Admin Portal</h1>
              <p className="text-slate-400 text-xs font-medium">
                Platform-Wide Multi-Tenant Governance & Operational Visibility
              </p>
            </div>

            {loginError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Super Admin Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@orvyn.com"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#360CAF] focus:ring-1 focus:ring-[#360CAF]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Master Key Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#360CAF] focus:ring-1 focus:ring-[#360CAF]"
                />
              </div>

              <button
                type="submit"
                disabled={loadingLogin}
                className="w-full py-3.5 rounded-2xl bg-[#360CAF] hover:bg-[#2b0991] text-white font-black text-xs transition-all shadow-lg shadow-[#360CAF]/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loadingLogin ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                <span>{loadingLogin ? 'Authenticating...' : 'Sign In to Super Admin Panel'}</span>
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* AUTHENTICATED SUPER ADMIN DASHBOARD */
        <div className="flex min-h-screen relative">
          
          {/* Left Sidebar */}
          <aside className="w-64 bg-white border-r border-slate-200/80 p-6 flex flex-col justify-between hidden lg:flex shrink-0">
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#360CAF] text-white flex items-center justify-center shadow-md shadow-[#360CAF]/30">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="font-extrabold text-sm text-slate-900 tracking-tight">Super Admin</h1>
                  <span className="text-[10px] font-bold text-[#360CAF] uppercase tracking-wider">Platform Hub</span>
                </div>
              </div>

              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs transition-all ${
                    activeTab === 'overview'
                      ? 'bg-[#360CAF] text-white shadow-lg shadow-[#360CAF]/25'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Platform Overview</span>
                </button>

                <button
                  onClick={() => setActiveTab('tenants')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs transition-all ${
                    activeTab === 'tenants'
                      ? 'bg-[#360CAF] text-white shadow-lg shadow-[#360CAF]/25'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Tenant Directory</span>
                </button>

                <button
                  onClick={() => setActiveTab('backups')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs transition-all ${
                    activeTab === 'backups'
                      ? 'bg-[#360CAF] text-white shadow-lg shadow-[#360CAF]/25'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Database className="w-4 h-4" />
                  <span>Backup & Sync Logs</span>
                </button>

                <button
                  onClick={() => setActiveTab('approvals')}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-bold text-xs transition-all ${
                    activeTab === 'approvals'
                      ? 'bg-[#360CAF] text-white shadow-lg shadow-[#360CAF]/25'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4" />
                    <span>Owner Applications</span>
                  </div>
                  {pendingCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold animate-pulse">
                      {pendingCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('announcements')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs transition-all ${
                    activeTab === 'announcements'
                      ? 'bg-[#360CAF] text-white shadow-lg shadow-[#360CAF]/25'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  <span>Announcements</span>
                </button>

                <button
                  onClick={() => setActiveTab('templates')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs transition-all ${
                    activeTab === 'templates'
                      ? 'bg-[#360CAF] text-white shadow-lg shadow-[#360CAF]/25'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>Invoice Templates</span>
                </button>
              </nav>

            </div>

            <div className="pt-6 border-t border-slate-100 space-y-3">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#360CAF] text-white font-bold flex items-center justify-center text-xs">
                  SA
                </div>
                <div className="truncate flex-1">
                  <div className="font-bold text-slate-900 text-xs truncate">Super Admin</div>
                  <div className="text-[11px] text-slate-500 truncate">{user?.email || 'admin@orvyn.com'}</div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-rose-50 hover:text-rose-600 border border-slate-200 text-slate-700 text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          </aside>

          {/* Main Workspace Content */}
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-20 bg-white border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span className="hidden sm:inline">Super Admin</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
                <span className="text-slate-900 font-bold capitalize truncate">
                  {activeTab === 'overview'
                    ? 'Platform Overview & Operational Analytics'
                    : activeTab === 'tenants'
                    ? 'Tenant Directory & Deep-Dive View'
                    : activeTab === 'backups'
                    ? 'Backup & Sync Operation Logs'
                    : activeTab === 'approvals'
                    ? 'Owner Account Registrations'
                    : 'Global Announcements'}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 text-[11px] font-bold text-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  API Status: Operational
                </div>

                <button
                  onClick={() => {
                    fetchDashboardStats();
                    fetchPendingOwners();
                    fetchOrganizations();
                    fetchBackupLogs();
                  }}
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  title="Refresh Dashboard"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingStats || loadingOrganizations ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </header>

            <main className="p-8 flex-1 space-y-8 animate-fade-in-up">
              
              {/* TOP PLATFORM METRIC CARDS (Excludes Super Admin) */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customer Tenants</span>
                    <h3 className="text-3xl font-black text-slate-900 mt-1">{platformStats?.totalTenants || organizations.length || 0}</h3>
                    <span className="text-[11px] font-semibold text-emerald-600 mt-2 block">Excludes Admin Accounts</span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                    <Building2 className="w-6 h-6" />
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Properties</span>
                    <h3 className="text-3xl font-black text-slate-900 mt-1">{platformStats?.totalProperties || 0}</h3>
                    <span className="text-[11px] font-semibold text-blue-600 mt-2 block">Live Hotel Operations</span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                    <Layers className="w-6 h-6" />
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Platform Volume</span>
                    <h3 className="text-2xl font-black text-slate-900 mt-1">₹{(platformStats?.totalRevenue || 0).toLocaleString('en-IN')}</h3>
                    <span className="text-[11px] font-semibold text-purple-600 mt-2 block">{platformStats?.totalBookings || 0} Total Bookings</span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center">
                    <IndianRupee className="w-6 h-6" />
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
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
              </div>

              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-[#360CAF]" />
                      Recent Customer Tenants
                    </h2>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-600 uppercase font-bold border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-4">Organization</th>
                            <th className="px-6 py-4">Owner Contact</th>
                            <th className="px-6 py-4">Properties</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {organizations.slice(0, 5).map((org) => {
                            const ownerUser = org.users?.[0];
                            return (
                              <tr key={org.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-bold text-slate-900">{org.name}</td>
                                <td className="px-6 py-4 text-slate-600">{ownerUser?.email || org.billingEmail || 'N/A'}</td>
                                <td className="px-6 py-4">{org._count?.properties || 0} Properties</td>
                                <td className="px-6 py-4">
                                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                                    ACTIVE
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <button
                                    onClick={() => fetchTenantDeepDive(org.id)}
                                    className="px-3 py-1.5 rounded-xl bg-[#360CAF] text-white text-xs font-bold shadow-sm hover:bg-[#2b0991] transition-all cursor-pointer"
                                  >
                                    Deep Dive
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TENANT DIRECTORY TAB */}
              {activeTab === 'tenants' && (
                <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-slate-200/80 flex justify-between items-center bg-slate-50/50">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900">Tenant Directory</h2>
                      <p className="text-slate-500 text-xs mt-1">All customer property management organizations.</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 uppercase font-bold border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4">Organization</th>
                          <th className="px-6 py-4">Owner Info</th>
                          <th className="px-6 py-4">Properties</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Registered Date</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {organizations.map((org) => {
                          const ownerUser = org.users?.[0];
                          const isOrgActive = org.subscriptionStatus === 'ACTIVE';
                          return (
                            <tr key={org.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4">
                                <div className="font-extrabold text-slate-900 text-sm">{org.name}</div>
                                <div className="text-slate-400 text-[10px] font-mono">Slug: {org.slug}</div>
                              </td>
                              <td className="px-6 py-4 text-slate-700">
                                <div>{ownerUser?.owner?.fullName || 'Company Owner'}</div>
                                <div className="text-slate-400 text-xs">{ownerUser?.email || org.billingEmail}</div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-bold text-slate-700">
                                  🏢 {org._count?.properties || 0} Properties
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                                    isOrgActive
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {org.subscriptionStatus || 'ACTIVE'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-slate-500">
                                {new Date(org.createdAt).toLocaleDateString('en-US')}
                              </td>
                              <td className="px-6 py-4 text-right space-x-2">
                                <button
                                  onClick={() => handleToggleOrgStatus(org.id, org.subscriptionStatus || 'ACTIVE')}
                                  className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-all ${
                                    isOrgActive
                                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                  }`}
                                >
                                  {isOrgActive ? 'Suspend Tenant' : 'Activate Tenant'}
                                </button>
                                <button
                                  onClick={() => fetchTenantDeepDive(org.id)}
                                  className="px-4 py-1.5 rounded-xl bg-[#360CAF] text-white font-bold text-xs hover:bg-[#2b0991] transition-all cursor-pointer"
                                >
                                  Deep Dive
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                </div>
              )}

              {/* BACKUP & SYNC LOGS TAB */}
              {activeTab === 'backups' && (
                <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-slate-200/80 flex justify-between items-center bg-slate-50/50">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                        <Database className="w-5 h-5 text-[#360CAF]" />
                        Backup & Sync Operation Logs
                      </h2>
                      <p className="text-slate-500 text-xs mt-1">
                        Partition-ready logging of data backup executions and multi-tenant synchronization.
                      </p>
                    </div>
                  </div>

                  {loadingBackups ? (
                    <div className="p-12 text-center text-slate-500 text-sm flex flex-col items-center gap-3">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#360CAF]" />
                      Loading backup operation logs...
                    </div>
                  ) : backupLogs.length === 0 ? (
                    <div className="p-16 text-center text-slate-500 flex flex-col items-center gap-3">
                      <Database className="w-12 h-12 text-slate-300 mx-auto" />
                      <h3 className="text-base font-bold text-slate-800">No Backup Logs Recorded Yet</h3>
                      <p className="text-xs text-slate-500 max-w-sm">
                        Automatic backup and sync runs will populate execution status here.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-600 uppercase font-bold border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-4">Property & Organization</th>
                            <th className="px-6 py-4">Sync Type</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Affected Records</th>
                            <th className="px-6 py-4">Execution Timestamp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {backupLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4 font-bold text-slate-900">
                                {log.property?.name || 'Property'}
                                <div className="text-slate-400 text-[10px]">{log.property?.organization?.name}</div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="px-2.5 py-1 rounded-full bg-slate-100 font-bold text-slate-700 uppercase text-[10px]">
                                  {log.syncType}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                                    log.status === 'SUCCESS'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : log.status === 'IN_PROGRESS'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {log.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-slate-600 font-mono text-[11px]">
                                {log.recordCounts ? JSON.stringify(log.recordCounts) : 'N/A'}
                              </td>
                              <td className="px-6 py-4 text-slate-500">
                                {new Date(log.createdAt).toLocaleString('en-US')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* OWNER APPLICATIONS TAB */}
              {activeTab === 'approvals' && (
                <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-slate-200/80 flex justify-between items-center bg-slate-50/50">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900">Company Onboarding Queue</h2>
                      <p className="text-slate-500 text-xs mt-1">Review owner applications before granting portal access.</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 uppercase font-bold border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4">Company & Owner</th>
                          <th className="px-6 py-4">Contact Info</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {filteredOwners.map((owner) => (
                          <tr key={owner.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-900">{owner.organization?.name || owner.email}</div>
                              <div className="text-slate-500 text-xs">{owner.owner?.fullName || 'Owner Account'}</div>
                            </td>
                            <td className="px-6 py-4 text-slate-700">{owner.email}</td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">
                                {owner.approvalStatus}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                              {owner.approvalStatus === 'PENDING' && (
                                <button
                                  onClick={() => handleApprove(owner.id, owner.owner?.fullName || owner.email)}
                                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                                >
                                  Approve Access
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ANNOUNCEMENTS TAB */}
              {activeTab === 'announcements' && (
                <div className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Bell className="w-5 h-5 text-[#360CAF]" />
                      Broadcast Platform Announcement
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Send a broadcast announcement across all tenant organizations. Notifications will instantly pop up in the owner & staff Notification Bell inbox at http://localhost:3000.
                    </p>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setSendingAnnouncement(true);
                      try {
                        const res = await authenticatedFetch(`${API_BASE}/admin/notifications/broadcast`, {
                          method: 'POST',
                          body: JSON.stringify({
                            title: announcementTitle,
                            message: announcementMessage,
                            type: announcementType,
                            targetRole: announcementTargetRole,
                          }),
                        });
                        if (res.ok) {
                          showToast('Broadcasted announcement to all accounts!');
                          setAnnouncementTitle('');
                          setAnnouncementMessage('');
                        } else {
                          showToast('Failed to broadcast announcement', 'error');
                        }
                      } catch (err: any) {
                        showToast('Failed to broadcast', 'error');
                      } finally {
                        setSendingAnnouncement(false);
                      }
                    }}
                    className="space-y-4 max-w-xl text-xs font-medium"
                  >
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Target Audience</label>
                      <select
                        value={announcementTargetRole}
                        onChange={(e) => setAnnouncementTargetRole(e.target.value)}
                        className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800 focus:outline-none focus:border-[#360CAF]"
                      >
                        <option value="ALL">All Roles (Owners, Managers, Receptionists & Housekeeping)</option>
                        <option value="OWNER">Property Owners Only</option>
                        <option value="MANAGER">Operations Managers Only</option>
                        <option value="RECEPTION_STAFF">Reception Staff Only</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Notification Category / Type</label>
                      <select
                        value={announcementType}
                        onChange={(e) => setAnnouncementType(e.target.value)}
                        className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800 focus:outline-none focus:border-[#360CAF]"
                      >
                        <option value="SYSTEM">System Announcement</option>
                        <option value="ALERT">Critical Alert</option>
                        <option value="BOOKING">Booking Update</option>
                        <option value="PAYMENT">Billing Notice</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Announcement Title</label>
                      <input
                        type="text"
                        required
                        value={announcementTitle}
                        onChange={(e) => setAnnouncementTitle(e.target.value)}
                        placeholder="e.g. Scheduled System Maintenance / Platform Upgrade"
                        className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:border-[#360CAF]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Message Content</label>
                      <textarea
                        required
                        value={announcementMessage}
                        onChange={(e) => setAnnouncementMessage(e.target.value)}
                        rows={4}
                        placeholder="Type announcement message to broadcast to owner accounts..."
                        className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:border-[#360CAF]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={sendingAnnouncement}
                      className="px-6 py-3 rounded-xl bg-[#360CAF] hover:bg-[#2b0991] text-white font-bold cursor-pointer shadow-md transition-all flex items-center gap-2"
                    >
                      {sendingAnnouncement ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                      Broadcast Now to Owner Accounts
                    </button>
                  </form>
                </div>
              )}


              {/* INVOICE TEMPLATE WORKSPACE TAB */}
              {activeTab === 'templates' && (
                <div className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-sm space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                        <FileCheck2 className="w-5 h-5 text-[#360CAF]" />
                        Invoice Template Workspace
                      </h2>
                      <p className="text-slate-500 text-xs mt-1">
                        Design and customize guest tax invoice templates with live HTML/CSS editing & variable tokens.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setEditingTemplateId(null);
                          setTemplateName('New Invoice Template');
                          setTemplateHtml(
                            `<div style="font-family: sans-serif; padding: 24px;"><h1>{{propertyName}}</h1><p>Invoice #{{invoiceId}}</p></div>`
                          );
                        }}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                      >
                        + Create New Template
                      </button>
                      <button
                        onClick={handleSaveTemplate}
                        disabled={savingTemplate}
                        className="px-5 py-2 rounded-xl bg-[#360CAF] hover:bg-[#2b0991] text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
                      >
                        {savingTemplate ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        Save & Publish Template
                      </button>
                    </div>
                  </div>

                  {/* Saved Templates List Bar */}
                  {invoiceTemplates.length > 0 && (
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Saved Templates:</span>
                      {invoiceTemplates.map((tpl) => (
                        <div
                          key={tpl.id}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 shrink-0 cursor-pointer transition-all ${
                            editingTemplateId === tpl.id
                              ? 'bg-[#360CAF]/10 border-[#360CAF] text-[#360CAF]'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                          onClick={() => {
                            setEditingTemplateId(tpl.id);
                            setTemplateName(tpl.name);
                            setTemplateHtml(tpl.htmlContent);
                          }}
                        >
                          <span>{tpl.name}</span>
                          {tpl.isDefault ? (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-white text-[9px] font-extrabold uppercase">
                              Default
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetDefaultTemplate(tpl.id);
                              }}
                              className="text-[10px] text-slate-400 hover:text-emerald-600 underline cursor-pointer"
                            >
                              Make Default
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Variable Tokens Palette */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">Insertable Variable Tokens:</span>
                    <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                      {[
                        '{{propertyName}}',
                        '{{propertyAddress}}',
                        '{{gstNumber}}',
                        '{{invoiceId}}',
                        '{{guestName}}',
                        '{{checkInDate}}',
                        '{{checkOutDate}}',
                        '{{roomCategory}}',
                        '{{nights}}',
                        '{{totalAmount}}',
                        '{{upiId}}',
                        '{{bankName}}',
                        '{{accountNumber}}',
                      ].map((token) => (
                        <button
                          key={token}
                          onClick={() => setTemplateHtml((prev) => prev + ` ${token} `)}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-800 hover:bg-[#360CAF] hover:text-white transition-colors cursor-pointer"
                        >
                          {token}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Grid Layout: Code Editor + Live Rendered Preview */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Template Name</label>
                        <input
                          type="text"
                          value={templateName}
                          onChange={(e) => setTemplateName(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#360CAF]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">HTML / CSS Code Editor</label>
                        <textarea
                          value={templateHtml}
                          onChange={(e) => setTemplateHtml(e.target.value)}
                          rows={16}
                          className="w-full p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#360CAF] leading-relaxed"
                        />
                      </div>
                    </div>

                    {/* Live Preview Pane */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-bold text-slate-600">Live Render Preview</label>
                        <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Sample Data Substituted
                        </span>
                      </div>

                      <div className="min-h-[420px] p-6 bg-white border border-slate-300 rounded-2xl shadow-inner overflow-y-auto max-h-[500px]">
                        <div
                          dangerouslySetInnerHTML={{
                            __html: templateHtml
                              .replace(/\{\{propertyName\}\}/g, 'Grand Resort & Spa')
                              .replace(/\{\{propertyAddress\}\}/g, 'Beach Road, Calangute, Goa')
                              .replace(/\{\{gstNumber\}\}/g, '30AAACG1234F1Z5')
                              .replace(/\{\{invoiceId\}\}/g, 'INV-2026-0891')
                              .replace(/\{\{guestName\}\}/g, 'Rahul Sharma')
                              .replace(/\{\{checkInDate\}\}/g, '07 Aug 2026')
                              .replace(/\{\{checkOutDate\}\}/g, '10 Aug 2026')
                              .replace(/\{\{roomCategory\}\}/g, 'Deluxe Ocean Suite')
                              .replace(/\{\{nights\}\}/g, '3')
                              .replace(/\{\{totalAmount\}\}/g, '₹14,500.00')
                              .replace(/\{\{upiId\}\}/g, 'grandresort@okicici')
                              .replace(/\{\{bankName\}\}/g, 'HDFC Bank')
                              .replace(/\{\{accountNumber\}\}/g, '50100234918234'),
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}


            </main>
          </div>
        </div>
      )}

      {/* TENANT DEEP DIVE DRAWER / MODAL */}
      {selectedTenantId && tenantDeepDiveData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in-up">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-4xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">{tenantDeepDiveData.tenant?.name}</h3>
                <p className="text-xs text-slate-500">Tenant Deep-Dive Operational View</p>
              </div>
              <button
                onClick={() => setSelectedTenantId(null)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4 text-xs font-bold text-slate-700">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                🏢 Properties: {tenantDeepDiveData.metrics?.totalProperties || 0}
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                👥 Users: {tenantDeepDiveData.metrics?.totalUsers || 0}
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                📑 Bookings: {tenantDeepDiveData.metrics?.totalBookings || 0}
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                🤝 Agencies: {tenantDeepDiveData.metrics?.totalAgencies || 0}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-sm text-slate-900">Properties & Units</h4>
              <div className="grid grid-cols-2 gap-4">
                {tenantDeepDiveData.tenant?.properties?.map((p: any) => (
                  <div key={p.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                    <div className="font-bold text-slate-900">{p.name} ({p.city || 'Goa'})</div>
                    <div className="text-slate-500 mt-1">{p.roomUnits?.length || 0} Room Units Configured</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-sm text-slate-900">Recent Bookings History</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold">
                    <tr>
                      <th className="p-2">Guest</th>
                      <th className="p-2">Room Type</th>
                      <th className="p-2">Check In</th>
                      <th className="p-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenantDeepDiveData.recentBookings?.map((b: any) => (
                      <tr key={b.id} className="border-b border-slate-100">
                        <td className="p-2 font-bold">{b.guest?.fullName || 'Guest'}</td>
                        <td className="p-2">{b.roomType?.name}</td>
                        <td className="p-2">{new Date(b.checkInDate).toLocaleDateString('en-US')}</td>
                        <td className="p-2 text-right font-bold">₹{Number(b.totalAmount).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
