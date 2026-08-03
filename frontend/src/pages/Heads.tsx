import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useConfirm } from '../contexts/ConfirmContext';
import api from '../services/api';
import { toast } from 'sonner';
import { Users, Plus, Edit, Trash2, ToggleLeft, ToggleRight, Search, Key, Phone, Mail, Eye, EyeOff } from 'lucide-react';
import { MobileEntityCard } from '../components/common/MobileEntityCard';
import { EmptyState } from '../components/common/EmptyState';
import { SkeletonLoader } from '../components/common/SkeletonLoader';

interface Track {
  id: string;
  name: string;
}

interface HeadUser {
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

export const Heads: React.FC = () => {
  const { user: currentUser } = useAuth();
  const confirm = useConfirm();
  const isLeader = currentUser?.role === 'leader';

  const [heads, setHeads] = useState<HeadUser[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Pagination
  const [search, setSearch] = useState('');
  const [trackFilter, setTrackFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);

  // Modal forms
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHead, setEditingHead] = useState<HeadUser | null>(null);
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

  const fetchHeads = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users', {
        params: {
          role: 'head',
          head_type: 'head',
          track_id: trackFilter || undefined,
          search: search || undefined,
          page,
          limit,
        },
      });
      setHeads(res.data.users || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load Heads list');
    } finally {
      setLoading(false);
    }
  };

  const fetchTracks = async () => {
    try {
      const res = await api.get('/tracks');
      setTracks(res.data.tracks || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHeads();
  }, [page, trackFilter, search]);

  useEffect(() => {
    fetchTracks();
  }, []);

  const handleOpenCreate = () => {
    setEditingHead(null);
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
  };

  const handleOpenEdit = (head: HeadUser) => {
    setEditingHead(head);
    setShowPassword(false);
    setFormData({
      name: head.name,
      phone: head.phone,
      email: head.email,
      password: '', // Optional
      track_id: head.track_id,
      is_active: head.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.email || (!editingHead && !formData.password)) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      if (editingHead) {
        const payload = {
          name: formData.name,
          phone: formatToE164(formData.phone),
          email: formData.email,
          role: 'head',
          head_type: 'head',
          track_id: formData.track_id,
          is_active: formData.is_active,
          password: formData.password ? formData.password : undefined,
        };
        const res = await api.put(`/users/${editingHead.id}`, payload);
        toast.success(res.data.message || 'Head updated successfully');
      } else {
        const payload = {
          name: formData.name,
          phone: formatToE164(formData.phone),
          email: formData.email,
          password: formData.password,
          role: 'head',
          head_type: 'head',
          track_id: formData.track_id,
        };
        const res = await api.post('/users', payload);
        toast.success(res.data.message || 'Head created successfully');
      }
      setIsModalOpen(false);
      fetchHeads();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const approved = await confirm({
      title: 'Delete Head Member',
      message: 'Are you sure you want to delete this Head? This action is permanent.',
      confirmText: 'Delete',
      type: 'danger',
    });
    if (!approved) return;

    try {
      const res = await api.delete(`/users/${id}`);
      toast.success(res.data.message || 'Head deleted successfully');
      fetchHeads();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to delete Head');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Heads Management</h2>
          <p className="text-neutral-400 text-sm mt-1">
            {isLeader ? 'Create, manage, and assign tracks to Heads.' : 'View Heads and their assigned tracks.'}
          </p>
        </div>
        
        {isLeader && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand hover:bg-brand-hover text-white text-sm font-semibold rounded-btn shadow-md shadow-brand/10 transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Head</span>
          </button>
        )}
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
            className="w-full bg-neutral-50 dark:bg-[#161F30] border border-neutral-200 dark:border-neutral-800 rounded-input py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-brand"
          />
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
        </div>
      </div>

      {/* Loader, Empty and Table-to-Card Grid */}
      {loading ? (
        <SkeletonLoader variant="table" count={5} />
      ) : heads.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Heads Found"
          description={trackFilter || search ? "No heads match your filters." : "No head members registered."}
          action={isLeader ? { label: "Add Head", icon: Plus, onClick: handleOpenCreate } : undefined}
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
                    <th className="px-6 py-4">Status</th>
                    {isLeader && <th className="px-6 py-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-sm">
                  {heads.map((head) => (
                    <tr key={head.id} className="hover:bg-neutral-50/50 dark:hover:bg-[#182235]/40 transition-colors">
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold">
                            {head.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-neutral-900 dark:text-neutral-100">{head.name}</p>
                            <p className="text-[10px] text-neutral-400 mt-0.5">ID: {head.id.substring(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className="font-bold px-2.5 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-xs text-neutral-600 dark:text-neutral-300">
                          {head.tracks?.name || 'Unassigned'}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 space-y-0.5 text-xs">
                        <p className="text-neutral-900 dark:text-neutral-200 font-semibold">{head.phone}</p>
                        <p className="text-neutral-450 dark:text-neutral-400">{head.email}</p>
                      </td>
                      <td className="px-6 py-4.5">
                        {head.is_active ? (
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
                              onClick={() => handleOpenEdit(head)}
                              className="p-1.5 text-neutral-400 hover:text-brand hover:bg-neutral-100 dark:hover:bg-neutral-850 rounded-btn transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(head.id)}
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
            {heads.map((head) => (
              <MobileEntityCard
                key={head.id}
                avatarInitials={head.name.charAt(0).toUpperCase()}
                title={head.name}
                subtitle={`ID: ${head.id.substring(0, 8)}`}
                badges={[
                  <span
                    key="track"
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                  >
                    {head.tracks?.name || 'Unassigned'}
                  </span>,
                  <span
                    key="status"
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      head.is_active
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                    }`}
                  >
                    {head.is_active ? 'Active' : 'Inactive'}
                  </span>
                ]}
                metadata={[
                  { label: 'Phone', value: head.phone, icon: Phone },
                  { label: 'Email', value: head.email, icon: Mail },
                ]}
                actions={
                  isLeader
                    ? [
                        { label: 'Edit', icon: Edit, onClick: () => handleOpenEdit(head) },
                        { label: 'Delete', icon: Trash2, onClick: () => handleDelete(head.id), variant: 'danger' }
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
            <h3 className="text-lg font-bold">{editingHead ? 'Edit Head Member' : 'Add New Head Member'}</h3>
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
                  Password {editingHead && <span className="text-[10px] lowercase text-neutral-500">(Leave blank to keep current)</span>}
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingHead ? '••••••••' : 'Password (min 6 chars)'}
                    className="w-full bg-neutral-50 dark:bg-[#161F30] border border-neutral-200 dark:border-neutral-800 rounded-input py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:border-brand"
                    required={!editingHead}
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

                {editingHead && (
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
                  className="px-4 py-2 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-btn shadow-md shadow-brand/10 transition-colors cursor-pointer"
                >
                  {submitting ? 'Submitting...' : editingHead ? 'Save Changes' : 'Create Head'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Heads;
