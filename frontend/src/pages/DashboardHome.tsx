import React, { useMemo } from "react";
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
  UserPlus,
  PlusCircle,
  FileText,
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

  const canViewLogs = useMemo(
    () => !!user && (user.role === "leader" || user.role === "hr"),
    [user],
  );

  const { data: metrics, isLoading: isMetricsLoading } =
    useQuery<DashboardStats>({
      queryKey: ["dashboard-metrics"],
      queryFn: () => api.get("/dashboard/metrics").then((res) => res.data),
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    });

  const { data: recentLogsData, isLoading: isLogsLoading } = useQuery<{
    logs: ActivityLog[];
  }>({
    queryKey: ["dashboard-recent-logs"],
    queryFn: () =>
      api
        .get("/activity-logs", { params: { limit: 5 } })
        .then((res) => res.data),
    enabled: canViewLogs,
    staleTime: 60 * 1000,
    gcTime: 3 * 60 * 1000,
  });

  const loading = isMetricsLoading || (canViewLogs ? isLogsLoading : false);
  const stats = metrics || {
    tracksCount: 0,
    membersCount: 0,
    evaluationsCount: 0,
  };
  const recentLogs = recentLogsData?.logs || [];

  const currentDateFormatted = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, []);

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
        className="relative overflow-hidden bg-slate-900 dark:bg-gradient-to-br dark:from-[#0B0F19] dark:via-[#030712] dark:to-[#0B0F19] p-8 sm:p-10 rounded-[2rem] border border-slate-800 dark:border-white/[0.05] shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-8"
      >
        <div className="absolute -right-10 -top-10 w-96 h-96 bg-brand/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-indigo-500/[0.03] rounded-full blur-[80px] pointer-events-none" />

        <div className="space-y-3 relative z-10 max-w-2xl">
          {/* Live Pulsing Badge */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-[11px] font-bold text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live System Connected
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
            Welcome back,{" "}
            <span className="text-brand dark:text-transparent dark:bg-gradient-to-r dark:from-brand dark:via-brand-light dark:to-white dark:bg-clip-text">
              {" "}
              {user?.name}
            </span>
          </h2>
          <p className="text-sm font-medium text-slate-400">
            {currentDateFormatted}
          </p>
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

      {/* Quick Action Navigation Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/members"
          className="flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-hover shadow-lg shadow-brand/20 transition-all duration-300 hover:-translate-y-1"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Member</span>
        </Link>

        <Link
          to="/evaluations"
          className="flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl bg-white dark:bg-[#0B0F19]/60 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/60 shadow-sm transition-all duration-300 hover:-translate-y-1"
        >
          <PlusCircle className="w-4 h-4 text-brand" />
          <span>New Evaluation</span>
        </Link>

        <Link
          to="/reports"
          className="flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl bg-white dark:bg-[#0B0F19]/60 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/60 shadow-sm transition-all duration-300 hover:-translate-y-1"
        >
          <FileText className="w-4 h-4 text-brand" />
          <span>View Reports</span>
        </Link>
      </div>

      {/* Analytical Bento Matrix Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Tracks Module Data Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="relative overflow-hidden bg-gradient-to-br from-white to-slate-50/50 dark:from-[#0B0F19]/80 dark:to-[#111827]/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-lg flex items-center justify-between group"
        >
          <div className="space-y-2 min-w-0">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block truncate">
              {user?.role === "head" ? "Track Scope" : "Active Tracks"}
            </span>
            <p className="text-2xl font-black truncate text-slate-900 dark:text-white tracking-tight">
              {user?.role === "head"
                ? user.track_name || "Unassigned"
                : `${stats.tracksCount} Structural Tracks`}
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform">
            <Layers className="w-7 h-7" />
          </div>
        </motion.div>

        {/* Technical Members Metrics Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="relative overflow-hidden bg-gradient-to-br from-white to-slate-50/50 dark:from-[#0B0F19]/80 dark:to-[#111827]/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-lg flex items-center justify-between group"
        >
          <div className="space-y-2 min-w-0">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block truncate">
              Total Technical Members
            </span>
            <div className="flex items-baseline gap-2.5">
              <p className="text-2xl font-black truncate text-slate-900 dark:text-white tracking-tight">
                {stats.membersCount}
              </p>
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <TrendingUp className="w-3 h-3" /> Active
              </span>
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform">
            <GraduationCap className="w-7 h-7" />
          </div>
        </motion.div>

        {/* Total Logged Valuations Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="sm:col-span-2 lg:col-span-1 relative overflow-hidden bg-gradient-to-br from-white to-slate-50/50 dark:from-[#0B0F19]/80 dark:to-[#111827]/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-lg flex items-center justify-between group"
        >
          <div className="space-y-2 min-w-0">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block truncate">
              Evaluations Processed
            </span>
            <p className="text-2xl font-black truncate text-slate-900 dark:text-white tracking-tight">
              {stats.evaluationsCount} Metrics Records
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-violet-500/10 text-violet-500 dark:text-violet-400 border border-violet-500/20 flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform">
            <ClipboardList className="w-7 h-7" />
          </div>
        </motion.div>
      </div>

      {/* Dynamic Activity Audit Panel (Timeline Design) */}
      {canViewLogs && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-[#0B0F19]/40 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-[2rem] shadow-sm p-6 sm:p-8 space-y-6"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/[0.06]">
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

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {recentLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs uppercase tracking-widest font-bold">
                No execution transactions parsed inside current node window.
              </div>
            ) : (
              recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="relative flex items-start gap-4 group"
                >
                  {/* Timeline Dot */}
                  <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full bg-white dark:bg-[#0B0F19] border-2 border-brand flex items-center justify-center group-hover:scale-125 transition-transform z-10">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand" />
                  </div>

                  <div className="flex-1 p-4 rounded-2xl bg-slate-50/70 dark:bg-[#111827]/60 border border-slate-200/60 dark:border-white/[0.05] shadow-sm group-hover:border-brand/40 transition-all duration-300">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {log.action}
                      </p>

                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                        {new Date(log.created_at).toLocaleString("en-GB", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {log.description}
                    </p>
                    <div className="mt-2.5 flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                      <span className="px-2 py-0.5 rounded bg-slate-200/60 dark:bg-white/5 border border-slate-300/40 dark:border-white/10">
                        {log.users?.name || "System"} (
                        {log.users?.role || "Leader"})
                      </span>

                      <span>•</span>

                      <span>
                        {new Date(log.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DashboardHome;
