import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { toast } from "sonner";
import {
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  User,
  Shield,
  UserCheck,
  Users,
  X,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const formatToE164 = (input: string): string => {
  const cleaned = input.trim();
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("0")) return "+20" + cleaned.substring(1);
  if (cleaned.startsWith("1")) return "+20" + cleaned;
  return cleaned;
};

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"leader" | "head" | "hr" | null>(null);

  const roles = [
    {
      id: "leader" as const,
      title: "Community Leader",
      icon: Shield,
      desc: "System oversight, audit logs, and global permissions control.",
      theme: "indigo",
      colorClass: "hover:border-indigo-500/50 group-hover:text-indigo-400",
    },
    {
      id: "head" as const,
      title: "Track Head",
      icon: UserCheck,
      desc: "Manage academic tracks, evaluate members, and finalize grades.",
      theme: "emerald",
      colorClass: "hover:border-emerald-500/50 group-hover:text-emerald-400",
    },
    {
      id: "hr" as const,
      title: "HR Auditor",
      icon: Users,
      desc: "Monitor attendance, track progress, and export compliance reports.",
      theme: "violet",
      colorClass: "hover:border-violet-500/50 group-hover:text-violet-400",
    },
  ];

  const handleSelectRole = (roleId: "leader" | "head" | "hr") => {
    setSelectedRole(roleId);
    setIdentifier("");
    setPassword("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const isEmail = identifier.includes("@");
      const payload = isEmail
        ? { email: identifier.trim(), password, role: selectedRole }
        : { phone: formatToE164(identifier), password, role: selectedRole };

      const response = await api.post("/auth/login", payload);
      const { token, user } = response.data;
      login(token, user);
      toast.success(`Welcome back, ${user.name}`);
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] text-slate-200 selection:bg-brand/30 overflow-hidden relative font-sans">
      {/* High-End Background Effect */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-500/10 blur-[120px]" />
        {/* Subtle Grain Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      <main className="relative z-10 w-full max-w-6xl px-6 py-12">
        <header className="text-center mb-16 space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[10px] uppercase tracking-[0.2em] font-bold text-brand"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
            </span>
            Secure Access Gateway
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-4xl md:text-6xl font-black tracking-tighter text-white"
          >
            SIC <span className="text-neutral-500">Management</span>
          </motion.h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((role, i) => (
            <motion.button
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => handleSelectRole(role.id)}
              className={`group relative flex flex-col text-left p-8 rounded-[2rem] bg-neutral-900/40 border border-white/[0.05] backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 ${role.colorClass}`}
            >
              <div className="mb-8 p-4 w-fit rounded-2xl bg-white/5 group-hover:scale-110 transition-transform duration-500">
                <role.icon className="w-8 h-8 text-neutral-400 group-hover:text-inherit" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                {role.title}
                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
              </h3>
              <p className="text-neutral-500 text-sm leading-relaxed mb-8">
                {role.desc}
              </p>
              <div className="mt-auto text-[10px] font-black uppercase tracking-widest text-neutral-600 group-hover:text-neutral-400 transition-colors">
                Enter Portal
              </div>
            </motion.button>
          ))}
        </div>

        <footer className="mt-20 text-center">
          <p className="text-neutral-600 text-xs font-medium tracking-widest uppercase">
            Developed by <span className="text-neutral-400">DevWay</span> &copy; 2026
          </p>
        </footer>
      </main>

      {/* Modal - The Professional Gateway */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-neutral-950 border border-white/10 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden"
            >
              {/* Dynamic Theme Glow */}
              <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 blur-[40px] bg-${selectedRole === 'leader' ? 'indigo' : selectedRole === 'head' ? 'emerald' : 'violet'}-500`} />

              <div className="flex justify-between items-start mb-10">
                <div>
                  <h2 className="text-2xl font-bold text-white">Login</h2>
                  <p className="text-neutral-500 text-sm">Accessing {selectedRole} portal</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-full hover:bg-white/5 text-neutral-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 ml-1">Identity</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-600 group-focus-within:text-brand transition-colors" />
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Email or Phone"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-neutral-700 focus:outline-none focus:border-brand/50 focus:ring-4 focus:ring-brand/5 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 ml-1">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-600 group-focus-within:text-brand transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white placeholder-neutral-700 focus:outline-none focus:border-brand/50 focus:ring-4 focus:ring-brand/5 transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full relative group mt-4 overflow-hidden rounded-2xl bg-white p-[1px] transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="relative flex items-center justify-center gap-2 bg-neutral-950 rounded-[15px] px-8 py-4 transition-all group-hover:bg-transparent">
                    <span className="font-bold text-white group-hover:text-neutral-950 transition-colors">
                      {loading ? "Verifying..." : "Authorize Access"}
                    </span>
                    {!loading && <ArrowRight className="w-4 h-4 text-white group-hover:text-neutral-950 transition-transform group-hover:translate-x-1" />}
                  </div>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;