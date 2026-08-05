import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { toast } from 'sonner';
import { 
  History, 
  Clock, 
  User, 
  Trash2, 
  Search, 
  Download, 
  X, 
  FilterX, 
  Activity, 
  ShieldAlert,
  Calendar
} from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { SkeletonLoader } from '../components/common/SkeletonLoader';

// ==========================================
// TYPES & CONSTANTS
// ==========================================
interface ActivityLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  description: string;
  created_at: string;
  users?: {
    name: string;
    role: string;
  };
}

const LOG_MESSAGES = {
  DELETE_SUCCESS: 'Activity log deleted successfully',
  DELETE_FAILED: 'Failed to delete activity log',
  CLEAR_SUCCESS: 'All activity logs cleared successfully',
  CLEAR_FAILED: 'Failed to clear activity logs',
} as const;

// Helper: Format Time Ago
const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
};

// Helper: Action Badge Styling
const getActionBadgeStyle = (action: string) => {
  const act = action.toUpperCase();
  if (act.includes('CREATE') || act.includes('ADD')) {
    return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
  }
  if (act.includes('DELETE') || act.includes('REMOVE')) {
    return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
  }
  if (act.includes('UPDATE') || act.includes('EDIT')) {
    return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
  }
  return 'bg-brand/10 text-brand border-brand/20';
};

