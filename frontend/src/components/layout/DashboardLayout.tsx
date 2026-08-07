import React, { useState, useMemo } from "react";
import { useLocation, useNavigate, Outlet, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  GraduationCap,
  ClipboardList,
  Menu,
  X,
  LogOut,
  Sun,
  Moon,
  History,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  if (!user) return null;

  // Compute navigation scheme based on structural privileges
  const navItems = useMemo((): NavItem[] => {
    const coreRoutes = [
      { name: "Overview", path: "/dashboard", icon: LayoutDashboard },
    ];

    const administrationRoutes = [
      { name: "Heads", path: "/heads", icon: Users },
      { name: "Vice Heads", path: "/vice-heads", icon: UserCheck },
    ];

    const operationalRoutes = [
      { name: "Technical Members", path: "/members", icon: GraduationCap },
      { name: "Evaluations", path: "/evaluations", icon: ClipboardList },
    ];

    switch (user.role) {
      case "leader":
        return [
          ...coreRoutes,
          ...administrationRoutes,
          ...operationalRoutes,
          { name: "Activity Logs", path: "/logs", icon: History },
        ];
      case "hr":
        return [...coreRoutes, ...administrationRoutes, ...operationalRoutes];
      case "head":
        return [...coreRoutes, ...operationalRoutes];
      default:
        return [];
    }
  }, [user.role]);

  // Automated parsing engine for recursive sub-routes
  const breadcrumbs = useMemo(() => {
    const rawSegments = location.pathname.split("/").filter(Boolean);
    const crumbs = [{ label: "Dashboard", path: "/dashboard" }];

    if (rawSegments[0] === "dashboard" && rawSegments.length === 1) {
      return crumbs;
    }

    let rollingPath = "";
    rawSegments.forEach((segment) => {
      rollingPath += `/${segment}`;
      if (segment === "dashboard") return;

      const structuredLabel = segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      crumbs.push({ label: structuredLabel, path: rollingPath });
    });

    return crumbs;
  }, [location.pathname]);

  const handleNavNavigation = (path: string) => {
    setIsMobileOpen(false);
    navigate(path);
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] dark:bg-[#030712] text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-brand/20 transition-colors duration-300">
      {/* Sidebar Architecture (Desktop Grid System) */}
      <aside className="hidden lg:flex flex-col w-[290px] fixed inset-y-0 left-0 bg-white/80 dark:bg-[#0B0F19]/60 backdrop-blur-xl border-r border-slate-200/60 dark:border-white/[0.05] z-30">
        {/* Brand Shell */}
        <div className="h-20 flex items-center px-7 border-b border-slate-200/50 dark:border-white/[0.04]">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center text-white font-black text-xl shadow-xl shadow-brand/20 relative overflow-hidden group">
              <span className="relative z-10">S</span>
              <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white leading-tight">
                SIC Platform
              </span>
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 tracking-wider uppercase mt-0.5">
                Enterprise Suite
              </span>
            </div>
          </div>
        </div>

        {/* Content Link Cluster */}
        <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isRouteMatched = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => handleNavNavigation(item.path)}
                className={`w-full relative flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all group cursor-pointer ${
                  isRouteMatched
                    ? "text-brand dark:text-white"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {isRouteMatched && (
                  <motion.span
                    layoutId="activeNavigationPill"
                    className="absolute inset-0 bg-slate-100 dark:bg-white/[0.04] border border-slate-200/40 dark:border-white/[0.06] rounded-xl z-0"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-3.5 w-full">
                  <Icon
                    className={`w-4.5 h-4.5 shrink-0 transition-transform duration-300 group-hover:scale-105 ${
                      isRouteMatched
                        ? "text-brand"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  />
                  <span>{item.name}</span>
                </span>
              </button>
            );
          })}
        </nav>

        {/* Action Panel Utilities & User Context */}
        <div className="p-4 border-t border-slate-200/60 dark:border-white/[0.04] space-y-4 bg-slate-50/50 dark:bg-slate-900/10">
          <div className="flex items-center justify-between px-2">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-white dark:bg-[#111827] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/50 dark:border-white/[0.04] shadow-sm hover:shadow transition-all cursor-pointer"
              aria-label="Toggle Interface System Mode"
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={() => logout()}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* Identity Matrix Grid */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/60 dark:border-white/[0.05] shadow-sm">
            <div className="relative shrink-0 select-none">
              <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold text-sm border border-brand/20 shadow-inner">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#111827]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate text-slate-900 dark:text-white leading-none">
                {user.name}
              </p>
              <p className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase truncate mt-1">
                {user.role === "head" && user.head_type === "vice_head"
                  ? "Vice Head"
                  : user.role}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer (Responsive Adaptability Structure) */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-40 lg:hidden"
            />

            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 left-0 w-[290px] bg-white dark:bg-[#0B0F19] border-r border-slate-200 dark:border-white/[0.05] z-50 flex flex-col lg:hidden"
            >
              <div className="h-20 flex items-center justify-between px-6 border-b border-slate-200 dark:border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="w-8.5 h-8.5 rounded-lg bg-brand flex items-center justify-center text-white font-black text-lg shadow-lg shadow-brand/20">
                    S
                  </div>
                  <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
                    SIC Community
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const isRouteMatched = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavNavigation(item.path)}
                      className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        isRouteMatched
                          ? "bg-brand text-white shadow-lg shadow-brand/10"
                          : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                      }`}
                    >
                      <Icon className="w-4.5 h-4.5 shrink-0" />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-slate-200 dark:border-white/[0.04] space-y-4">
                <div className="flex items-center justify-between px-2">
                  <button
                    onClick={toggleTheme}
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400"
                  >
                    {theme === "light" ? (
                      <Moon className="w-4 h-4" />
                    ) : (
                      <Sun className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => logout()}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-rose-500"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>

                <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-white/[0.05]">
                  <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate text-slate-900 dark:text-white leading-none">
                      {user.name}
                    </p>
                    <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase truncate mt-1">
                      {user.role === "head" && user.head_type === "vice_head"
                        ? "Vice Head"
                        : user.role}
                    </p>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Context Viewer Canvas */}
      <div className="flex-1 flex flex-col lg:pl-[290px]">
        {/* Global Structural Command Ribbon */}
        <header className="h-20 sticky top-0 bg-white/80 dark:bg-[#030712]/60 backdrop-blur-md border-b border-slate-200/50 dark:border-white/[0.04] flex items-center justify-between px-8 z-20 transition-all duration-300">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 lg:hidden cursor-pointer"
              aria-label="Expand Application Context Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Navigational Segment Breadcrumb Map */}
            <nav className="flex items-center gap-2 text-[11px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
              {breadcrumbs.map((crumb, idx) => {
                const isFinalDestination = idx === breadcrumbs.length - 1;
                return (
                  <React.Fragment key={crumb.path}>
                    {idx > 0 && (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700" />
                    )}
                    {isFinalDestination ? (
                      <span className="text-slate-900 dark:text-slate-200 font-extrabold normal-case">
                        {crumb.label}
                      </span>
                    ) : (
                      <Link
                        to={crumb.path}
                        className="hover:text-brand dark:hover:text-white transition-colors normal-case"
                      >
                        {crumb.label}
                      </Link>
                    )}
                  </React.Fragment>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Interface Status Cluster */}
            <div className="hidden lg:flex h-5 w-[1px] bg-slate-200 dark:bg-white/[0.06]" />
            <div
              className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
              title="System Nodes Connected"
            />
          </div>
        </header>

        {/* Workspace Canvas Frame */}
        <main className="flex-1 p-8 overflow-y-auto max-w-[1400px] w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
              className="w-full h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
