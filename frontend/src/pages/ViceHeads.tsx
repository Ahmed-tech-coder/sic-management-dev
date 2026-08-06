import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  Search, 
  Key, 
  Phone, 
  Mail, 
  Eye, 
  EyeOff, 
  Download, 
  X, 
  FilterX, 
  UserCheck, 
  Layers, 
  Copy 
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { useConfirm } from '../contexts/ConfirmContext';
import api from '../services/api';
import { MobileEntityCard } from '../components/common/MobileEntityCard';
import { EmptyState } from '../components/common/EmptyState';
import { SkeletonLoader } from '../components/common/SkeletonLoader';

// ==========================================
// TYPES & CONSTANTS
// ==========================================
interface Track {
  id: string;
  name: string;
}

interface ViceHeadUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  head_type: string;
  track_id: string;
  is_active: boolean;
  created_at: string;
  tracks?: {
    name: string;
  };
}

interface ViceHeadPayload {
  name: string;
  phone: string;
  email: string;
  role: string;
  head_type: string;
  track_id: string;
  is_active?: boolean;
  password?: string;
}

const VICE_HEAD_MESSAGES = {
  CREATE_SUCCESS: 'Vice Head created successfully',
  UPDATE_SUCCESS: 'Vice Head updated successfully',
  DELETE_SUCCESS: 'Vice Head deleted successfully',
  REQUIRED_FIELDS: 'Please fill in all required fields',
  OPERATION_FAILED: 'Operation failed',
  DELETE_FAILED: 'Failed to delete Vice Head',
  COPIED: 'Copied to clipboard!',
} as const;

// ==========================================
// SERVICES & HELPERS
// ==========================================
const viceHeadsService = {
  getTracks: async (): Promise<{ tracks: Track[] }> => {
    const res = await api.get('/tracks');
    return res.data;
  },

  getViceHeads: async (params: {
    track_id?: string;
    search?: string;
    page: number;
    limit: number;
  }): Promise<{ users: ViceHeadUser[]; total: number }> => {
    const res = await api.get('/users', {
      params: {
        role: 'head',
        head_type: 'vice_head',
        ...params,
      },
    });
    return res.data;
  },

  createViceHead: async (payload: ViceHeadPayload) => {
    const res = await api.post('/users', payload);
    return res.data;
  },

  updateViceHead: async (id: string, payload: ViceHeadPayload) => {
    const res = await api.put(`/users/${id}`, payload);
    return res.data;
  },

  deleteViceHead: async (id: string) => {
    const res = await api.delete(`/users/${id}`);
    return res.data;
  },
};

const formatToE164 = (input: string): string => {
  const cleaned = input.trim();
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('0')) return `+20${cleaned.substring(1)}`;
  return `+20${cleaned}`;
};

const getInitials = (name: string): string => {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
  return name.charAt(0).toUpperCase();
};

