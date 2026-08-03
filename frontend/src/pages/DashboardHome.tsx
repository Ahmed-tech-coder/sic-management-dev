import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import {
  GraduationCap,
  ClipboardList,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { SkeletonLoader } from "../components/common/SkeletonLoader";

interface DashboardStats {
  tracksCount: number;
  membersCount: number;
  evaluationsCount: number;
}

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  created_at: string;
  users?: {
    name: string;
    role: string;
  };
}

export const DashboardHome: React.FC = () => {
  const { user } = useAuth();

  const { data: metrics, isLoading: isMetricsLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard-metrics"],
    queryFn: () => api.get("/dashboard/metrics").then((res) => res.data),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: recentLogsData, isLoading: isLogsLoading } = useQuery<{ logs: ActivityLog[] }>({
    queryKey: ["dashboard-recent-logs"],
    queryFn: () =>
      api.get("/activity-logs", { params: { limit: 5 } }).then((res) => res.data),
    enabled: !!user && (user.role === "leader" || user.role === "hr"),
    staleTime: 60 * 1000,
    gcTime: 3 * 60 * 1000,
  });

  const loading = isMetricsLoading || (!!user && (user.role === "leader" || user.role === "hr") ? isLogsLoading : false);
  const stats = metrics || { tracksCount: 0, membersCount: 0, evaluationsCount: 0 };
  const recentLogs = recentLogsData?.logs || [];

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-48 bg-slate-200 dark:bg-white/[0.03] rounded-[2rem]" />
        <SkeletonLoader variant="stats" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-200 dark:bg-white/[0.03] rounded-[2rem]" />
          <div className="h-96 bg-slate-200 dark:bg-white/[0.03] rounded-[2rem]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Hero Panel */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative overflow-hidden dark:bg-gradient-to-br from-slate-900 via-[#0B0F19] to-slate-950 dark:from-[#0B0F19] dark:via-[#030712] dark:to-[#0B0F19] p-8 sm:p-10 rounded-[2rem] border border-slate-200/10 dark:border-white/[0.05] shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-8"
      >
        {/* Deep Field Ambient Vector */}
        <div className="absolute -right-10 -top-10 w-96 h-96 bg-brand/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-indigo-500/[0.03] rounded-full blur-[80px] pointer-events-none" />

        <div className="space-y-3 relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.04] text-[10px] uppercase tracking-widest font-bold text-slate-400">
            <Sparkles className="w-3 h-3 text-brand" />
            System Workspace Connected
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black dark:text-white tracking-tight leading-none">
            Welcome back,{" "}
            <span className="dark:text-transparent bg-gradient-to-r from-brand via-brand-light to-white bg-clip-text font-black">
              {user?.name}
            </span>
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-medium pt-1">
            {user?.role === "leader"
              ? "Access general administrative controls, distribute season requirements, monitor configuration metrics, and export data logs."
              : user?.role === "head"
                ? `Evaluate operational tracks, process performance matrices, and guide technical members in "${user.track_name}".`
                : "Review data integrity streams, verify operations reports, and cross-reference evaluation logs."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3.5 shrink-0 relative z-10">
          {user?.role === "head" && (
            <>
              <Link
                to="/members"
                className="flex items-center justify-center gap-2.5 px-6 py-3.5 bg-brand hover:bg-brand-hover text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xl shadow-brand/20 transition-all duration-300 hover:-translate-y-0.5"
              >
                <span>Manage Track</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/evaluations"
                className="flex items-center justify-center gap-2.5 px-6 py-3.5 bg-white/[0.04] hover:bg-white/[0.08] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all border border-white/10 backdrop-blur-md hover:-translate-y-0.5"
              >
                <span>Perform Audits</span>
              </Link>
            </>
          )}
        </div>
      </motion.div>

      {/* Analytical Bento Matrix Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Tracks Module Data Card */}
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="bg-white dark:bg-[#0B0F19]/40 backdrop-blur-md p-6 rounded-[1.75rem] border border-slate-200/60 dark:border-white/[0.05] shadow-sm flex items-center justify-between group"
        >
          <div className="space-y-1.5 min-w-0">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block truncate">
              {user?.role === "head" ? "Track Scope" : "Active Tracks"}
            </span>
            <p className="text-xl sm:text-2xl font-black truncate text-slate-900 dark:text-white tracking-tight">
              {user?.role === "head"
                ? user.track_name
                : `${stats.tracksCount} Structural Tracks`}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/5 dark:bg-indigo-500/[0.03] text-indigo-500 dark:text-indigo-400 border border-indigo-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
            <Layers className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Technical Members Metrics Card */}
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="bg-white dark:bg-[#0B0F19]/40 backdrop-blur-md p-6 rounded-[1.75rem] border border-slate-200/60 dark:border-white/[0.05] shadow-sm flex items-center justify-between group"
        >
          <div className="space-y-1.5 min-w-0">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block truncate">
              Total Technical Members
            </span>
            <p className="text-xl sm:text-2xl font-black truncate text-slate-900 dark:text-white tracking-tight">
              {stats.membersCount}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/[0.03] text-emerald-500 dark:text-emerald-400 border border-emerald-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
            <GraduationCap className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Total Logged Valuations Card */}
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="sm:col-span-2 lg:col-span-1 bg-white dark:bg-[#0B0F19]/40 backdrop-blur-md p-6 rounded-[1.75rem] border border-slate-200/60 dark:border-white/[0.05] shadow-sm flex items-center justify-between group"
        >
          <div className="space-y-1.5 min-w-0">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block truncate">
              Evaluations Processed
            </span>
            <p className="text-xl sm:text-2xl font-black truncate text-slate-900 dark:text-white tracking-tight">
              {stats.evaluationsCount} Metrics Records
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-violet-500/5 dark:bg-violet-500/[0.03] text-violet-500 dark:text-violet-400 border border-violet-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
            <ClipboardList className="w-5 h-5" />
          </div>
        </motion.div>
      </div>

      {/* Dynamic Activity Audit Panel */}
      <div className="grid grid-cols-1 gap-6">
        {(user?.role === "leader" || user?.role === "hr") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="bg-white dark:bg-[#0B0F19]/20 backdrop-blur-md border border-slate-200/60 dark:border-white/[0.05] rounded-[2rem] shadow-sm p-6 sm:p-8 space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.04] pb-5">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-white/[0.03] text-slate-500 dark:text-slate-400 border border-slate-200/40 dark:border-white/[0.05]">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
                    Administrative Action Logs
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                    Immutable processing ledger of database operations
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {recentLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs uppercase tracking-widest font-bold">
                  No execution transactions parsed inside current node window.
                </div>
              ) : (
                recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex gap-4 p-5 rounded-2xl bg-slate-50/50 dark:bg-[#111827]/40 border border-slate-100 dark:border-white/[0.03] text-sm hover:border-slate-200 dark:hover:border-white/[0.06] transition-all duration-300"
                  >
                    <div className="w-9 h-9 rounded-xl bg-brand/5 dark:bg-brand/[0.02] text-brand border border-brand/10 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="font-bold text-slate-900 dark:text-slate-100 tracking-tight text-sm">
                        {log.action}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-xs font-medium">
                        {log.description}
                      </p>
                      <div className="flex items-center gap-2.5 text-[10px] text-slate-400 dark:text-slate-500 mt-3 font-bold uppercase tracking-wider">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 border border-slate-200/40 dark:border-white/[0.04]">
                          {log.users?.name || "System"} (
                          {log.users?.role || "Leader"})
                        </span>
                        <span>•</span>
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DashboardHome;
