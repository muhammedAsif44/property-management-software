'use client';

import React, { useState, useEffect } from 'react';
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
  Sparkles,
} from 'lucide-react';

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('admin@orvyn.com');
  const [password, setPassword] = useState('Admin@123456');
  const [loginError, setLoginError] = useState('');
  const [loadingLogin, setLoadingLogin] = useState(false);

  const [pendingOwners, setPendingOwners] = useState<PendingOwner[]>([]);
  const [loadingOwners, setLoadingOwners] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Rejection Modal State
  const [rejectingUser, setRejectingUser] = useState<PendingOwner | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
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

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.user?.role !== 'SUPER_ADMIN') {
        throw new Error('Only Super Admin accounts can access this portal');
      }

      setIsAuthenticated(true);
      showToast('Welcome Super Admin! Signed in successfully.');
      fetchPendingOwners();
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
      const res = await fetch(`${API_BASE}/admin/pending-owners`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }

      const data = await res.json();
      if (res.ok && data.pendingOwners) {
        setPendingOwners(data.pendingOwners);
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.error('Failed to fetch pending owners:', err);
    } finally {
      setLoadingOwners(false);
    }
  };

  useEffect(() => {
    fetchPendingOwners();
  }, []);

  // Approve Owner
  const handleApprove = async (userId: string, ownerName: string) => {
    setActionLoadingId(userId);
    try {
      const res = await fetch(`${API_BASE}/admin/owners/${userId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to approve owner');
      }

      showToast(`Approved owner application for ${ownerName || 'User'}!`);
      fetchPendingOwners();
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
      const res = await fetch(`${API_BASE}/admin/owners/${rejectingUser.id}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ rejectionReason }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to reject owner application');
      }

      showToast(`Rejected owner application for ${rejectingUser.owner?.fullName || rejectingUser.email}`, 'error');
      setRejectingUser(null);
      setRejectionReason('');
      fetchPendingOwners();
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
        credentials: 'include',
      });
    } catch (e) {
      // ignore
    }
    setIsAuthenticated(false);
    showToast('Logged out of Super Admin Portal');
  };

  // Filter owners by search query
  const filteredOwners = pendingOwners.filter((owner) => {
    const query = searchQuery.toLowerCase();
    const name = owner.owner?.fullName?.toLowerCase() || '';
    const emailStr = owner.email.toLowerCase();
    const propName = owner.organization?.name?.toLowerCase() || '';
    return name.includes(query) || emailStr.includes(query) || propName.includes(query);
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-violet-500 selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/30 text-rose-200'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/20 border border-violet-400/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">Orvyn PMS</h1>
                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-md uppercase tracking-wider">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-400">Platform Owner Registration & Governance Gate</p>
            </div>
          </div>

          {isAuthenticated && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-800/60 px-3.5 py-1.5 rounded-lg border border-slate-700/50 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-slate-300 font-medium">admin@orvyn.com</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {!isAuthenticated ? (
          /* Super Admin Auth Card */
          <div className="max-w-md mx-auto my-12">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl pointer-events-none"></div>

              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-6 h-6 text-violet-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Super Admin Access Portal</h2>
                <p className="text-xs text-slate-400 mt-1">Authenticate with Super Admin credentials to review owner applications.</p>
              </div>

              {loginError && (
                <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Super Admin Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loadingLogin}
                  className="w-full py-3 rounded-xl font-medium text-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-600/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loadingLogin ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>Sign In as Super Admin</span>
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-500">
                Default Seed Super Admin: <code className="text-violet-400">admin@orvyn.com</code>
              </div>
            </div>
          </div>
        ) : (
          /* Super Admin Dashboard Views */
          <div className="space-y-6">
            {/* Top Dashboard Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pending Applications</span>
                    <h3 className="text-2xl font-bold text-white mt-1">{pendingOwners.length}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 text-xs text-amber-400/80 font-medium">Awaiting Super Admin Approval</div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Approval Gate Policy</span>
                    <h3 className="text-sm font-semibold text-emerald-400 mt-1">Strict Enforced</h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <UserCheck className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-400">Unapproved owners blocked from PMS</div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">System Role</span>
                    <h3 className="text-sm font-semibold text-violet-400 mt-1">SUPER_ADMIN</h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-400">Full platform governance rights</div>
              </div>
            </div>

            {/* Pending Approvals Table Section */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>Owner Registration Gate</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {pendingOwners.length} Pending
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Review new Property Owner signups and grant or deny access to Orvyn PMS.</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="relative w-full md:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search owner or property..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                    />
                  </div>

                  <button
                    onClick={fetchPendingOwners}
                    disabled={loadingOwners}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-300 transition-colors disabled:opacity-50"
                    title="Refresh list"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingOwners ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Table Data */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Property & Organization</th>
                      <th className="px-6 py-4">Owner Name</th>
                      <th className="px-6 py-4">Contact Info</th>
                      <th className="px-6 py-4">Registration Date</th>
                      <th className="px-6 py-4 text-center">Approval Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {loadingOwners ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-violet-400" />
                          <span>Loading pending owner registrations...</span>
                        </td>
                      </tr>
                    ) : filteredOwners.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400/60" />
                          <p className="text-sm font-medium text-slate-300">No Pending Applications</p>
                          <p className="text-xs text-slate-500 mt-1">All owner registration requests have been reviewed.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredOwners.map((owner) => (
                        <tr key={owner.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center font-bold">
                                <Building2 className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="font-semibold text-white text-sm">{owner.organization?.name || 'Unnamed Property'}</div>
                                <div className="text-[11px] text-slate-500">Slug: {owner.organization?.slug}</div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="font-medium text-slate-200 text-sm">{owner.owner?.fullName || 'Not specified'}</div>
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-violet-500/10 text-violet-400 border border-violet-500/20">
                              {owner.role}
                            </span>
                          </td>

                          <td className="px-6 py-4 space-y-1">
                            <div className="flex items-center gap-1.5 text-slate-300">
                              <Mail className="w-3.5 h-3.5 text-slate-500" />
                              <span>{owner.email}</span>
                            </div>
                            {owner.phone && (
                              <div className="flex items-center gap-1.5 text-slate-400">
                                <Phone className="w-3.5 h-3.5 text-slate-500" />
                                <span>{owner.phone}</span>
                              </div>
                            )}
                          </td>

                          <td className="px-6 py-4 text-slate-400 text-xs">
                            {new Date(owner.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleApprove(owner.id, owner.owner?.fullName || owner.email)}
                                disabled={actionLoadingId === owner.id}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all disabled:opacity-50"
                              >
                                {actionLoadingId === owner.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                                <span>Approve</span>
                              </button>

                              <button
                                onClick={() => {
                                  setRejectingUser(owner);
                                  setRejectionReason('');
                                }}
                                disabled={actionLoadingId === owner.id}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all disabled:opacity-50"
                              >
                                <UserX className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Rejection Modal */}
      {rejectingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reject Owner Application</h3>
                <p className="text-xs text-slate-400">Specify why this application is being declined.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
              <div><span className="text-slate-500">Applicant:</span> <span className="text-slate-200 font-semibold">{rejectingUser.owner?.fullName || 'Owner'}</span></div>
              <div><span className="text-slate-500">Property:</span> <span className="text-slate-200 font-semibold">{rejectingUser.organization?.name}</span></div>
              <div><span className="text-slate-500">Email:</span> <span className="text-slate-200">{rejectingUser.email}</span></div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Rejection Reason (Shown to user on login)</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Invalid property verification documents or license details."
                className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectingUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={actionLoadingId === rejectingUser.id}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {actionLoadingId === rejectingUser.id && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
