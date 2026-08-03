import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useConfirm } from '../contexts/ConfirmContext';
import api from '../services/api';
import { toast } from 'sonner';
import { GraduationCap, Plus, Edit, Trash2, Search, Phone, Mail } from 'lucide-react';
import { MobileEntityCard } from '../components/common/MobileEntityCard';
import { EmptyState } from '../components/common/EmptyState';
import { SkeletonLoader } from '../components/common/SkeletonLoader';

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

const formatToE164 = (input: string): string => {
  const cleaned = input.trim();
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  if (cleaned.startsWith('0')) {
    return `+20${cleaned.substring(1)}`;
  }
  return `+20${cleaned}`;
};

export const Members: React.FC = () => {
  const { user } = useAuth();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const canMutate = user?.role === 'head' || user?.role === 'hr';
  const isHead = user?.role === 'head';

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [trackFilter, setTrackFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Modal forms
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TechnicalMember | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    track_id: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch Tracks
  const { data: tracksData } = useQuery<{ tracks: Track[] }>({
    queryKey: ['tracks'],
    queryFn: () => api.get('/tracks').then(res => res.data),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const tracks = tracksData?.tracks || [];

  // Fetch Members
  const { data: membersData, isLoading: loading } = useQuery<{ members: TechnicalMember[]; total: number }>({
    queryKey: ['members', { trackFilter: isHead ? user?.track_id : trackFilter, search, page }],
    queryFn: () =>
      api.get('/technical-members', {
        params: {
          track_id: isHead ? user?.track_id : trackFilter || undefined,
          search: search || undefined,
          page,
          limit,
        },
      }).then(res => res.data),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const members = membersData?.members || [];
  const total = membersData?.total || 0;

  // Pagination prefetching
  useEffect(() => {
    if (page * limit < total) {
      const nextPage = page + 1;
      queryClient.prefetchQuery({
        queryKey: ['members', { trackFilter: isHead ? user?.track_id : trackFilter, search, page: nextPage }],
        queryFn: () =>
          api.get('/technical-members', {
            params: {
              track_id: isHead ? user?.track_id : trackFilter || undefined,
              search: search || undefined,
              page: nextPage,
              limit,
            },
          }).then(res => res.data),
        staleTime: 2 * 60 * 1000,
      });
    }
  }, [page, total, limit, trackFilter, search, queryClient, isHead, user?.track_id]);

  const handleOpenCreate = () => {
    setEditingMember(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      track_id: (isHead ? user?.track_id : tracks[0]?.id) || '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: TechnicalMember) => {
    setEditingMember(m);
    setFormData({
      name: m.name,
      phone: m.phone,
      email: m.email,
      track_id: m.track_id,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.email || (!isHead && !formData.track_id)) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      if (editingMember) {
        const payload = {
          name: formData.name,
          phone: formatToE164(formData.phone),
          email: formData.email,
          track_id: isHead ? undefined : formData.track_id,
        };
        const res = await api.put(`/technical-members/${editingMember.id}`, payload);
        toast.success(res.data.message || 'Technical member updated');
      } else {
        const payload = {
          name: formData.name,
          phone: formatToE164(formData.phone),
          email: formData.email,
          track_id: isHead ? undefined : formData.track_id,
        };
        const res = await api.post('/technical-members', payload);
        toast.success(res.data.message || 'Technical member added');
      }
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const approved = await confirm({
      title: 'Delete Technical Member',
      message: 'Are you sure you want to delete this technical member? This will delete all their evaluations as well.',
      confirmText: 'Delete',
      type: 'danger',
    });
    if (!approved) return;

    try {
      const res = await api.delete(`/technical-members/${id}`);
      toast.success(res.data.message || 'Technical member deleted');
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to delete member');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Technical Members</h2>
          <p className="text-neutral-400 text-sm mt-1">
            {canMutate
              ? 'Add, edit, or delete members inside seasons tracks.'
              : 'View registered technical members for this season.'}
          </p>
        </div>
        
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

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white dark:bg-[#111827] p-4 rounded-card border border-neutral-200 dark:border-neutral-800 shadow-sm items-center">
        
        {/* Search */}
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
            className="w-full bg-neutral-50 dark:bg-[#161F30] border border-neutral-200 dark:border-neutral-800 rounded-input py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-brand"
          />
        </div>

        {/* Track Filter */}
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
      </div>

      {/* Loader, Empty and Table-to-Card Grid */}
      {loading ? (
        <SkeletonLoader variant="table" count={5} />
      ) : members.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No Technical Members Found"
          description={trackFilter || search ? "No members match your search criteria." : "No members registered for the selected season."}
          action={canMutate ? { label: "Add Member", icon: Plus, onClick: handleOpenCreate } : undefined}
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
                          <div className="w-9 h-9 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold">
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-neutral-900 dark:text-neutral-100">{m.name}</p>
                            <p className="text-[10px] text-neutral-400 mt-0.5">ID: {m.id.substring(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className="font-bold px-2.5 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-xs text-neutral-600 dark:text-neutral-300">
                          {m.tracks?.name}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 space-y-0.5 text-xs">
                        <p className="text-neutral-900 dark:text-neutral-200 font-semibold">{m.phone}</p>
                        <p className="text-neutral-450 dark:text-neutral-400">{m.email}</p>
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
                avatarInitials={m.name.charAt(0).toUpperCase()}
                title={m.name}
                subtitle={`ID: ${m.id.substring(0, 8)}`}
                badges={[
                  <span
                    key="track"
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                  >
                    {m.tracks?.name}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
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
                  className="px-4 py-2 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-btn shadow-md shadow-brand/10 transition-colors cursor-pointer"
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
