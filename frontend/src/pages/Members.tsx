import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  GraduationCap, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Phone, 
  Mail, 
  Download, 
  X, 
  Users, 
  Layers, 
  Copy, 
  FilterX 
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { useConfirm } from '../contexts/ConfirmContext';
import api from '../services/api';
import { MobileEntityCard } from '../components/common/MobileEntityCard';
import { EmptyState } from '../components/common/EmptyState';
import { SkeletonLoader } from '../components/common/SkeletonLoader';

// ==========================================
// CONSTANTS & MESSAGES
// ==========================================
const MEMBER_MESSAGES = {
  CREATE_SUCCESS: 'Technical member added successfully',
  UPDATE_SUCCESS: 'Technical member updated successfully',
  DELETE_SUCCESS: 'Technical member deleted successfully',
  REQUIRED_FIELDS: 'Please fill in all required fields',
  OPERATION_FAILED: 'Operation failed',
  DELETE_FAILED: 'Failed to delete member',
  COPIED: 'Copied to clipboard!',
} as const;

// ==========================================
// TYPES
// ==========================================
interface Track {
  id: string;
  name: string;
}

interface TechnicalMember {
  id: string;
  name: string;
  phone: string;
  email: string;
  track_id: string;
  created_at: string;
  tracks?: {
    name: string;
  };
}

interface MemberPayload {
  name: string;
  phone: string;
  email: string;
  track_id?: string;
}