// Export to CSV Helper
const exportLogsToCSV = (logs: ActivityLog[]) => {
  if (!logs.length) return;
  const headers = ['ID', 'Action', 'Description', 'Performed By', 'Role', 'Timestamp'];
  const rows = logs.map((log) => [
    log.id,
    `"${log.action}"`,
    `"${log.description.replace(/"/g, '""')}"`,
    `"${log.users?.name || 'System'}"`,
    `"${log.users?.role || 'Admin'}"`,
    `"${new Date(log.created_at).toLocaleString()}"`,
  ]);

  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ==========================================
// MAIN COMPONENT
// ==========================================
export const ActivityLogs: React.FC = () => {
  const { user } = useAuth();
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  // Filters & State
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isLeader = useMemo(() => user?.role === 'leader', [user?.role]);

  // Debounced Search Effect
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Query: Fetch Activity Logs
  const { data: logsData, isLoading: loading } = useQuery<{ logs: ActivityLog[]; total: number }>({
    queryKey: ['activity-logs', { page, search: debouncedSearch, actionFilter }],
    queryFn: () =>
      api
        .get('/activity-logs', {
          params: {
            page,
            limit,
            search: debouncedSearch || undefined,
            action: actionFilter || undefined,
          },
        })
        .then((res) => res.data),
    staleTime: 60 * 1000,
    gcTime: 3 * 60 * 1000,
  });

  const rawLogs = useMemo(() => logsData?.logs || [], [logsData]);
  const total = useMemo(() => logsData?.total || 0, [logsData]);

  // Client-side Filter Backup for Smooth Interaction
  const logs = useMemo(() => {
    return rawLogs.filter((log) => {
      const matchesSearch =
        !debouncedSearch ||
        log.description.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        log.action.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (log.users?.name && log.users.name.toLowerCase().includes(debouncedSearch.toLowerCase()));

      const matchesAction = !actionFilter || log.action.toUpperCase() === actionFilter.toUpperCase();

      return matchesSearch && matchesAction;
    });
  }, [rawLogs, debouncedSearch, actionFilter]);

  // Unique Actions List for Filter Dropdown
  const uniqueActions = useMemo(() => {
    const actionsSet = new Set<string>();
    rawLogs.forEach((l) => actionsSet.add(l.action.toUpperCase()));
    return Array.from(actionsSet);
  }, [rawLogs]);

  // Prefetch Next Page
  useEffect(() => {
    if (page * limit < total) {
      const nextPage = page + 1;
      queryClient.prefetchQuery({
        queryKey: ['activity-logs', { page: nextPage, search: debouncedSearch, actionFilter }],
        queryFn: () =>
          api
            .get('/activity-logs', {
              params: {
                page: nextPage,
                limit,
                search: debouncedSearch || undefined,
                action: actionFilter || undefined,
              },
            })
            .then((res) => res.data),
        staleTime: 60 * 1000,
      });
    }
  }, [page, total, limit, debouncedSearch, actionFilter, queryClient]);

  // Reset Filters Handler
  const handleResetFilters = useCallback(() => {
    setSearch('');
    setActionFilter('');
    setPage(1);
  }, []);

  // Delete Single Log
  const handleDeleteLog = useCallback(
    async (id: string) => {
      const approved = await confirm({
        title: 'Delete Audit Log',
        message: 'Are you sure you want to delete this activity log? This cannot be undone.',
        confirmText: 'Delete',
        type: 'danger',
      });
      if (!approved) return;

      setDeletingId(id);
      try {
        await api.delete(`/activity-logs/${id}`);
        toast.success(LOG_MESSAGES.DELETE_SUCCESS);
        queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
      } catch (err) {
        console.error(err);
        toast.error(LOG_MESSAGES.DELETE_FAILED);
      } finally {
        setDeletingId(null);
      }
    },
    [confirm, queryClient]
  );

  // Clear All Logs
  const handleClearLogs = useCallback(async () => {
    const approved = await confirm({
      title: 'Clear All Audit Logs',
      message:
        'Are you sure you want to delete ALL activity logs in the system? This action is permanent and cannot be undone.',
      confirmText: 'Clear All',
      type: 'danger',
    });
    if (!approved) return;

    try {
      await api.delete('/activity-logs');
      toast.success(LOG_MESSAGES.CLEAR_SUCCESS);
      setPage(1);
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    } catch (err) {
      console.error(err);
      toast.error(LOG_MESSAGES.CLEAR_FAILED);
    }
  }, [confirm, queryClient]);

  const hasActiveFilters = Boolean(search || actionFilter);

  return (
    <div className="space-y-6">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight">System Audit Logs</h2>
            {total > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-semibold">
                {total}
              </span>
            )}
          </div>
          <p className="text-neutral-400 text-sm mt-1">
            Review real-time historical administrative logs and user actions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* Export Button */}
          {logs.length > 0 && (
            <button
              onClick={() => exportLogsToCSV(logs)}
              className="flex items-center justify-center gap-2 px-3.5 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-750 text-neutral-700 dark:text-neutral-200 text-xs font-semibold rounded-btn transition-colors cursor-pointer"
              title="Export Current View to CSV"
            >
              <Download className="w-3.5 h-3.5 text-neutral-500" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          )}

          {isLeader && logs.length > 0 && (
            <button
              onClick={handleClearLogs}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-btn shadow-md transition-colors cursor-pointer shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              <span>Empty Logs</span>
            </button>
          )}
        </div>
      </div>

      {/* Analytics Banner Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-[#111827] border border-neutral-200 dark:border-neutral-800 p-3.5 rounded-card flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Total Recorded</p>
            <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{total}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-neutral-200 dark:border-neutral-800 p-3.5 rounded-card flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Current View</p>
            <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{logs.length}</p>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white dark:bg-[#111827] border border-neutral-200 dark:border-neutral-800 p-3.5 rounded-card flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${hasActiveFilters ? 'bg-amber-500/10 text-amber-500' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'}`}>
            <FilterX className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Filters</p>
            <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
              {hasActiveFilters ? 'Active Filters' : 'All Events'}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white dark:bg-[#111827] p-4 rounded-card border border-neutral-200 dark:border-neutral-800 shadow-sm items-center">
        
        {/* Search */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search action, description, or user..."
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

        {/* Action Type Filter & Reset */}
        <div className="flex items-center gap-2.5 w-full">
          <div className="flex items-center gap-2.5 w-full">
            <span className="text-xs text-neutral-450 dark:text-neutral-500 font-medium shrink-0">Action:</span>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-neutral-50 dark:bg-[#161F30] border border-neutral-200 dark:border-neutral-800 rounded-input py-2 px-3 text-xs focus:outline-none focus:border-brand"
            >
              <option value="">All Actions</option>
              {uniqueActions.map((act) => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>
          </div>

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

      {/* Loader, Empty and Responsive Timeline/Table */}
      {loading ? (
        <SkeletonLoader variant="table" count={5} />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={History}
          title="No Audit Logs Found"
          description={hasActiveFilters ? "No activity logs match your search criteria." : "System activity is tracked automatically as changes occur."}
          action={hasActiveFilters ? { label: "Clear Filters", icon: FilterX, onClick: handleResetFilters } : undefined}
        />
      ) : (
        <div className="space-y-4">
          
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white dark:bg-[#111827] border border-neutral-200 dark:border-neutral-800 rounded-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#161F30] text-xs font-bold uppercase tracking-wider text-neutral-400">
                    <th className="px-6 py-4">Action</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Performed By</th>
                    <th className="px-6 py-4">Timestamp</th>
                    {isLeader && <th className="px-6 py-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-sm">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-neutral-50/50 dark:hover:bg-[#182235]/40 transition-colors">
                      
                      {/* Colored Action Badge */}
                      <td className="px-6 py-4.5">
                        <span className={`inline-block font-bold px-2.5 py-1 rounded text-[10px] tracking-wider border uppercase ${getActionBadgeStyle(log.action)}`}>
                          {log.action}
                        </span>
                      </td>

                      <td className="px-6 py-4.5 text-neutral-550 dark:text-neutral-350 max-w-sm truncate text-xs font-medium" title={log.description}>
                        {log.description}
                      </td>

                      <td className="px-6 py-4.5">
                        <div className="text-xs">
                          <p className="font-semibold text-neutral-900 dark:text-neutral-200">
                            {log.users?.name || 'System'}
                          </p>
                          <p className="text-neutral-400 capitalize text-[10px]">{log.users?.role || 'Admin'}</p>
                        </div>
                      </td>

                      {/* Time Ago + Full Date Tooltip */}
                      <td className="px-6 py-4.5 text-neutral-400 text-xs">
                        <div className="flex items-center gap-1.5" title={new Date(log.created_at).toLocaleString()}>
                          <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span className="font-medium text-neutral-600 dark:text-neutral-300">
                            {formatTimeAgo(log.created_at)}
                          </span>
                        </div>
                      </td>

                      {isLeader && (
                        <td className="px-6 py-4.5 text-right">
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            disabled={deletingId === log.id}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-neutral-100 dark:hover:bg-neutral-850 rounded-btn transition-colors cursor-pointer disabled:opacity-50"
                            title="Delete Log"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Timeline View */}
          <div className="md:hidden bg-white dark:bg-[#111827] border border-neutral-200 dark:border-neutral-800 rounded-card p-5 shadow-sm">
            <div className="relative pl-6 border-l-2 border-neutral-100 dark:border-neutral-800 space-y-6">
              {logs.map((log) => (
                <div key={log.id} className="relative">
                  {/* Timeline dot */}
                  <span className="absolute -left-[31px] top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white dark:bg-[#111827] border-2 border-brand" />
                  
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className={`inline-block font-bold px-2 py-0.5 rounded text-[10px] tracking-wider border uppercase ${getActionBadgeStyle(log.action)}`}>
                        {log.action}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-[10px] text-neutral-400" title={new Date(log.created_at).toLocaleString()}>
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(log.created_at)}</span>
                        </div>
                        {isLeader && (
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            disabled={deletingId === log.id}
                            className="p-1 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer disabled:opacity-50"
                            title="Delete Log"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-350 leading-relaxed">
                      {log.description}
                    </p>

                    <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 pt-0.5">
                      <User className="w-3.5 h-3.5" />
                      <span className="font-bold text-neutral-500 dark:text-neutral-450">{log.users?.name || 'System'}</span>
                      <span className="capitalize text-neutral-400/80">({log.users?.role || 'Admin'})</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination Controls */}
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
    </div>
  );
};

export default ActivityLogs;