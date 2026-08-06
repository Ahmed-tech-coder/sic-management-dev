import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Login } from '../pages/Login';
import { DashboardHome } from '../pages/DashboardHome';

import { Heads } from '../pages/Heads';
import { ViceHeads } from '../pages/ViceHeads';
import { Members } from '../pages/Members';
import { Evaluations } from '../pages/Evaluations';
import { ActivityLogs } from '../pages/ActivityLogs';
import Events from '../pages/Events';

// Protected Routes
const ProtectedRoute: React.FC<{ allowedRoles?: string[] }> = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-[#0B0F19]">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect unauthorized roles back to their default landing page
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

// Public Route (Redirects to dashboard if already authenticated)
const PublicRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-[#0B0F19]">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
      </Route>

      {/* Protected Layout Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          
          {/* Shared / Dashboard Home */}
          <Route path="/dashboard" element={<DashboardHome />} />

          {/* Leader & HR Routes */}
          <Route element={<ProtectedRoute allowedRoles={['leader', 'hr']} />}>
            <Route path="/heads" element={<Heads />} />
            <Route path="/vice-heads" element={<ViceHeads />} />
            <Route path="/logs" element={<ActivityLogs />} />
          </Route>

          {/* Shared Content Pages (Leader, HR, Head) */}
          <Route path="/members" element={<Members />} />
<Route path="/evaluations" element={<Evaluations />} />
<Route path="/events" element={<Events />} />
        </Route>
      </Route>

      {/* Fallback routes */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
export default AppRoutes;