const exportViceHeadsToCSV = (users: ViceHeadUser[]) => {
  if (!users.length) return;
  const headers = ['ID', 'Name', 'Phone', 'Email', 'Track', 'Status'];
  const rows = users.map((u) => [
    u.id,
    `"${u.name}"`,
    `"${u.phone}"`,
    `"${u.email}"`,
    `"${u.tracks?.name || 'Unassigned'}"`,
    `"${u.is_active ? 'Active' : 'Inactive'}"`,
  ]);

  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `vice_heads_export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ==========================================
// MAIN COMPONENT
// ==========================================
export const ViceHeads: React.FC = () => {
  const { user: currentUser } = useAuth();
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  const isLeader = useMemo(() => currentUser?.role === 'leader', [currentUser?.role]);

  // Filters & State
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [trackFilter, setTrackFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modal forms
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingViceHead, setEditingViceHead] = useState<ViceHeadUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    track_id: '',
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  // Debounce Search Effect
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Query: Fetch Tracks
  const { data: tracksData } = useQuery({
    queryKey: ['tracks'],
    queryFn: viceHeadsService.getTracks,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const tracks = useMemo(() => tracksData?.tracks || [], [tracksData]);

  // Query: Fetch Vice Heads
  const { data: viceHeadsData, isLoading: loading } = useQuery({
    queryKey: ['vice-heads', { trackFilter, search: debouncedSearch, page }],
    queryFn: () =>
      viceHeadsService.getViceHeads({
        track_id: trackFilter || undefined,
        search: debouncedSearch || undefined,
        page,
        limit,
      }),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const viceHeads = useMemo(() => viceHeadsData?.users || [], [viceHeadsData]);
  const total = useMemo(() => viceHeadsData?.total || 0, [viceHeadsData]);

  const activeCount = useMemo(
    () => viceHeads.filter((u) => u.is_active).length,
    [viceHeads]
  );

  // Prefetch Pagination
  useEffect(() => {
    if (page * limit < total) {
      const nextPage = page + 1;
      queryClient.prefetchQuery({
        queryKey: ['vice-heads', { trackFilter, search: debouncedSearch, page: nextPage }],
        queryFn: () =>
          viceHeadsService.getViceHeads({
            track_id: trackFilter || undefined,
            search: debouncedSearch || undefined,
            page: nextPage,
            limit,
          }),
        staleTime: 2 * 60 * 1000,
      });
    }
  }, [page, total, limit, trackFilter, debouncedSearch, queryClient]);

  // Reset Filters
  const handleResetFilters = useCallback(() => {
    setSearch('');
    setTrackFilter('');
    setPage(1);
  }, []);

  // Copy Callback
  const handleCopy = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} ${VICE_HEAD_MESSAGES.COPIED}`);
  }, []);

  // Modal Handlers
  const handleOpenCreate = useCallback(() => {
    setEditingViceHead(null);
    setShowPassword(false);
    setFormData({
      name: '',
      phone: '',
      email: '',
      password: '',
      track_id: tracks[0]?.id || '',
      is_active: true,
    });
    setIsModalOpen(true);
  }, [tracks]);

  const handleOpenEdit = useCallback((viceHead: ViceHeadUser) => {
    setEditingViceHead(viceHead);
    setShowPassword(false);
    setFormData({
      name: viceHead.name,
      phone: viceHead.phone,
      email: viceHead.email,
      password: '',
      track_id: viceHead.track_id,
      is_active: viceHead.is_active,
    });
    setIsModalOpen(true);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.name || !formData.phone || !formData.email || (!editingViceHead && !formData.password)) {
        toast.error(VICE_HEAD_MESSAGES.REQUIRED_FIELDS);
        return;
      }

      setSubmitting(true);
      try {
        const payload: ViceHeadPayload = {
          name: formData.name.trim(),
          phone: formatToE164(formData.phone),
          email: formData.email.trim(),
          role: 'head',
          head_type: 'vice_head',
          track_id: formData.track_id,
          is_active: formData.is_active,
          password: formData.password ? formData.password : undefined,
        };

        if (editingViceHead) {
          const res = await viceHeadsService.updateViceHead(editingViceHead.id, payload);
          toast.success(res.message || VICE_HEAD_MESSAGES.UPDATE_SUCCESS);
        } else {
          const res = await viceHeadsService.createViceHead(payload);
          toast.success(res.message || VICE_HEAD_MESSAGES.CREATE_SUCCESS);
        }
        setIsModalOpen(false);
        queryClient.invalidateQueries({ queryKey: ['vice-heads'] });
      } catch (err: any) {
        console.error(err);
        toast.error(err.response?.data?.error || VICE_HEAD_MESSAGES.OPERATION_FAILED);
      } finally {
        setSubmitting(false);
      }
    },
    [formData, editingViceHead, queryClient]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const approved = await confirm({
        title: 'Delete Vice Head Member',
        message: 'Are you sure you want to delete this Vice Head? This action is permanent.',
        confirmText: 'Delete',
        type: 'danger',
      });
      if (!approved) return;

      setDeletingId(id);
      try {
        const res = await viceHeadsService.deleteViceHead(id);
        toast.success(res.message || VICE_HEAD_MESSAGES.DELETE_SUCCESS);
        queryClient.invalidateQueries({ queryKey: ['vice-heads'] });
      } catch (err: any) {
        console.error(err);
        toast.error(err.response?.data?.error || VICE_HEAD_MESSAGES.DELETE_FAILED);
      } finally {
        setDeletingId(null);
      }
    },
    [confirm, queryClient]
  );

  const hasActiveFilters = Boolean(search || trackFilter);

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight">Vice Heads Management</h2>
            {total > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-semibold">
                {total}
              </span>
            )}
          </div>
          <p className="text-neutral-400 text-sm mt-1">
            {isLeader ? 'Create, manage, and assign tracks to Vice Heads.' : 'View Vice Heads and their assigned tracks.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {viceHeads.length > 0 && (
            <button
              onClick={() => exportViceHeadsToCSV(viceHeads)}
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-750 text-neutral-700 dark:text-neutral-200 text-sm font-semibold rounded-btn transition-colors cursor-pointer"
              title="Export Current List to CSV"
            >
              <Download className="w-4 h-4 text-neutral-500" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          )}

          {isLeader && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand hover:bg-brand-hover text-white text-sm font-semibold rounded-btn shadow-md shadow-brand/10 transition-colors shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Vice Head</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Analytics Banner Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-[#111827] border border-neutral-200 dark:border-neutral-800 p-3.5 rounded-card flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Total Vice Heads</p>
            <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{total}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-neutral-200 dark:border-neutral-800 p-3.5 rounded-card flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Active (This Page)</p>
            <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{activeCount}</p>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white dark:bg-[#111827] border border-neutral-200 dark:border-neutral-800 p-3.5 rounded-card flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Total Tracks</p>
            <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{tracks.length}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-[#111827] p-4 rounded-card border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search name, phone, email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-neutral-50 dark:bg-[#161F30] border border-neutral-200 dark:border-neutral-800 rounded-input py-2 pl-9 pr-8 text-xs focus:outline-none focus:border-brand"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs text-neutral-450 dark:text-neutral-500 font-medium shrink-0">Track:</span>
          <select
            value={trackFilter}
            onChange={(e) => {
              setTrackFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-44 bg-neutral-50 dark:bg-[#161F30] border border-neutral-200 dark:border-neutral-800 rounded-input py-2 px-3 text-xs focus:outline-none focus:border-brand"
          >
            <option value="">All Tracks</option>
            {tracks.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <FilterX className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Loader, Empty and Table View */}
      {loading ? (
        <SkeletonLoader variant="table" count={5} />
      ) : viceHeads.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Vice Heads Found"
          description={hasActiveFilters ? "No vice heads match your filters." : "No vice head members registered."}
          action={
            hasActiveFilters
              ? { label: "Clear Filters", icon: FilterX, onClick: handleResetFilters }
              : isLeader
              ? { label: "Add Vice Head", icon: Plus, onClick: handleOpenCreate }
              : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111827] shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gradient-to-r from-brand/5 to-blue-500/5 border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-semibold uppercase tracking-widest text-neutral-500">
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Track</th>
                    <th className="px-6 py-4">Contact Info</th>
                    <th className="px-6 py-4">Status</th>
                    {isLeader && <th className="px-6 py-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-sm">
                  {viceHeads.map((viceHead) => (
                   <tr
  key={viceHead.id}
 className="
transition-all
duration-200
hover:shadow-sm
dark:hover:bg-brand/10
">
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-xs">
                            {getInitials(viceHead.name)}
                          </div>
                          <div>
                            <p className="font-semibold text-neutral-900 dark:text-neutral-100">{viceHead.name}</p>
                            <p className="text-[10px] text-neutral-400 mt-0.5">ID: {viceHead.id.substring(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className="font-bold px-2.5 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-xs text-neutral-600 dark:text-neutral-300">
                          {viceHead.tracks?.name || 'Unassigned'}
                        </span>
                      </td>
                      
                      {/* Clickable Copy-to-Clipboard Contact Info */}
                      <td className="px-6 py-4.5 space-y-1 text-xs">
                        <button
                          onClick={() => handleCopy(viceHead.phone, 'Phone number')}
                          className="flex items-center gap-1.5 text-neutral-900 dark:text-neutral-200 font-semibold hover:text-brand transition-colors cursor-pointer group"
                          title="Click to copy phone"
                        >
                          <span>{viceHead.phone}</span>
                          <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400" />
                        </button>
                        <button
                          onClick={() => handleCopy(viceHead.email, 'Email address')}
                          className="flex items-center gap-1.5 text-neutral-455 dark:text-neutral-400 hover:text-brand transition-colors cursor-pointer group"
                          title="Click to copy email"
                        >
                          <span>{viceHead.email}</span>
                          <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400" />
                        </button>
                      </td>

                      <td className="px-6 py-4.5">
                        {viceHead.is_active ? (
                          <span className="flex items-center gap-1.5 w-fit px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 w-fit px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                            Inactive
                          </span>
                        )}
                      </td>
                      {isLeader && (
                        <td className="px-6 py-4.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(viceHead)}
                              disabled={deletingId === viceHead.id}
                              className="p-1.5 text-neutral-400 hover:text-brand hover:bg-neutral-100 dark:hover:bg-neutral-850 rounded-btn transition-colors cursor-pointer disabled:opacity-50"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(viceHead.id)}
                              disabled={deletingId === viceHead.id}
                              className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-neutral-100 dark:hover:bg-neutral-850 rounded-btn transition-colors cursor-pointer disabled:opacity-50"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {viceHeads.map((viceHead) => (
              <MobileEntityCard
                key={viceHead.id}
                avatarInitials={getInitials(viceHead.name)}
                title={viceHead.name}
                subtitle={`ID: ${viceHead.id.substring(0, 8)}`}
                badges={[
                  <span
                    key="track"
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                  >
                    {viceHead.tracks?.name || 'Unassigned'}
                  </span>,
                  <span
                    key="status"
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      viceHead.is_active
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                    }`}
                  >
                    {viceHead.is_active ? 'Active' : 'Inactive'}
                  </span>
                ]}
                metadata={[
                  { label: 'Phone', value: viceHead.phone, icon: Phone },
                  { label: 'Email', value: viceHead.email, icon: Mail },
                ]}
                actions={
                  isLeader
                    ? [
                        { label: 'Edit', icon: Edit, onClick: () => handleOpenEdit(viceHead) },
                        { label: 'Delete', icon: Trash2, onClick: () => handleDelete(viceHead.id), variant: 'danger' }
                      ]
                    : []
                }
              />
            ))}
          </div>

          {/* Pagination controls */}
          {total > limit && (
            <div className="flex items-center justify-between p-4 bg-white dark:bg-[#111827] border border-neutral-200 dark:border-neutral-800 rounded-card text-xs text-neutral-455 dark:text-neutral-400">
              <p>Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} records</p>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 disabled:opacity-50 rounded font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-750 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  disabled={page * limit >= total}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 disabled:opacity-50 rounded font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-750 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}
        >
          <div className="w-full max-w-lg bg-white dark:bg-[#111827] border border-neutral-200 dark:border-neutral-800 rounded-card shadow-2xl p-6 overflow-hidden">
            <h3 className="text-lg font-bold">{editingViceHead ? 'Edit Vice Head' : 'Add New Vice Head'}</h3>
            <p className="text-xs text-neutral-400 mt-1 mb-5">
              Fill in the user metadata. Auth accounts are configured automatically.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-neutral-400">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Full name"
                    className="w-full bg-neutral-50 dark:bg-[#161F30] border border-neutral-200 dark:border-neutral-800 rounded-input py-2.5 px-3.5 text-sm focus:outline-none focus:border-brand"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-neutral-400">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Phone number"
                    className="w-full bg-neutral-50 dark:bg-[#161F30] border border-neutral-200 dark:border-neutral-800 rounded-input py-2.5 px-3.5 text-sm focus:outline-none focus:border-brand"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-neutral-400">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@gmail.com"
                  className="w-full bg-neutral-50 dark:bg-[#161F30] border border-neutral-200 dark:border-neutral-800 rounded-input py-2.5 px-3.5 text-sm focus:outline-none focus:border-brand"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-neutral-400">
                  Password {editingViceHead && <span className="text-[10px] lowercase text-neutral-500">(Leave blank to keep current)</span>}
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingViceHead ? '••••••••' : 'Password (min 6 chars)'}
                    className="w-full bg-neutral-50 dark:bg-[#161F30] border border-neutral-200 dark:border-neutral-800 rounded-input py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:border-brand"
                    required={!editingViceHead}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-300 focus:outline-none cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-neutral-400">Assigned Track</label>
                  <select
                    value={formData.track_id}
                    onChange={(e) => setFormData({ ...formData, track_id: e.target.value })}
                    className="w-full bg-neutral-50 dark:bg-[#161F30] border border-neutral-200 dark:border-neutral-800 rounded-input py-2.5 px-3.5 text-sm focus:outline-none focus:border-brand"
                  >
                    {tracks.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {editingViceHead && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-neutral-400">Account Status</label>
                    <div className="flex items-center gap-3 py-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                        className="text-neutral-500 hover:text-brand cursor-pointer"
                      >
                        {formData.is_active ? (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                            <ToggleRight className="w-8 h-8" />
                            <span>Active Account</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-rose-500">
                            <ToggleLeft className="w-8 h-8" />
                            <span>Disabled Account</span>
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-350 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-btn shadow-md shadow-brand/10 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : editingViceHead ? 'Save Changes' : 'Create Vice Head'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViceHeads;