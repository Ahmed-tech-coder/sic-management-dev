import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { toast } from 'sonner';
import { History, Clock, User, Trash2 } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { SkeletonLoader } from '../components/common/SkeletonLoader';

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

export const ActivityLogs: React.FC = () => {
  const { user } = useAuth();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const isLeader = user?.role === 'leader';

  const { data: logsData, isLoading: loading } = useQuery<{ logs: ActivityLog[]; total: number }>({
    queryKey: ['activity-logs', { page }],
    queryFn: () =>
      api.get('/activity-logs', {
        params: {
          page,
          limit,
        },
      }).then((res) => res.data),
    staleTime: 60 * 1000,
    gcTime: 3 * 60 * 1000,
  });

  const logs = logsData?.logs || [];
  const total = logsData?.total || 0;

  // Prefetch the next page
  useEffect(() => {
    if (page * limit < total) {
      const nextPage = page + 1;
      queryClient.prefetchQuery({
        queryKey: ['activity-logs', { page: nextPage }],
        queryFn: () =>
          api.get('/activity-logs', {
            params: {
              page: nextPage,
              limit,
            },
          }).then((res) => res.data),
        staleTime: 60 * 1000,
      });
    }
  }, [page, total, limit, queryClient]);

  const handleDeleteLog = async (id: string) => {
    const approved = await confirm({
      title: 'Delete Audit Log',
      message: 'Are you sure you want to delete this activity log? This cannot be undone.',
      confirmText: 'Delete',
      type: 'danger',
    });
    if (!approved) return;

    try {
      await api.delete(`/activity-logs/${id}`);
      toast.success('Activity log deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete activity log');
    }
  };

  const handleClearLogs = async () => {
    const approved = await confirm({
      title: 'Clear All Audit Logs',
      message: 'Are you sure you want to delete ALL activity logs in the system? This action is permanent and cannot be undone.',
      confirmText: 'Clear All',
      type: 'danger',
    });
    if (!approved) return;

    try {
      await api.delete('/activity-logs');
      toast.success('All activity logs cleared successfully');
      setPage(1);
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    } catch (err) {
      console.error(err);
      toast.error('Failed to clear activity logs');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Audit Logs</h2>
          <p className="text-neutral-400 text-sm mt-1">Review real-time historical administrative logs and user actions.</p>
        </div>
        {isLeader && logs.length > 0 && (
          <button
            onClick={handleClearLogs}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-btn shadow-md transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Empty Logs</span>
          </button>
        )}
      </div>

      {/* Loader, Empty and Responsive Timeline/Table */}
      {loading ? (
        <SkeletonLoader variant="table" count={5} />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={History}
          title="No Audit Logs Recorded"
          description="System activity is tracked automatically as changes occur."
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
                      <td className="px-6 py-4.5">
                        <span className="font-bold text-neutral-900 dark:text-white uppercase text-xs tracking-wide">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 text-neutral-550 dark:text-neutral-400 max-w-sm truncate text-xs font-medium" title={log.description}>
                        {log.description}
                      </td>
                      <td className="px-6 py-4.5">
                        <div className="text-xs">
                          <p className="font-semibold text-neutral-900 dark:text-neutral-200">
                            {log.users?.name || 'System'}
                          </p>
                          <p className="text-neutral-400 capitalize">{log.users?.role || 'Admin'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4.5 text-neutral-400 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span>{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                      </td>
                      {isLeader && (
                        <td className="px-6 py-4.5 text-right">
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-neutral-100 dark:hover:bg-neutral-850 rounded-btn transition-colors cursor-pointer"
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
                      <span className="font-bold text-neutral-900 dark:text-white uppercase text-xs tracking-wide">
                        {log.action}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-[10px] text-neutral-400">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {isLeader && (
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="p-1 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
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
    </div>
  );
};
export default ActivityLogs;
