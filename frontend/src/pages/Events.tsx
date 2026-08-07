import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  MapPin,
  Users,
  Pencil,
  Trash2,
  Plus,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useConfirm } from "../contexts/ConfirmContext";
import api from "../services/api";
import { toast } from "sonner";
import { SkeletonLoader } from "../components/common/SkeletonLoader";
import { EmptyState } from "../components/common/EmptyState";

interface EventType {
  id: string;
  name: string;
  date: string;
  location: string;
  members: number;
  status: string;
  created_at?: string;
  updated_at?: string;
}

const Events = () => {
  const { user: currentUser } = useAuth();
  const confirm = useConfirm();

  // Roles permitted to create, edit or delete events
  const isAuthorized =
    currentUser?.role === "leader" ||
    currentUser?.role === "head" ||
    currentUser?.role === "hr";

  const [eventList, setEventList] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalParticipants: 0,
    upcomingEvents: 0,
  });

  // Modal forms
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState({
    name: "",
    date: "",
    location: "",
    members: "",
    status: "Upcoming",
  });

  // Filtering & Pagination
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 6; // 6 cards per page looks perfect on grid

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get("/events", {
        params: {
          search: search || undefined,
          status: filter !== "All" ? filter : undefined,
          page,
          limit,
        },
      });
      setEventList(res.data.events || []);
      setTotal(res.data.total || 0);
      if (res.data.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [page, filter, search]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setNewEvent({
      name: "",
      date: "",
      location: "",
      members: "",
      status: "Upcoming",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !newEvent.name.trim() ||
      !newEvent.date.trim() ||
      !newEvent.location.trim() ||
      !newEvent.members
    ) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: newEvent.name,
        date: newEvent.date,
        location: newEvent.location,
        members: Number(newEvent.members),
        status: newEvent.status || "Upcoming",
      };

      if (editingId !== null) {
        await api.put(`/events/${editingId}`, payload);
        toast.success("Event updated successfully ✏️");
      } else {
        await api.post("/events", payload);
        toast.success("Event created successfully 🚀");
      }
      fetchEvents();
      handleCloseModal();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to save event");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Delete Event",
      message:
        "Are you sure you want to delete this event? This action cannot be undone.",
    });

    if (!isConfirmed) return;

    try {
      await api.delete(`/events/${id}`);
      toast.success("Event deleted successfully 🗑️");
      fetchEvents();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete event");
    }
  };

  return (
    <div className="space-y-8 p-2 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Events
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Manage SIC community events & workshops
          </p>
        </div>

        {/* 🔥 Add Event Button (Only for authorized roles) */}
        {isAuthorized && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 via-rose-500 to-red-500 hover:opacity-95 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-red-500/20 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <Plus size={20} /> Add Event
          </button>
        )}
      </div>

      {/* Controls: Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-orange-500"
          />
          <input
            type="text"
            placeholder="Search event by name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F17] outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 dark:text-white text-sm transition-all duration-200"
          />
        </div>

        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-44 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F17] outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 dark:text-white text-sm transition-all duration-200 cursor-pointer"
        >
          <option value="All">All Status</option>
          <option value="Upcoming">Upcoming</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#0B0F17] rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Events
            </p>
            <h2 className="text-2xl font-bold dark:text-white mt-1">
              {stats.totalEvents}
            </h2>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <CalendarDays size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0B0F17] rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Participants
            </p>
            <h2 className="text-2xl font-bold dark:text-white mt-1">
              {stats.totalParticipants}
            </h2>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0B0F17] rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Upcoming
            </p>
            <h2 className="text-2xl font-bold dark:text-white mt-1">
              {stats.upcomingEvents}
            </h2>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
            <CalendarDays size={24} />
          </div>
        </div>
      </div>

      {/* Events Cards / Skeletons / Empty State */}
      {loading ? (
        <SkeletonLoader variant="card" count={6} />
      ) : eventList.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No events found"
          description={
            search
              ? "Try searching for a different keyword."
              : "Click Add Event to register a new community event."
          }
          action={
            isAuthorized
              ? {
                  label: "Add Event",
                  icon: Plus,
                  onClick: () => setIsModalOpen(true),
                }
              : undefined
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {eventList.map((event) => (
              <div
                key={event.id}
                className="group bg-white dark:bg-[#0B0F17] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col justify-between hover:border-red-500/40 dark:hover:border-red-500/40 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-red-500 transition-colors">
                        {event.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        SIC Community Event
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        event.status === "Upcoming"
                          ? "bg-gradient-to-r from-orange-500/10 to-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20"
                          : "bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20"
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>

                  <div className="mt-5 space-y-3 text-sm">
                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                      <CalendarDays size={16} className="text-blue-500" />
                      <span>
                        {new Date(event.date).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                      <MapPin size={16} className="text-orange-500" />
                      <span>{event.location}</span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                      <Users size={16} className="text-red-500" />
                      <span>{event.members} Participants</span>
                    </div>
                  </div>
                </div>

                {/* Actions (Only visible to authorized roles) */}
                {isAuthorized && (
                  <div className="flex gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      onClick={() => {
                        setEditingId(event.id);
                        setNewEvent({
                          name: event.name,
                          date: event.date
                            ? new Date(event.date).toISOString().split("T")[0]
                            : "",
                          location: event.location,
                          members: event.members.toString(),
                          status: event.status,
                        });
                        setIsModalOpen(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 font-medium text-xs hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400 transition"
                    >
                      <Pencil size={14} /> Edit
                    </button>

                    <button
                      onClick={() => handleDelete(event.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 font-medium text-xs hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {total > limit && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <span className="text-xs text-neutral-500 dark:text-neutral-455 font-medium">
                Showing {(page - 1) * limit + 1} to{" "}
                {Math.min(page * limit, total)} of {total} events
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="p-2 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed dark:text-white transition"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={page * limit >= total}
                  onClick={() => setPage(page + 1)}
                  className="p-2 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed dark:text-white transition"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal Container */}
      {isModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={handleCloseModal}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white dark:bg-[#0B0F17] rounded-3xl p-7 w-full max-w-[430px] shadow-2xl border border-slate-200 dark:border-slate-800"
          >
            {/* Close Button Header */}
            <button
              onClick={handleCloseModal}
              className="absolute top-6 right-6 text-slate-400 hover:text-red-500 dark:hover:text-red-400 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {editingId !== null ? "Edit Event ✏️" : "Create Event 🚀"}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs">
              Fill in the details below to add or update your event.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">
                  Event Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. React Workshop"
                  value={newEvent.name}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, name: e.target.value })
                  }
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none transition-all duration-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">
                  Date
                </label>
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, date: e.target.value })
                  }
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none transition-all duration-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Online or Hall A"
                  value={newEvent.location}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, location: e.target.value })
                  }
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none transition-all duration-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">
                  Participants Count
                </label>
                <input
                  type="number"
                  placeholder="e.g. 50"
                  value={newEvent.members}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, members: e.target.value })
                  }
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none transition-all duration-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/30"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">
                  Status
                </label>
                <select
                  value={newEvent.status || "Upcoming"}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, status: e.target.value })
                  }
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none transition-all duration-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/30 cursor-pointer"
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              {/* 🔥 Gradient Save Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-orange-500 via-rose-500 to-red-500 shadow-lg shadow-red-500/30 hover:opacity-95 hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-50"
                >
                  {submitting
                    ? "Saving..."
                    : editingId !== null
                      ? "Update Event ✏️"
                      : "Save Event 🚀"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Events;