// ==========================================
// SERVICES & HELPERS
// ==========================================
const membersService = {
  getTracks: async (): Promise<{ tracks: Track[] }> => {
    const res = await api.get('/tracks');
    return res.data;
  },

  getMembers: async (params: {
    track_id?: string;
    search?: string;
    page: number;
    limit: number;
  }): Promise<{ members: TechnicalMember[]; total: number }> => {
    const res = await api.get('/technical-members', { params });
    return res.data;
  },

  createMember: async (payload: MemberPayload) => {
    const res = await api.post('/technical-members', payload);
    return res.data;
  },

  updateMember: async (id: string, payload: MemberPayload) => {
    const res = await api.put(`/technical-members/${id}`, payload);
    return res.data;
  },

  deleteMember: async (id: string) => {
    const res = await api.delete(`/technical-members/${id}`);
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

// Export CSV Helper
const exportToCSV = (members: TechnicalMember[]) => {
  if (!members.length) return;
  const headers = ['ID', 'Name', 'Phone', 'Email', 'Track'];
  const rows = members.map((m) => [
    m.id,
    `"${m.name}"`,
    `"${m.phone}"`,
    `"${m.email}"`,
    `"${m.tracks?.name || 'Unassigned'}"`,
  ]);

  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `members_export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ==========================================
// MAIN MEMBERS COMPONENT
// ==========================================
export const Members: React.FC = () => {
  const { user } = useAuth();
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  const canMutate = useMemo(() => user?.role === 'head' || user?.role === 'hr', [user?.role]);
  const isHead = useMemo(() => user?.role === 'head', [user?.role]);

  // Filters & State
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [trackFilter, setTrackFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TechnicalMember | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    track_id: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Debounced Search Effect
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Query: Fetch Tracks
  const { data: tracksData } = useQuery({
    queryKey: ['tracks'],
    queryFn: membersService.getTracks,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const tracks = useMemo(() => tracksData?.tracks || [], [tracksData]);

  const activeTrackFilter = useMemo(
    () => (isHead ? user?.track_id : trackFilter),
    [isHead, user?.track_id, trackFilter]
  );

  // Query: Fetch Members
  const { data: membersData, isLoading: loading } = useQuery({
    queryKey: ['members', { trackFilter: activeTrackFilter, search: debouncedSearch, page }],
    queryFn: () =>
      membersService.getMembers({
        track_id: activeTrackFilter || undefined,
        search: debouncedSearch || undefined,
        page,
        limit,
      }),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const members = useMemo(() => membersData?.members || [], [membersData]);
  const total = useMemo(() => membersData?.total || 0, [membersData]);

  // Reset Filters Function
  const handleResetFilters = useCallback(() => {
    setSearch('');
    setTrackFilter('');
    setPage(1);
  }, []);

  // Copy to Clipboard Handler
  const handleCopy = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} ${MEMBER_MESSAGES.COPIED}`);
  }, []);

  // Pagination Prefetch
  useEffect(() => {
    if (page * limit < total) {
      const nextPage = page + 1;
      queryClient.prefetchQuery({
        queryKey: ['members', { trackFilter: activeTrackFilter, search: debouncedSearch, page: nextPage }],
        queryFn: () =>
          membersService.getMembers({
            track_id: activeTrackFilter || undefined,
            search: debouncedSearch || undefined,
            page: nextPage,
            limit,
          }),
        staleTime: 2 * 60 * 1000,
      });
    }
  }, [page, total, limit, activeTrackFilter, debouncedSearch, queryClient]);

  // Modal Handlers
  const handleOpenCreate = useCallback(() => {
    setEditingMember(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      track_id: (isHead ? user?.track_id : tracks[0]?.id) || '',
    });
    setIsModalOpen(true);
  }, [isHead, user?.track_id, tracks]);

  const handleOpenEdit = useCallback((m: TechnicalMember) => {
    setEditingMember(m);
    setFormData({
      name: m.name,
      phone: m.phone,
      email: m.email,
      track_id: m.track_id,
    });
    setIsModalOpen(true);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.name || !formData.phone || !formData.email || (!isHead && !formData.track_id)) {
        toast.error(MEMBER_MESSAGES.REQUIRED_FIELDS);
        return;
      }

      setSubmitting(true);

      const payload = {
        name: formData.name.trim(),
        phone: formatToE164(formData.phone),
        email: formData.email.trim(),
        track_id: isHead ? undefined : formData.track_id,
      };

      try {
        if (editingMember) {
          const res = await membersService.updateMember(editingMember.id, payload);
          toast.success(res.message || MEMBER_MESSAGES.UPDATE_SUCCESS);
        } else {
          const res = await membersService.createMember(payload);
          toast.success(res.message || MEMBER_MESSAGES.CREATE_SUCCESS);
        }
        setIsModalOpen(false);
        queryClient.invalidateQueries({ queryKey: ['members'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      } catch (err: any) {
        console.error(err);
        toast.error(err.response?.data?.error || MEMBER_MESSAGES.OPERATION_FAILED);
      } finally {
        setSubmitting(false);
      }
    },
    [formData, isHead, editingMember, queryClient]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const approved = await confirm({
        title: 'Delete Technical Member',
        message: 'Are you sure you want to delete this technical member? This will delete all their evaluations as well.',
        confirmText: 'Delete',
        type: 'danger',
      });
      if (!approved) return;

      try {
        const res = await membersService.deleteMember(id);
        toast.success(res.message || MEMBER_MESSAGES.DELETE_SUCCESS);
        queryClient.invalidateQueries({ queryKey: ['members'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      } catch (err: any) {
        console.error(err);
        toast.error(err.response?.data?.error || MEMBER_MESSAGES.DELETE_FAILED);
      }
    },
    [confirm, queryClient]
  );

  const hasActiveFilters = Boolean(search || trackFilter);

  return (
    <div className="space-y-6">
      
      {/* Header section with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Technical Members</h2>
          <p className="text-neutral-400 text-sm mt-1">
            {canMutate
              ? 'Add, edit, or delete members inside seasons tracks.'
              : 'View registered technical members for this season.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* NEW: Export CSV Button */}
          {members.length > 0 && (
            <button
              onClick={() => exportToCSV(members)}
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-750 text-neutral-700 dark:text-neutral-200 text-sm font-semibold rounded-btn transition-colors cursor-pointer"
              title="Export Current List to CSV"
            >
              <Download className="w-4 h-4 text-neutral-500" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          )}

          {canMutate && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand hover:bg-brand-hover text-white text-sm font-semibold rounded-btn shadow-md shadow-brand/10 transition-colors shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Member</span>
            </button>
          )}
        </div>
      </div>

      {/* NEW FEATURE 1: Quick Analytics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-[#111827] border border-neutral-200 dark:border-neutral-800 p-3.5 rounded-card flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Total Members</p>
            <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{total}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-neutral-200 dark:border-neutral-800 p-3.5 rounded-card flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Tracks Available</p>
            <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{tracks.length}</p>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white dark:bg-[#111827] border border-neutral-200 dark:border-neutral-800 p-3.5 rounded-card flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${hasActiveFilters ? 'bg-amber-500/10 text-amber-500' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'}`}>
            <FilterX className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Filter Status</p>
            <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
              {hasActiveFilters ? 'Filtered View' : 'Showing All'}
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar & Filters with Reset */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white dark:bg-[#111827] p-4 rounded-card border border-neutral-200 dark:border-neutral-800 shadow-sm items-center">
        
        {/* Search Input with Clear Action */}
        <div className="relative w-full">
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

        {/* Track Filter & Clear All */}
        <div className="flex items-center gap-2.5 w-full">
          {!isHead && (
            <div className="flex items-center gap-2.5 w-full">
              <span className="text-xs text-neutral-450 dark:text-neutral-500 font-medium shrink-0">Track:</span>
              <select
                value={trackFilter}
                onChange={(e) => {
                  setTrackFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-neutral-50 dark:bg-[#161F30] border border-neutral-200 dark:border-neutral-800 rounded-input py-2 px-3 text-xs focus:outline-none focus:border-brand"
              >
                <option value="">All Tracks</option>
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* NEW FEATURE 2: Reset Filters Button */}
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

      {/* Main Table / Grid Content */}
      {loading ? (
        <SkeletonLoader variant="table" count={5} />
      ) : members.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No Technical Members Found"
          description={hasActiveFilters ? "No members match your active search criteria." : "No members registered for the selected season."}
          action={
            hasActiveFilters
              ? { label: "Clear Filters", icon: FilterX, onClick: handleResetFilters }
              : canMutate
              ? { label: "Add Member", icon: Plus, onClick: handleOpenCreate }
              : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white dark:bg-[#111827] border border-neutral-200 dark:border-neutral-800 rounded-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#161F30] text-xs font-bold uppercase tracking-wider text-neutral-400">
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Track</th>
                    <th className="px-6 py-4">Contact Info</th>
                    {canMutate && <th className="px-6 py-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-sm">
                  {members.map((m) => (
                    <tr key={m.id} className="hover:bg-neutral-50/50 dark:hover:bg-[#182235]/40 transition-colors">
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-xs">
                            {getInitials(m.name)}
                          </div>
                          <div>
                            <p className="font-semibold text-neutral-900 dark:text-neutral-100">{m.name}</p>
                            <p className="text-[10px] text-neutral-400 mt-0.5">ID: {m.id.substring(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className="font-bold px-2.5 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-xs text-neutral-600 dark:text-neutral-300">
                          {m.tracks?.name || 'Unassigned'}
                        </span>
                      </td>
                      
                      {/* NEW FEATURE 3: Interactive Copy-to-Clipboard Contact Info */}
                      <td className="px-6 py-4.5 space-y-1 text-xs">
                        <button
                          onClick={() => handleCopy(m.phone, 'Phone number')}
                          className="flex items-center gap-1.5 text-neutral-900 dark:text-neutral-200 font-semibold hover:text-brand transition-colors cursor-pointer group"
                          title="Click to copy phone"
                        >
                          <span>{m.phone}</span>
                          <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400" />
                        </button>
                        <button
                          onClick={() => handleCopy(m.email, 'Email address')}
                          className="flex items-center gap-1.5 text-neutral-450 dark:text-neutral-400 hover:text-brand transition-colors cursor-pointer group"
                          title="Click to copy email"
                        >
                          <span>{m.email}</span>
                          <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400" />
                        </button>
                      </td>

                      {canMutate && (
                        <td className="px-6 py-4.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(m)}
                              className="p-1.5 text-neutral-400 hover:text-brand hover:bg-neutral-100 dark:hover:bg-neutral-850 rounded-btn transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(m.id)}
                              className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-neutral-100 dark:hover:bg-neutral-850 rounded-btn transition-colors cursor-pointer"
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
            {members.map((m) => (
              <MobileEntityCard
                key={m.id}
                avatarInitials={getInitials(m.name)}
                title={m.name}
                subtitle={`ID: ${m.id.substring(0, 8)}`}
                badges={[
                  <span
                    key="track"
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                  >
                    {m.tracks?.name || 'Unassigned'}
                  </span>
                ]}
                metadata={[
                  { label: 'Phone', value: m.phone, icon: Phone },
                  { label: 'Email', value: m.email, icon: Mail },
                ]}
                actions={
                  canMutate
                    ? [
                        { label: 'Edit', icon: Edit, onClick: () => handleOpenEdit(m) },
                        { label: 'Delete', icon: Trash2, onClick: () => handleDelete(m.id), variant: 'danger' }
                      ]
                    : []
                }
              />
            ))}
          </div>

          {/* Pagination controls */}
          {total > limit && (
            <div className="flex items-center justify-between p-4 bg-white dark:bg-[#111827] border border-neutral-200 dark:border-neutral-800 rounded-card text-xs text-neutral-450 dark:text-neutral-400">
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
            <h3 className="text-lg font-bold">{editingMember ? 'Edit Technical Member' : 'Add New Technical Member'}</h3>
            <p className="text-xs text-neutral-400 mt-1 mb-5">
              Input the technical member's name and contact details.
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

              {!isHead && (
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
              )}

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
                  {submitting ? 'Submitting...' : editingMember ? 'Save Changes' : 'Create Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;