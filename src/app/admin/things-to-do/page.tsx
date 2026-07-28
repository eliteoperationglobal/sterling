"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CheckSquare,
  AlertTriangle,
  Clock,
  Search,
  CheckCircle2,
  ArrowRight,
  FileText,
  ClipboardList,
  Layers,
  Filter,
  Menu,
  Sparkles,
  UserCheck,
  Building,
  ArrowLeft
} from "lucide-react";
import MobileNav from "@/components/layout/MobileNav";

interface TaskItem {
  id: string;
  type: "QUOTE_REQUEST" | "PENDING_SUBJECTIVE" | "BIND_REQUEST";
  title: string;
  subtitle: string;
  category: string;
  clientName: string;
  agencyName: string;
  agentName?: string;
  submissionId: string;
  submissionNumber?: number;
  quoteId?: string;
  subjectiveDocName?: string;
  requestedAt: string;
  daysOverdue: number;
  isUrgent: boolean;
  status: string;
  targetUrl: string;
}

let cachedTasks: TaskItem[] | null = null;
let cachedCounts = {
  total: 0,
  urgent: 0,
  quoteRequests: 0,
  pendingSubjectives: 0,
  bindRequests: 0,
};

export default function ThingsToDoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isMaintenanceMode = false; // Set to false to remove maintenance mode later

  const [tasks, setTasks] = useState<TaskItem[]>(() => cachedTasks || []);
  const [counts, setCounts] = useState(() => cachedCounts);
  const [loading, setLoading] = useState<boolean>(() => !cachedTasks || cachedTasks.length === 0);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "QUOTE_REQUEST" | "PENDING_SUBJECTIVE" | "BIND_REQUEST" | "URGENT">("ALL");
  const [sortBy, setSortBy] = useState<"MOST_OVERDUE" | "NEWEST" | "OLDEST">("MOST_OVERDUE");
  const [policyStatusFilter, setPolicyStatusFilter] = useState<string>("ALL");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [updatingSubjectiveId, setUpdatingSubjectiveId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("sterling_admin_back_url", "/admin/things-to-do");
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    } else if (status === "authenticated") {
      const userRole = (session?.user as any)?.role;
      if (userRole !== "system_admin") {
        router.push("/agency/dashboard");
      } else {
        fetchTasks();
      }
    }
  }, [status, router]);

  const fetchTasks = async () => {
    if (!cachedTasks || cachedTasks.length === 0) {
      setLoading(true);
    }
    try {
      const res = await fetch("/api/admin/things-to-do");
      const data = await res.json();
      if (data.success) {
        cachedTasks = data.tasks || [];
        cachedCounts = data.counts || { total: 0, urgent: 0, quoteRequests: 0, pendingSubjectives: 0, bindRequests: 0 };
        setTasks(cachedTasks);
        setCounts(cachedCounts);
      }
    } catch (error) {
      console.error("Failed to fetch things to do:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkSubjectiveReceived = async (task: TaskItem) => {
    if (!task.quoteId || !task.subjectiveDocName) return;
    setUpdatingSubjectiveId(task.id);

    try {
      const res = await fetch(`/api/admin/quotes/${task.quoteId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc: task.subjectiveDocName, value: true }),
      });

      if (res.ok) {
        // Remove completed subjective item from state or refresh
        setTasks((prev) => prev.filter((t) => t.id !== task.id));
        setCounts((prev) => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
          pendingSubjectives: Math.max(0, prev.pendingSubjectives - 1),
          urgent: task.isUrgent ? Math.max(0, prev.urgent - 1) : prev.urgent,
        }));
      } else {
        alert("Failed to update subjective line status");
      }
    } catch (err) {
      console.error("Error toggling subjective doc:", err);
      alert("Error updating subjective document");
    } finally {
      setUpdatingSubjectiveId(null);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    // Search filter
    const matchesSearch =
      t.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.agencyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.agentName && t.agentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.submissionNumber && t.submissionNumber.toString().includes(searchQuery));

    if (!matchesSearch) return false;

    // Tab filter
    if (activeTab !== "ALL") {
      if (activeTab === "URGENT" && !t.isUrgent && t.daysOverdue <= 0) return false;
      if (activeTab !== "URGENT" && t.type !== activeTab) return false;
    }

    // Policy Status filter
    if (policyStatusFilter !== "ALL" && t.status !== policyStatusFilter) return false;

    return true;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === "MOST_OVERDUE") return b.daysOverdue - a.daysOverdue;
    if (sortBy === "NEWEST") return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime();
    if (sortBy === "OLDEST") return new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime();
    return 0;
  });

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f1eb]">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-[#9A8B7A] rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-[#6b5e52] font-medium">Loading Things To Do...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f1eb]">
      <MobileNav isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* Navigation Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-[#e5ddd5] sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4 md:gap-8">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-6 h-6 text-[#9A8B7A]" />
              </button>

              <div className="flex items-center gap-2 mb-1">
                <Link href="/admin/dashboard">
                  <h1 className="px-4 py-1.5 rounded-2xl bg-[#9A8B7A] text-white shadow-md hover:shadow-lg hover:scale-[1.04] active:scale-[0.98] transition-all duration-200 text-[18px] font-semibold inline-block cursor-pointer">
                    Sterling Insurance Services
                  </h1>
                </Link>
              </div>

              <nav className="hidden lg:flex items-center gap-1">
                <Link href="/admin/dashboard" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition">
                  Dashboard
                </Link>
                <Link href="/admin/things-to-do" className="relative px-4 py-2 text-sm font-semibold text-[#9A8B7A]">
                  Things To Do
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#9A8B7A] rounded-full"></div>
                  {counts.urgent > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full shadow-lg animate-pulse">
                      {counts.urgent}
                    </span>
                  )}
                </Link>
                <Link href="/admin/quotes" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition">
                  Quotes
                </Link>
                <Link href="/admin/quote-requests" className="relative px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition">
                  Quote Requests
                  {counts.quoteRequests > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-[#9A8B7A] rounded-full shadow-lg">
                      {counts.quoteRequests}
                    </span>
                  )}
                </Link>
                <Link href="/admin/bind-requests" className="relative px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition">
                  Bind Requests
                </Link>
                <Link href="/admin/bound-policies" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition">
                  Policies
                </Link>
                <Link href="/admin/tool-requests" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition">
                  Tool Requests
                </Link>
                <Link href="/admin/cancel-requests" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition">
                  Cancel Requests
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isMaintenanceMode ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mb-6 shadow-sm mx-auto">
              <svg className="w-12 h-12 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Under Maintenance</h2>
            <p className="text-lg text-gray-600 max-w-md mx-auto mb-8">
              The Things To Do dashboard is currently undergoing scheduled maintenance. Please check back later.
            </p>
            <Link href="/admin/dashboard" className="px-6 py-3 bg-[#9A8B7A] text-white font-bold rounded-xl hover:bg-[#8a6f4d] transition-all shadow-md inline-flex items-center gap-2">
              <ArrowLeft className="w-5 h-5" />
              Return to Dashboard
            </Link>
          </div>
        ) : (
          <>
            {/* Page Title Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#9A8B7A]/10 rounded-2xl border border-[#9A8B7A]/20">
                    <CheckSquare className="w-7 h-7 text-[#9A8B7A]" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Things To Do</h1>
                    <p className="text-sm text-gray-500 font-medium mt-0.5">
                      Organized tasks for quote requests, agent subjectives, and account action items.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchTasks}
                  className="px-4 py-2 text-xs font-semibold text-[#9A8B7A] bg-white border border-[#e5ddd5] hover:bg-[#f5f1eb] rounded-xl shadow-sm transition"
                >
                  Refresh Tasks
                </button>
              </div>
            </div>

            {/* Overview Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              {/* Total Tasks */}
              <div
                onClick={() => setActiveTab("ALL")}
                className={`cursor-pointer bg-white p-5 rounded-2xl border transition-all duration-200 shadow-sm ${activeTab === "ALL" ? "border-[#9A8B7A] ring-2 ring-[#9A8B7A]/20" : "border-[#e5ddd5] hover:border-gray-300"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Tasks</span>
                  <Layers className="w-5 h-5 text-gray-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-2">{counts.total}</div>
                <span className="text-xs text-gray-400 font-medium">Pending action</span>
              </div>

              {/* Urgent / Overdue Tasks (RED) */}
              <div
                onClick={() => setActiveTab("URGENT")}
                className={`cursor-pointer p-5 rounded-2xl border transition-all duration-200 shadow-sm ${counts.urgent > 0 ? "bg-red-50/70 border-red-200 hover:border-red-300" : "bg-white border-[#e5ddd5]"
                  } ${activeTab === "URGENT" ? "ring-2 ring-red-500/40" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold uppercase tracking-wider ${counts.urgent > 0 ? "text-red-700" : "text-gray-500"}`}>
                    Urgent / Overdue
                  </span>
                  <AlertTriangle className={`w-5 h-5 ${counts.urgent > 0 ? "text-red-600 animate-pulse" : "text-gray-400"}`} />
                </div>
                <div className={`text-2xl font-bold mt-2 ${counts.urgent > 0 ? "text-red-700" : "text-gray-900"}`}>
                  {counts.urgent}
                </div>
                <span className={`text-xs font-medium ${counts.urgent > 0 ? "text-red-600" : "text-gray-400"}`}>
                  {counts.urgent > 0 ? "Overdue items" : "All up to date"}
                </span>
              </div>

              {/* Quote Requests Needed */}
              <div
                onClick={() => setActiveTab("QUOTE_REQUEST")}
                className={`cursor-pointer bg-white p-5 rounded-2xl border transition-all duration-200 shadow-sm ${activeTab === "QUOTE_REQUEST" ? "border-[#9A8B7A] ring-2 ring-[#9A8B7A]/20" : "border-[#e5ddd5] hover:border-gray-300"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">Quote Needed</span>
                  <FileText className="w-5 h-5 text-sky-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-2">{counts.quoteRequests}</div>
                <span className="text-xs text-gray-400 font-medium">Submissions to quote</span>
              </div>

              {/* Pending Subjectives */}
              <div
                onClick={() => setActiveTab("PENDING_SUBJECTIVE")}
                className={`cursor-pointer bg-white p-5 rounded-2xl border transition-all duration-200 shadow-sm ${activeTab === "PENDING_SUBJECTIVE" ? "border-[#9A8B7A] ring-2 ring-[#9A8B7A]/20" : "border-[#e5ddd5] hover:border-gray-300"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Subjectives</span>
                  <ClipboardList className="w-5 h-5 text-purple-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-2">{counts.pendingSubjectives}</div>
                <span className="text-xs text-gray-400 font-medium">Agent response needed</span>
              </div>

              {/* Bind Requests */}
              <div
                onClick={() => setActiveTab("BIND_REQUEST")}
                className={`cursor-pointer bg-white p-5 rounded-2xl border transition-all duration-200 shadow-sm ${activeTab === "BIND_REQUEST" ? "border-[#9A8B7A] ring-2 ring-[#9A8B7A]/20" : "border-[#e5ddd5] hover:border-gray-300"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-orange-700 uppercase tracking-wider">Bind Requests</span>
                  <CheckCircle2 className="w-5 h-5 text-orange-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-2">{counts.bindRequests}</div>
                <span className="text-xs text-gray-400 font-medium">Ready to bind policy</span>
              </div>
            </div>

            {/* Filter Bar & Search */}
            <div className="bg-white p-4 rounded-2xl border border-[#e5ddd5] shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">

              {/* Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                <button
                  onClick={() => setActiveTab("ALL")}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${activeTab === "ALL"
                    ? "bg-[#9A8B7A] text-white shadow"
                    : "text-gray-600 hover:bg-[#f5f1eb] hover:text-gray-900"
                    }`}
                >
                  All ({counts.total})
                </button>
                <button
                  onClick={() => setActiveTab("URGENT")}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${activeTab === "URGENT"
                    ? "bg-red-600 text-white shadow"
                    : "text-red-700 hover:bg-red-50"
                    }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Urgent ({counts.urgent})
                </button>
                <button
                  onClick={() => setActiveTab("QUOTE_REQUEST")}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${activeTab === "QUOTE_REQUEST"
                    ? "bg-sky-600 text-white shadow"
                    : "text-gray-600 hover:bg-sky-50 hover:text-sky-700"
                    }`}
                >
                  Quotes Needed ({counts.quoteRequests})
                </button>
                <button
                  onClick={() => setActiveTab("PENDING_SUBJECTIVE")}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${activeTab === "PENDING_SUBJECTIVE"
                    ? "bg-purple-600 text-white shadow"
                    : "text-gray-600 hover:bg-purple-50 hover:text-purple-700"
                    }`}
                >
                  Pending Subjectives ({counts.pendingSubjectives})
                </button>
                <button
                  onClick={() => setActiveTab("BIND_REQUEST")}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${activeTab === "BIND_REQUEST"
                    ? "bg-orange-600 text-white shadow"
                    : "text-gray-600 hover:bg-orange-50 hover:text-orange-700"
                    }`}
                >
                  Bind Requests ({counts.bindRequests})
                </button>
              </div>

              {/* Search & Sort */}
              <div className="flex items-center gap-3 min-w-0 flex-1 md:flex-initial">
                <div className="relative flex-1 md:w-64">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search account, agency, or agent..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-[#f5f1eb] text-xs font-medium text-gray-900 border border-[#e5ddd5] rounded-xl outline-none focus:ring-2 focus:ring-[#9A8B7A]/30 focus:border-[#9A8B7A] transition"
                  />
                </div>

                <select
                  value={policyStatusFilter}
                  onChange={(e: any) => setPolicyStatusFilter(e.target.value)}
                  className="py-2 px-3 bg-[#f5f1eb] text-xs font-medium text-gray-700 border border-[#e5ddd5] rounded-xl outline-none focus:ring-2 focus:ring-[#9A8B7A]/30 transition"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="QUOTED">Quoted</option>
                  <option value="BIND_REQUESTED">Bind Requested</option>
                  <option value="BOUND">Bound</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="py-2 px-3 bg-[#f5f1eb] text-xs font-medium text-gray-700 border border-[#e5ddd5] rounded-xl outline-none focus:ring-2 focus:ring-[#9A8B7A]/30 transition"
                >
                  <option value="MOST_OVERDUE">Most Overdue</option>
                  <option value="NEWEST">Newest First</option>
                  <option value="OLDEST">Oldest First</option>
                </select>
              </div>

            </div>

            {/* Task Cards List */}
            {sortedTasks.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#e5ddd5] p-12 text-center">
                <div className="w-16 h-16 bg-[#f5f1eb] rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-[#9A8B7A]" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">All Tasks Up To Date!</h3>
                <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto font-medium">
                  There are no pending tasks matching your selected filters. Great job!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedTasks.map((task) => {
                  const isOverdue = task.daysOverdue > 0 || task.isUrgent;

                  return (
                    <div
                      key={task.id}
                      className={`bg-white rounded-2xl border transition-all duration-200 p-5 shadow-sm hover:shadow-md ${isOverdue
                        ? "border-l-4 border-l-red-500 border-red-200 bg-red-50/20"
                        : "border-[#e5ddd5] border-l-4 border-l-[#9A8B7A]"
                        }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

                        {/* Left Details */}
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Category Badge */}
                            <span
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${task.type === "QUOTE_REQUEST"
                                ? "bg-sky-100 text-sky-700 border border-sky-200"
                                : task.type === "PENDING_SUBJECTIVE"
                                  ? "bg-purple-100 text-purple-700 border border-purple-200"
                                  : "bg-orange-100 text-orange-700 border border-orange-200"
                                }`}
                            >
                              {task.category}
                            </span>

                            {/* Days Overdue Badge (Red if overdue) */}
                            {task.daysOverdue > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 bg-red-600 text-white rounded-md shadow-sm animate-pulse">
                                <Clock className="w-3 h-3" />
                                {task.daysOverdue} {task.daysOverdue === 1 ? "day" : "days"} overdue
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md">
                                <Clock className="w-3 h-3 text-amber-600" />
                                Due Today
                              </span>
                            )}

                            {/* Urgent Alert Tag */}
                            {isOverdue && (
                              <span className="text-[10px] font-black px-2 py-0.5 bg-red-100 text-red-700 border border-red-300 rounded uppercase tracking-wider">
                                URGENT
                              </span>
                            )}
                          </div>

                          {/* Main Title & Subtitle */}
                          <h2 className="text-base font-bold text-gray-900 tracking-tight">
                            {task.title}
                          </h2>
                          <p className="text-xs text-gray-500 font-medium">
                            {task.subtitle}
                          </p>

                          {/* Client, Agency & Agent info */}
                          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 pt-1">
                            <div className="flex items-center gap-1.5 font-medium">
                              <Building className="w-3.5 h-3.5 text-[#9A8B7A]" />
                              <span>Agency: <strong className="text-gray-800">{task.agencyName}</strong></span>
                            </div>
                            {task.agentName && (
                              <div className="flex items-center gap-1.5 font-medium">
                                <UserCheck className="w-3.5 h-3.5 text-[#9A8B7A]" />
                                <span>Agent: <strong className="text-gray-800">{task.agentName}</strong></span>
                              </div>
                            )}
                            <div className="text-gray-400">
                              Requested: {new Date(task.requestedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </div>
                          </div>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                          {/* Mark Subjective Completed Inline Button */}
                          {task.type === "PENDING_SUBJECTIVE" && (
                            <button
                              onClick={() => handleMarkSubjectiveReceived(task)}
                              disabled={updatingSubjectiveId === task.id}
                              className="px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              {updatingSubjectiveId === task.id ? "Updating..." : "Mark Received"}
                            </button>
                          )}

                          {/* Primary Navigation Action Button */}
                          <Link
                            href={task.targetUrl}
                            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-2 ${task.type === "QUOTE_REQUEST"
                              ? "bg-[#9A8B7A] text-white hover:bg-[#8a6f4d]"
                              : task.type === "PENDING_SUBJECTIVE"
                                ? "bg-purple-600 text-white hover:bg-purple-700"
                                : "bg-orange-600 text-white hover:bg-orange-700"
                              }`}
                          >
                            <span>
                              {task.type === "QUOTE_REQUEST"
                                ? "Enter Quote"
                                : task.type === "PENDING_SUBJECTIVE"
                                  ? "View Account"
                                  : "Process Bind"}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}