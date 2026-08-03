import React, { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { useConfirm } from "../contexts/ConfirmContext";
import api from "../services/api";
import { toast } from "sonner";
import {
  ClipboardList,
  Plus,
  Edit,
  Trash2,
  Search,
  Download,
  Upload,
  UserCheck,
  CheckCircle,
  AlertCircle,
  X,
  MessageSquare,
} from "lucide-react";
import { MobileEntityCard } from "../components/common/MobileEntityCard";
import { EmptyState } from "../components/common/EmptyState";
import { SkeletonLoader } from "../components/common/SkeletonLoader";

interface Track {
  id: string;
  name: string;
}

interface TechnicalMember {
  id: string;
  name: string;
  track_id: string;
}

interface Evaluation {
  id: string;
  task_name: string;
  technical_member_id: string;
  evaluator_id: string;
  score: number;
  max_score: number;
  notes: string;
  created_at: string;
  technical_members?: {
    name: string;
    tracks?: {
      name: string;
    };
  };
  evaluator?: {
    name: string;
    role: string;
  };
}

export const Evaluations: React.FC = () => {
  const { user } = useAuth();
  const confirm = useConfirm();
  const isHead = user?.role === "head" && user.track_name != "HR";
  const isLeader = user?.role === "leader";
  const isHR = user?.role === "hr";
  const canMutate = isHead;
  const canExport = isHead || isLeader || isHR;

  const queryClient = useQueryClient();

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [evaluatorSearch, setEvaluatorSearch] = useState("");
  const [trackFilter, setTrackFilter] = useState("");
  const [taskFilter, setTaskFilter] = useState("");
  const [page, setPage] = useState(1);
  // Temporary: fetch a large page so the UI shows the full evaluations list.
  const EVALUATIONS_PER_PAGE = 50;


  // Modal forms
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEval, setEditingEval] = useState<Evaluation | null>(null);
  const [formData, setFormData] = useState({
    task_name: "",
    technical_member_id: "",
    score: 0,
    max_score: 100,
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // CSV Import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    message: string;
    successCount: number;
    errorCount: number;
    totalRows: number;
    results: { row: number; status: "success" | "error"; error?: string }[];
  } | null>(null);

  // State for displaying evaluation feedback in a professional dialog modal
  const [viewingNotesEval, setViewingNotesEval] = useState<Evaluation | null>(
    null,
  );

  // Fetch Tracks
  const { data: tracksData } = useQuery<{ tracks: Track[] }>({
    queryKey: ["tracks"],
    queryFn: () => api.get("/tracks").then((res) => res.data),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const tracks = tracksData?.tracks || [];

  // Fetch Members for Dropdown
  const { data: membersData } = useQuery<{ members: TechnicalMember[] }>({
    queryKey: ["members-dropdown", { track_id: user?.track_id }],
    queryFn: () =>
      api
        .get("/technical-members", {
          params: {
            track_id: user?.track_id,
            limit: 100,
          },
        })
        .then((res) => res.data),
    enabled: isModalOpen && isHead,
    staleTime: 5 * 60 * 1000,
  });

  const members = membersData?.members || [];

  // Fetch Evaluations
  const { data: evaluationsData, isLoading: loading } = useQuery<{
    evaluations: Evaluation[];
    tasks: string[];
    total: number;
  }>({
    queryKey: [
      "evaluations",
      {
        trackFilter: isHead ? user?.track_id : trackFilter,
        search,
        evaluatorSearch,
        task: taskFilter,
        page,
      },
    ],
    queryFn: () =>
      api
        .get("/evaluations", {
          params: {
            track_id: isHead ? user?.track_id : trackFilter || undefined,
            search: search || undefined,
            evaluator: evaluatorSearch || undefined,
            task: taskFilter || undefined,
            page,
            limit: EVALUATIONS_PER_PAGE,
          },
        })
        .then((res) => res.data),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const evaluations = evaluationsData?.evaluations || [];
  const uniqueTasks = evaluationsData?.tasks || [];
  const total = evaluationsData?.total || 0;

  const handleOpenCreate = () => {
    setEditingEval(null);
    setFormData({
      task_name: "",
      technical_member_id: members[0]?.id || "",
      score: 0,
      max_score: 100,
      notes: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ev: Evaluation) => {
    setEditingEval(ev);
    setFormData({
      task_name: ev.task_name,
      technical_member_id: ev.technical_member_id,
      score: ev.score,
      max_score: ev.max_score || 100,
      notes: ev.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.task_name || !formData.technical_member_id) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.score > formData.max_score) {
      toast.error(
        `Score cannot exceed the task total score (${formData.max_score})`,
      );
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        task_name: formData.task_name,
        technical_member_id: formData.technical_member_id,
        score: Number(formData.score),
        max_score: Number(formData.max_score),
        notes: formData.notes || null,
      };

      if (editingEval) {
        const res = await api.put(`/evaluations/${editingEval.id}`, payload);
        toast.success(res.data.message || "Evaluation updated");
      } else {
        const res = await api.post("/evaluations", payload);
        toast.success(res.data.message || "Evaluation logged successfully");
      }
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["evaluations"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const approved = await confirm({
      title: "Delete Evaluation Record",
      message:
        "Are you sure you want to delete this evaluation? This action cannot be undone.",
      confirmText: "Delete",
      type: "danger",
    });
    if (!approved) return;

    try {
      const res = await api.delete(`/evaluations/${id}`);
      toast.success(res.data.message || "Evaluation deleted");
      queryClient.invalidateQueries({ queryKey: ["evaluations"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to delete evaluation");
    }
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams();

    if (isHead) {
      if (user?.track_id) params.append("track_id", user.track_id);
    } else if (trackFilter) {
      params.append("track_id", trackFilter);
    }

    if (search) params.append("search", search);
    if (taskFilter) params.append("task", taskFilter);

    api
      .get(`/evaluations/export?${params.toString()}`, { responseType: "blob" })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;

        const contentDisposition = response.headers["content-disposition"];
        let filename = "evaluations_report.csv";
        if (contentDisposition) {
          const match = contentDisposition.match(/filename=(.+)/);
          if (match && match[1]) filename = match[1];
        }

        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch((err) => {
        console.error("CSV export error:", err);
        toast.error("Failed to export CSV");
      });
  };

  // Client-side filtering by evaluator
  const filteredEvaluations = evaluations.filter((ev) => {
    if (!evaluatorSearch) return true;
    return ev.evaluator?.name
      ?.toLowerCase()
      .includes(evaluatorSearch.toLowerCase());
  });

  const getScoreBadgeStyles = (score: number, maxScore: number = 100) => {
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    if (percentage >= 85) {
      return "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20";
    } else if (percentage >= 65) {
      return "bg-amber-500/10 text-amber-500 border border-amber-500/20";
    } else {
      return "bg-rose-500/10 text-rose-500 border border-rose-500/20";
    }
  };

  // CSV Import handler
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset the input so the same file can be re-selected
    e.target.value = "";

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) {
        toast.error("Could not read file");
        return;
      }

      // Detect delimiter: tab or comma
      const firstLine = text.split("\n")[0];
      const delimiter = firstLine.includes("\t") ? "\t" : ",";

      const lines = text.split("\n").filter((line) => line.trim() !== "");
      if (lines.length < 2) {
        toast.error(
          "CSV file must have a header row and at least one data row",
        );
        return;
      }

      // Parse header
      const headers = lines[0]
        .split(delimiter)
        .map((h) => h.trim().toLowerCase().replace(/["']/g, ""));

      // Map known header variations
      const assessmentIdx = headers.findIndex((h) =>
        [
          "assessment_name",
          "assessmentname",
          "task_name",
          "taskname",
          "اسم الاختبار",
        ].includes(h),
      );
      const studentIdx = headers.findIndex((h) =>
        ["student_name", "studentname", "name", "اسم الطالب"].includes(h),
      );
      const totalGradeIdx = headers.findIndex((h) =>
        ["total_grade", "totalgrade", "max_score", "الدرجة الكلية"].includes(h),
      );
      const studentGradeIdx = headers.findIndex((h) =>
        ["student_grade", "studentgrade", "score", "درجة الطالب"].includes(h),
      );

      if (
        assessmentIdx === -1 ||
        studentIdx === -1 ||
        totalGradeIdx === -1 ||
        studentGradeIdx === -1
      ) {
        toast.error(
          "CSV headers not recognized. Expected: assessment_name, student_name, total_grade, student_grade",
        );
        return;
      }

      // Parse data rows
      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i]
          .split(delimiter)
          .map((c) => c.trim().replace(/["']/g, ""));
        if (
          cols.length <
          Math.max(assessmentIdx, studentIdx, totalGradeIdx, studentGradeIdx) +
          1
        )
          continue;

        rows.push({
          assessment_name: cols[assessmentIdx],
          student_name: cols[studentIdx],
          total_grade: parseFloat(cols[totalGradeIdx]) || 0,
          student_grade: parseFloat(cols[studentGradeIdx]) || 0,
        });
      }

      if (rows.length === 0) {
        toast.error("No valid data rows found in the CSV");
        return;
      }

      setImporting(true);
      try {
        const res = await api.post("/evaluations/import", { rows });
        setImportResults(res.data);
        queryClient.invalidateQueries({ queryKey: ["evaluations"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });

        if (res.data.errorCount === 0) {
          toast.success(
            `Successfully imported ${res.data.successCount} evaluations`,
          );
        } else {
          toast.warning(
            `Imported ${res.data.successCount} of ${res.data.totalRows} rows. ${res.data.errorCount} had errors.`,
          );
        }
      } catch (err: any) {
        console.error(err);
        toast.error(err.response?.data?.error || "Failed to import CSV");
      } finally {
        setImporting(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Evaluations Records
          </h2>
          <p className="text-neutral-400 text-sm mt-1">
            {canMutate
              ? "Assess student tasks, register grade points, and attach feedback."
              : "Review evaluations across seasons and tracks."}
          </p>
        </div>

        <div className="flex gap-3 shrink-0">
          {canExport && (
            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-semibold rounded-btn border border-neutral-700 transition-colors shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          )}

          {canMutate && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.txt"
                className="hidden"
                onChange={handleImportCSV}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-semibold rounded-btn border border-neutral-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>{importing ? "Importing..." : "Import CSV"}</span>
              </button>
              <button
                onClick={handleOpenCreate}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand hover:bg-brand-hover text-white text-sm font-semibold rounded-btn shadow-md shadow-brand/10 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Evaluation</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white dark:bg-[#111827] p-4 rounded-card border border-neutral-200 dark:border-neutral-800 shadow-sm items-center">
        {/* Search Student / Task */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search student or task..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-neutral-50 dark:bg-[#161F30] border border-neutral-200 dark:border-neutral-800 rounded-input py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-brand"
          />
        </div>

        {/* Search Evaluator */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search evaluator..."
            value={evaluatorSearch}
            onChange={(e) => {
              setEvaluatorSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-neutral-50 dark:bg-[#161F30] border border-neutral-200 dark:border-neutral-800 rounded-input py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-brand"
          />
        </div>

        {/* Task Filter */}
        <div className="flex items-center gap-2.5 w-full">
          <span className="text-xs text-neutral-455 dark:text-neutral-500 font-medium shrink-0">
            Task:
          </span>
          <select
            value={taskFilter}
            onChange={(e) => {
              setTaskFilter(e.target.value);
              setPage(1);
            }}
            className="w-full bg-neutral-50 dark:bg-[#161F30] border border-neutral-200 dark:border-neutral-800 rounded-input py-2 px-3 text-xs focus:outline-none focus:border-brand"
          >
            <option value="">All Tasks</option>
            {uniqueTasks.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Track Filter */}
        {!isHead ? (
          <div className="flex items-center gap-2.5 w-full">
            <span className="text-xs text-neutral-455 dark:text-neutral-500 font-medium shrink-0">
              Track:
            </span>
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
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div />
        )}
      </div>

      {/* Loader, Empty and Table-to-Card Grid */}
      {loading ? (
        <SkeletonLoader variant="table" count={5} />
      ) : filteredEvaluations.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No Evaluations Found"
          description={
            trackFilter || search || evaluatorSearch
              ? "No evaluations match your filters."
              : "No task evaluations registered yet."
          }
          action={
            canMutate
              ? {
                label: "New Evaluation",
                icon: Plus,
                onClick: handleOpenCreate,
              }
              : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white dark:bg-[#111827] border border-neutral-200 dark:border-neutral-800 rounded-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#161F30] text-xs font-bold uppercase tracking-wider text-neutral-400">
                    <th className="px-6 py-4">Student Member</th>
                    <th className="px-6 py-4">Task Name</th>
                    <th className="px-6 py-4">Track</th>
                    <th className="px-6 py-4">Evaluator</th>
                    <th className="px-6 py-4">Score</th>
                    <th className="px-6 py-4">Feedback / Notes</th>
                    {canMutate && (
                      <th className="px-6 py-4 text-right">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-sm">
                  {filteredEvaluations.map((ev) => (
                    <tr
                      key={ev.id}
                      className="hover:bg-neutral-50/50 dark:hover:bg-[#182235]/40 transition-colors"
                    >
                      <td className="px-6 py-4.5 font-semibold text-neutral-900 dark:text-neutral-100">
                        {ev.technical_members?.name || "Unknown"}
                      </td>
                      <td className="px-6 py-4.5 text-neutral-500 font-medium">
                        {ev.task_name}
                      </td>
                      <td className="px-6 py-4.5">
                        <span className="font-bold px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-xs text-neutral-600 dark:text-neutral-300">
                          {(ev.technical_members as any)?.tracks?.name ||
                            "Unknown"}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 text-xs text-neutral-450 dark:text-neutral-400 font-semibold">
                        {ev.evaluator?.name || "System"}{" "}
                        <span className="font-normal capitalize text-neutral-400">
                          ({ev.evaluator?.role || "Admin"})
                        </span>
                      </td>
                      <td className="px-6 py-4.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${getScoreBadgeStyles(ev.score, ev.max_score)}`}
                        >
                          {ev.score}/{ev.max_score ?? 100}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 text-xs text-neutral-450 dark:text-neutral-400 max-w-[200px]">
                        {ev.notes ? (
                          ev.notes.length > 50 ? (
                            <div className="flex items-center gap-2">
                              <span
                                className="truncate flex-1"
                                title={ev.notes}
                              >
                                {ev.notes}
                              </span>
                              <button
                                onClick={() => setViewingNotesEval(ev)}
                                className="text-brand hover:underline font-semibold shrink-0 text-[10px] cursor-pointer"
                              >
                                Read more
                              </button>
                            </div>
                          ) : (
                            <div className="whitespace-pre-wrap break-words">
                              {ev.notes}
                            </div>
                          )
                        ) : (
                          "-"
                        )}
                      </td>
                      {canMutate && (
                        <td className="px-6 py-4.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(ev)}
                              className="p-1.5 text-neutral-400 hover:text-brand hover:bg-neutral-100 dark:hover:bg-neutral-850 rounded-btn transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(ev.id)}
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
            {filteredEvaluations.map((ev) => (
              <MobileEntityCard
                key={ev.id}
                avatarInitials={(ev.technical_members?.name || "?")
                  .charAt(0)
                  .toUpperCase()}
                title={ev.technical_members?.name || "Unknown"}
                subtitle={
                  <span className="font-semibold text-neutral-750 dark:text-neutral-350">
                    {ev.task_name}
                  </span>
                }
                badges={[
                  <span
                    key="track"
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                  >
                    {(ev.technical_members as any)?.tracks?.name || "Unknown"}
                  </span>,
                  <span
                    key="score"
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getScoreBadgeStyles(ev.score, ev.max_score)}`}
                  >
                    {ev.score}/{ev.max_score ?? 100}
                  </span>,
                ]}
                metadata={[
                  {
                    label: "Evaluator",
                    value: `${ev.evaluator?.name || "System"} (${ev.evaluator?.role || "Admin"})`,
                    icon: UserCheck,
                  },
                  {
                    label: "Feedback",
                    value: ev.notes ? (
                      ev.notes.length > 60 ? (
                        <div className="flex items-center gap-2 w-full">
                          <span className="truncate flex-1 font-semibold text-neutral-800 dark:text-neutral-200">
                            {ev.notes}
                          </span>
                          <button
                            onClick={() => setViewingNotesEval(ev)}
                            className="text-brand hover:underline font-bold shrink-0 text-[10px] cursor-pointer"
                          >
                            Read more
                          </button>
                        </div>
                      ) : (
                        <span className="whitespace-pre-wrap break-words font-semibold text-neutral-800 dark:text-neutral-200">
                          {ev.notes}
                        </span>
                      )
                    ) : (
                      "-"
                    ),
                    icon: CheckCircle,
                  },
                ]}
                actions={
                  canMutate
                    ? [
                      {
                        label: "Edit",
                        icon: Edit,
                        onClick: () => handleOpenEdit(ev),
                      },
                      {
                        label: "Delete",
                        icon: Trash2,
                        onClick: () => handleDelete(ev.id),
                        variant: "danger",
                      },
                    ]
                    : []
                }
              />
            ))}
          </div>

          {/* //////////// Pagination controls ///////////// */}
          {total > EVALUATIONS_PER_PAGE && (
            <div className="flex items-center justify-between p-4 bg-white dark:bg-[#111827] border border-neutral-200 dark:border-neutral-800 rounded-card text-xs text-neutral-455 dark:text-neutral-400">
              <p>
                Showing {(page - 1) * EVALUATIONS_PER_PAGE + 1} to{" "}
                {Math.min(page * EVALUATIONS_PER_PAGE, total)} of {total} records
              </p>

              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 disabled:opacity-50 rounded font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-750 cursor-pointer"
                >
                  Previous
                </button>

                <button
                  disabled={page * EVALUATIONS_PER_PAGE >= total}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 disabled:opacity-50 rounded font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-750 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Create / Edit Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-lg bg-white dark:bg-[#111827] border border-neutral-200 dark:border-neutral-800 rounded-card shadow-2xl p-6 overflow-hidden">
                <h3 className="text-lg font-bold">
                  {editingEval ? "Edit Evaluation" : "Log Task Evaluation"}
                </h3>
                <p className="text-xs text-neutral-400 mt-1 mb-5">
                  Grade technical members for completed curriculum tasks and project
                  submissions.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-neutral-400">
                      Select Member
                    </label>
                    {editingEval ? (
                      <input
                        type="text"
                        value={editingEval.technical_members?.name || "Unknown"}
                        className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-input py-2.5 px-3.5 text-sm text-neutral-500 cursor-not-allowed"
                        readOnly
                      />
                    ) : (
                      <select
                        value={formData.technical_member_id}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            technical_member_id: e.target.value,
                          })
                        }
                        className="w-full bg-neutral-50 dark:bg-[#161F30] border border-neutral-200 dark:border-neutral-800 rounded-input py-2.5 px-3.5 text-sm focus:outline-none focus:border-brand"
                        required
                      >
                        <option value="" disabled>
                          Choose a member...
                        </option>
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-neutral-400">
                      Task Name
                    </label>
                    <input
                      type="text"
                      value={formData.task_name}
                      onChange={(e) =>
                        setFormData({ ...formData, task_name: e.target.value })
                      }
                      placeholder="e.g. Session 1: OOP Task"
                      className="w-full bg-neutral-50 dark:bg-[#161F30] border border-neutral-200 dark:border-neutral-800 rounded-input py-2.5 px-3.5 text-sm focus:outline-none focus:border-brand"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-neutral-400">
                        Task Total Score
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.max_score}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            max_score: parseInt(e.target.value, 10) || 1,
                          })
                        }
                        placeholder="e.g. 100, 30, 50"
                        className="w-full bg-neutral-50 dark:bg-[#161F30] border border-neutral-200 dark:border-neutral-800 rounded-input py-2.5 px-3.5 text-sm focus:outline-none focus:border-brand"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-neutral-400">
                        Student Score (0 - {formData.max_score})
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={formData.max_score}
                        value={formData.score}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            score: parseInt(e.target.value, 10) || 0,
                          })
                        }
                        className={`w-full bg-neutral-50 dark:bg-[#161F30] border rounded-input py-2.5 px-3.5 text-sm focus:outline-none focus:border-brand ${formData.score > formData.max_score
                            ? "border-rose-500 focus:border-rose-500"
                            : "border-neutral-200 dark:border-neutral-800"
                          }`}
                        required
                      />
                      {formData.score > formData.max_score && (
                        <p className="text-[10px] text-rose-500 font-semibold mt-1">
                          Score cannot exceed {formData.max_score}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-neutral-400">
                      Evaluator Feedback (Optional)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      placeholder="Write comments, strengths, or items to improve..."
                      rows={4}
                      className="w-full bg-neutral-50 dark:bg-[#161F30] border border-neutral-200 dark:border-neutral-800 rounded-input py-2.5 px-3.5 text-sm focus:outline-none focus:border-brand resize-none"
                    />
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
                      {submitting
                        ? "Submitting..."
                        : editingEval
                          ? "Save Changes"
                          : "Log Evaluation"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* View Notes Dialog */}
          {viewingNotesEval && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-lg bg-white dark:bg-[#111827] border border-neutral-200 dark:border-neutral-800 rounded-card shadow-2xl p-6 overflow-hidden relative flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                {/* Close Button Top Right */}
                <button
                  onClick={() => setViewingNotesEval(null)}
                  className="absolute right-4 top-4 p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 pb-4 border-b border-neutral-150 dark:border-neutral-850">
                  <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                      Evaluation Feedback
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Detailed evaluation notes and task information
                    </p>
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto py-5 space-y-4 pr-1">
                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-4 bg-neutral-50 dark:bg-[#161F30] p-4 rounded-btn border border-neutral-200 dark:border-neutral-800 text-xs">
                    <div>
                      <span className="block text-neutral-400 font-medium mb-0.5">
                        Student Member
                      </span>
                      <span className="font-bold text-neutral-900 dark:text-neutral-100">
                        {viewingNotesEval.technical_members?.name || "Unknown"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-neutral-400 font-medium mb-0.5">
                        Track
                      </span>
                      <span className="font-bold text-neutral-900 dark:text-neutral-100">
                        {(viewingNotesEval.technical_members as any)?.tracks
                          ?.name || "Unknown"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-neutral-400 font-medium mb-0.5">
                        Task Name
                      </span>
                      <span className="font-bold text-neutral-900 dark:text-neutral-100">
                        {viewingNotesEval.task_name}
                      </span>
                    </div>
                    <div>
                      <span className="block text-neutral-400 font-medium mb-0.5">
                        Evaluation Score
                      </span>
                      <span
                        className={`inline-block font-extrabold px-2 py-0.5 rounded-full text-[10px] mt-0.5 ${getScoreBadgeStyles(viewingNotesEval.score, viewingNotesEval.max_score)}`}
                      >
                        {viewingNotesEval.score}/{viewingNotesEval.max_score ?? 100}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="block text-neutral-400 font-medium mb-0.5">
                        Evaluator
                      </span>
                      <span className="font-bold text-neutral-900 dark:text-neutral-100">
                        {viewingNotesEval.evaluator?.name || "System"}{" "}
                        <span className="font-normal text-neutral-400 capitalize">
                          ({viewingNotesEval.evaluator?.role || "Admin"})
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Feedback Block */}
                  <div className="space-y-2">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
                      Notes & Comments
                    </span>
                    <div className="bg-neutral-50 dark:bg-[#161F30] border-l-4 border-brand rounded-r-card p-4 text-sm text-neutral-800 dark:text-neutral-200 font-medium leading-relaxed whitespace-pre-wrap break-words">
                      {viewingNotesEval.notes ||
                        "No comments written for this evaluation."}
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-4 border-t border-neutral-150 dark:border-neutral-850 flex justify-end">
                  <button
                    onClick={() => setViewingNotesEval(null)}
                    className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-bold rounded-btn transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Import Results Dialog */}
          {importResults && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-lg bg-white dark:bg-[#111827] border border-neutral-200 dark:border-neutral-800 rounded-card shadow-2xl p-6 overflow-hidden relative flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                {/* Close Button */}
                <button
                  onClick={() => setImportResults(null)}
                  className="absolute right-4 top-4 p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 pb-4 border-b border-neutral-150 dark:border-neutral-850">
                  <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                      Import Results
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {importResults.message}
                    </p>
                  </div>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-3 gap-3 py-4">
                  <div className="text-center p-3 bg-neutral-50 dark:bg-[#161F30] rounded-btn border border-neutral-200 dark:border-neutral-800">
                    <p className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">
                      {importResults.totalRows}
                    </p>
                    <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                      Total Rows
                    </p>
                  </div>
                  <div className="text-center p-3 bg-emerald-500/5 rounded-btn border border-emerald-500/20">
                    <p className="text-2xl font-extrabold text-emerald-500">
                      {importResults.successCount}
                    </p>
                    <p className="text-[10px] font-semibold text-emerald-500/70 uppercase tracking-wider">
                      Imported
                    </p>
                  </div>
                  <div className="text-center p-3 bg-rose-500/5 rounded-btn border border-rose-500/20">
                    <p className="text-2xl font-extrabold text-rose-500">
                      {importResults.errorCount}
                    </p>
                    <p className="text-[10px] font-semibold text-rose-500/70 uppercase tracking-wider">
                      Failed
                    </p>
                  </div>
                </div>

                {/* Per-row Results */}
                {importResults.results.length > 0 && (
                  <div className="flex-1 overflow-y-auto max-h-[300px] border border-neutral-200 dark:border-neutral-800 rounded-btn">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-neutral-50 dark:bg-[#161F30] border-b border-neutral-200 dark:border-neutral-800">
                        <tr>
                          <th className="px-3 py-2 text-left font-bold text-neutral-400 uppercase tracking-wider">
                            Row
                          </th>
                          <th className="px-3 py-2 text-left font-bold text-neutral-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-3 py-2 text-left font-bold text-neutral-400 uppercase tracking-wider">
                            Details
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                        {importResults.results.map((r) => (
                          <tr
                            key={r.row}
                            className="hover:bg-neutral-50/50 dark:hover:bg-[#182235]/40"
                          >
                            <td className="px-3 py-2 font-semibold text-neutral-600 dark:text-neutral-300">
                              #{r.row}
                            </td>
                            <td className="px-3 py-2">
                              {r.status === "success" ? (
                                <span className="inline-flex items-center gap-1 text-emerald-500 font-bold">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Success
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-rose-500 font-bold">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  Failed
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-neutral-500 dark:text-neutral-400">
                              {r.error || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Footer */}
                <div className="pt-4 border-t border-neutral-150 dark:border-neutral-850 flex justify-end mt-4">
                  <button
                    onClick={() => setImportResults(null)}
                    className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-bold rounded-btn transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
};
      export default Evaluations;
