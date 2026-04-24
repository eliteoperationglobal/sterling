"use client";


import BrokerSidebar from "@/components/layout/BrokerSidebar";
import DashboardLayout from "@/components/layout/DashboardLayout";
export const dynamic = 'force-dynamic';
import { Clock, Bell, CheckCircle, CircleSmall, XCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useRef, Suspense } from "react";
import { signOut } from "next-auth/react";

interface Submission {
  _id: string;
  submissionNumber: number;
  industry: string;
  subtype: string;
  templateTitle: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  fileCount: number;
  state: string;
  quote1Total?: number | null;
  quote2Total?: number | null;
  estimatedPremium?: number | null;
  agentName?: string | null;
  agentId?: string | null;
  hasGeneral?: boolean;
  hasExcess?: boolean;
}

interface DashboardStats {
  totalSubmissions: number;
  activeQuotes: number;
  postedQuotes: number;
  boundPolicies: number;
  cancelledPolicies: number;
}

interface PipelineStage {
  id: string;
  label: string;
  count: number;
  color?: string;
}

function AgencyDashboardContent() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [dashboardNotifications, setDashboardNotifications] = useState<any[]>([]);
  const notificationChannel = useRef<BroadcastChannel | null>(null);
  const { data: session, status } = useSession();
  const email = session?.user?.email || "";

  const getNotificationTag = (type: string) => {
    switch (type) {
      case "NEW_SUBMISSION":
        return { label: "New", className: "inline-flex text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded whitespace-nowrap font-medium" };
      case "APPROVAL_REQUESTED":
        return { label: "Approval", className: "inline-flex text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded whitespace-nowrap font-medium" };
      case "BIND_REQUESTED":
        return { label: "Bind", className: "inline-flex text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded whitespace-nowrap font-medium" };
      case "POLICY_BOUND":
        return { label: "Bound", className: "inline-flex text-xs bg-cyan-100 text-cyan-700 px-2 py-1 rounded whitespace-nowrap font-medium" };
      case "NEW_QUOTE":
        return { label: "Quote", className: "inline-flex text-xs bg-green-100 text-green-700 px-2 py-1 rounded whitespace-nowrap font-medium" };
      case "NEW_NOTE":
        return { label: "Note", className: "inline-flex text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded whitespace-nowrap font-medium" };
      default:
        return { label: "Info", className: "inline-flex text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded whitespace-nowrap font-medium" };
    }
  };

  // ── Agency detection (same logic as quote form) ──
  const isCapco = email === "admin@agency1.com";
  const isBlueAngel = email === "admin@blueangel.com";
  const isSJJ = email === "admin@sjjinsurance.com";

  // ── Hardcoded agent lists per agency ──
  const CAPCO_AGENTS = ["Eidan Gamaty", "Moshe Gamaty", "Michael Gamaty", "Yoav Anatian", "Jake Weiner", "Benjamin Solender", "Michal Kraut", "Jonathan Akwa"];
  const BLUE_ANGEL_AGENTS = ["Max Mintz"];
  const SJJ_AGENTS = ["Sam Joffe", "Nathan Gawronsky", "Jack Douek", "Will Feldsher", "Joel Gabai", "Dean Halleluyan", "Harel Fedida"];

  const agentOptions = isCapco ? CAPCO_AGENTS : isBlueAngel ? BLUE_ANGEL_AGENTS : isSJJ ? SJJ_AGENTS : [];

  const router = useRouter();
  const searchParams = useSearchParams();
  const notifRef = useRef<HTMLDivElement>(null);

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalSubmissions: 0,
    activeQuotes: 0,
    postedQuotes: 0,
    boundPolicies: 0,
    cancelledPolicies: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState("ALL");
  const [viewMode, setViewMode] = useState<'my' | 'agency'>('my');
  const [stageCounts, setStageCounts] = useState<Record<string, number>>({});
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterProgram, setFilterProgram] = useState<string>("ALL");
  const [filterAgent, setFilterAgent] = useState<string>("ALL");
  const [showFilters, setShowFilters] = useState(false);
  const [newQuotes, setNewQuotes] = useState<any[]>([]);

  // Map ISC pipeline stages to real database statuses
  const stageToStatusMap: Record<string, string | string[]> = {
    "IN_PROGRESS": ["SUBMITTED", "APPROVAL_REQUESTED"],
    "REQUIRES_REVIEW": "ROUTED",
    "APPROVAL_REQUESTED": "ROUTED",
    "CONDITIONALLY_APPROVED": "ROUTED",
    "APPROVED_QUOTE": ["QUOTED", "BIND_REQUESTED"],
    "PENDING_BIND": "BIND_REQUESTED",
    "INCOMPLETE_BIND": "BIND_REQUESTED",
    "READY_TO_BIND": "BIND_REQUESTED",
    "BOUND": "BOUND",
    "UNDERWRITING_DECLINED": "DECLINED",
    "CANCELLED": "CANCELLED",
  };

  // Pipeline stages matching ISC (counts will be updated from real data)
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([
    { id: "ALL", label: "All Applications", count: 0 },
    { id: "IN_PROGRESS", label: "In Progress", count: 0 },
    // { id: "REQUIRES_REVIEW", label: "Requires Review", count: 0 },
    // { id: "APPROVAL_REQUESTED", label: "Approval Requested", count: 0 },
    // { id: "CONDITIONALLY_APPROVED", label: "Quote Conditionally Approved", count: 0 },
    { id: "APPROVED_QUOTE", label: "Approved Quote", count: 0, color: "teal" },
    // { id: "PENDING_BIND", label: "Pending Bind", count: 0 },
    // { id: "INCOMPLETE_BIND", label: "Incomplete Bind", count: 0 },
    // { id: "READY_TO_BIND", label: "Ready To Bind", count: 0 },
    { id: "BOUND", label: "Bound", count: 0 },
    { id: "CANCELLED", label: "Cancelled", count: 0 },
    // { id: "UNDERWRITING_DECLINED", label: "Underwriting Declined", count: 0 },
  ]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchAllSubmissions();
      fetchStats();
    }
  }, [status, filterStartDate, filterEndDate]);

  const fetchNotifications = async () => {
    try {
      setNotifLoading(true);
      const res = await fetch(`/api/notifications?t=${Date.now()}`);
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data = await res.json();

      const notifs = data.notifications || [];
      setDashboardNotifications(notifs);
      setNotifCount(notifs.length);
    } catch (err) {
      console.error("Dashboard notification fetch failed:", err);
    } finally {
      setNotifLoading(false);
    }
  };

  const handleNotificationClick = async (notif: any) => {
    let dismissed = false;

    try {
      const response = await fetch(`/api/notifications?id=${notif.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await response.json();
        dismissed = true;
        setDashboardNotifications((prev) => prev.filter((n) => n.id !== notif.id));
        setNotifCount((prev) => Math.max(0, prev - 1));
        setNotifOpen(false);

        if (notificationChannel.current) {
          notificationChannel.current.postMessage({
            type: "notification-dismissed",
            id: notif.id,
          });
        }
      } else {
        console.error("Failed to dismiss notification");
      }
    } catch (error) {
      console.error("Exception dismissing notification:", error);
    }

    if (dismissed && notif.submissionId) {
      router.push(`/agency/submissions/${notif.submissionId}`);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [status]);

  useEffect(() => {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      notificationChannel.current = new BroadcastChannel("notification-events");
      notificationChannel.current.onmessage = (event) => {
        if (event.data?.type === "notification-dismissed") {
          setDashboardNotifications((prev) => prev.filter((n) => n.id !== event.data.id));
          setNotifCount((prev) => Math.max(0, prev - 1));
        } else if (event.data?.type === "notifications-refreshed") {
          fetchNotifications();
        }
      };
    }

    return () => {
      notificationChannel.current?.close();
      notificationChannel.current = null;
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update filtered submissions when stage or search changes
  useEffect(() => {
    if (allSubmissions.length > 0) {
      filterSubmissionsByStage();
    }
  }, [selectedStage, searchQuery, allSubmissions, filterType, filterProgram, filterAgent]);

  useEffect(() => {
    if (searchParams.get("submitted") === "true") {
      fetchAllSubmissions();
      fetchStats();
      router.replace("/agency/dashboard");
    }
  }, [searchParams, router]);

  const fetchStats = async () => {
    try {
      const [submissionsRes, quotesRes, boundRes, cancelRes] = await Promise.all([
        fetch("/api/agency/submissions"),
        fetch("/api/agency/quotes?status=POSTED"),
        fetch("/api/agency/bound-policies"),
        fetch("/api/agency/cancel-requests"),
        fetch("/api/admin/cancel-requests"),

      ]);

      const submissionsData = submissionsRes.ok ? await submissionsRes.json() : { submissions: [] };
      const quotesData = quotesRes.ok ? await quotesRes.json() : { quotes: [] };
      const boundData = boundRes.ok ? await boundRes.json() : { policies: [] };
      const cancelData = cancelRes.ok ? await cancelRes.json() : { requests: [] };



      // Filter new quotes (POSTED status, created in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const newQuotesList = quotesData.quotes?.filter((q: any) => {
        const quoteDate = new Date(q.createdAt);
        return q.status === "POSTED" && quoteDate >= sevenDaysAgo;
      }) || [];
      setNewQuotes(newQuotesList);

      setStats({
        totalSubmissions: submissionsData.submissions?.length || 0,
        activeQuotes: quotesData.quotes?.length || 0,
        postedQuotes: quotesData.quotes?.length || 0,
        boundPolicies: boundData.policies?.length || 0,
        cancelledPolicies: cancelData.requests?.filter((r: any) => r.status === "APPROVED").length || 0,

      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchAllSubmissions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStartDate) params.append("startDate", filterStartDate);
      if (filterEndDate) params.append("endDate", filterEndDate);

      const response = await fetch(`/api/agency/submissions?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch submissions");

      const data = await response.json();
      const fetchedSubmissions = data.submissions || [];
      setAllSubmissions(fetchedSubmissions);

      // Calculate counts for each stage
      const counts: Record<string, number> = {
        "SUBMITTED": 0,
        "APPROVAL_REQUESTED": 0,
        "ROUTED": 0,
        "QUOTED": 0,
        "BIND_REQUESTED": 0,
        "BOUND": 0,
        "CANCELLED": 0,
      };

      fetchedSubmissions.forEach((sub: Submission) => {
        if (counts[sub.status] !== undefined) {
          counts[sub.status]++;
        }
      });

      // Update pipeline stages with real counts
      setPipelineStages([
        { id: "ALL", label: "All Applications", count: fetchedSubmissions.length },
        { id: "IN_PROGRESS", label: "In Progress", count: counts.SUBMITTED || 0 },
        // { id: "REQUIRES_REVIEW", label: "Requires Review", count: 0 },
        // { id: "APPROVAL_REQUESTED", label: "Approval Requested", count: Math.floor((counts.ROUTED || 0) / 3) },
        // { id: "CONDITIONALLY_APPROVED", label: "Quote Conditionally Approved", count: 0 },
        { id: "APPROVED_QUOTE", label: "Approved Quote", count: counts.QUOTED || 0, color: "teal" },
        // { id: "PENDING_BIND", label: "Pending Bind", count: 0 },
        // { id: "INCOMPLETE_BIND", label: "Incomplete Bind", count: 0 },
        // { id: "READY_TO_BIND", label: "Ready To Bind", count: counts.BIND_REQUESTED || 0 },
        { id: "BOUND", label: "Bound", count: counts.BOUND || 0 },
        { id: "CANCELLED", label: "Cancelled", count: counts.CANCELLED || 0 },
        // { id: "UNDERWRITING_DECLINED", label: "Underwriting Declined", count: 0 },
      ]);

      // Filter by selected stage initially
      filterSubmissionsByStageWithData(fetchedSubmissions);

    } catch (error: any) {
      console.error("Error fetching submissions:", error.message);
      setAllSubmissions([]);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const filterSubmissionsByStageWithData = (data: Submission[]) => {
    let filtered = data;

    // Filter by selected stage
    const stageStatus = stageToStatusMap[selectedStage];
    if (selectedStage !== "ALL") {
      const stageStatus = stageToStatusMap[selectedStage];

      if (stageStatus) {
        if (Array.isArray(stageStatus)) {
          filtered = filtered.filter(sub => stageStatus.includes(sub.status));
        } else {
          filtered = filtered.filter(sub => sub.status === stageStatus);
        }
      }
    }

    // Filter by type
    if (filterType !== "ALL") {
      filtered = filtered.filter(sub => sub.status === filterType);
    }

    // Filter by program (industry)
    if (filterProgram !== "ALL") {
      filtered = filtered.filter(sub => sub.industry === filterProgram);
    }

    // Filter by agent
    if (filterAgent !== "ALL") {
      filtered = filtered.filter(sub => sub.agentName === filterAgent);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(sub =>
        sub.clientName.toLowerCase().includes(query) ||
        String(sub.submissionNumber).includes(query) ||
        sub.clientEmail.toLowerCase().includes(query) ||
        sub.industry.toLowerCase().includes(query) ||
        sub.subtype.toLowerCase().includes(query)
      );
    }

    setSubmissions(filtered);
  };

  const filterSubmissionsByStage = () => {
    filterSubmissionsByStageWithData(allSubmissions);
  };


  const exportToCSV = () => {
    if (submissions.length === 0) return;
    const headers = ["Submission ID", "Industry", "Subtype", "Client Name", "Client Email", "Client Phone", "Status", "State", "Files", "Created Date", "Updated Date"];
    const rows = submissions.map((sub) => [
      sub.submissionNumber, sub.industry, sub.subtype, sub.clientName, sub.clientEmail, sub.clientPhone,
      sub.status, sub.state, sub.fileCount.toString(),
      new Date(sub.createdAt).toLocaleDateString(),
      new Date(sub.updatedAt).toLocaleDateString(),
    ]);
    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `submissions_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-[#F3F0ED] rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-[#9A8B7A] rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-gray-600 font-medium">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="min-h-screen bg-[#F3F0ED] flex">



      {/* RIGHT MAIN WRAPPER */}
      <div className="flex-1 flex flex-col">

        {/* PAGE HEADER */}
        <div className="px-4 md:px-10 pt-4 md:pt-8 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">

            <div className="flex items-center gap-4 mb-2 md:mb-6">

              {/* <h1 className="text-[34px] font-semibold text-[#2D2D2D] text-2xl font-semibold">
                Sterling Insurance Services
              </h1> */}
              <h1
                className="px-6 md:px-6 py-2.5 md:py-2.5 rounded-2xl bg-[#9A8B7A] text-white shadow-md hover:shadow-lg hover:scale-[1.04] active:scale-[0.98] transition-all duration-200 text-[34px] md:text-[34px] font-semibold inline-block cursor-pointer"
              >
                Sterling Insurance Services
              </h1>
            </div>



            {/* ===== RIGHT HEADER ACTIONS (CLEAN) ===== */}
            <div className="flex items-center gap-2 md:gap-5 relative">

              {/* ⭐ MARKETPLACE BUTTON */}
              <button
                onClick={() => router.push("/agency/marketplace")}
                className="px-4 md:px-6 py-2 md:py-2.5 rounded-xl md:rounded-2xl text-xs md:text-sm font-semibold bg-[#9A8B7A] text-white shadow-md hover:shadow-lg hover:scale-[1.04] active:scale-[0.98] transition-all duration-200"
              >
                Marketplace
              </button>

              <div ref={notifRef} className="relative">
                <button
                  type="button"
                  onClick={() => setNotifOpen((prev) => !prev)}
                  className="relative h-11 w-11 rounded-full bg-[#9A8B7A] text-white flex items-center justify-center hover:bg-[#8a6f4d] hover:shadow-md hover:-translate-y-[1px] active:scale-95 transition-all duration-200"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {dashboardNotifications && dashboardNotifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {dashboardNotifications.length > 9 ? "9+" : dashboardNotifications.length}
                    </span>
                  )}
                </button>

                <div
                  className={`absolute right-0 top-14 w-96 bg-white rounded-2xl shadow-lg border border-[#e5ddd5] z-50 transition-all duration-200 ease-out ${notifOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-2 pointer-events-none"
                    }`}
                  style={{ maxHeight: "400px", overflowY: "auto" }}
                >
                  <div className="px-5 py-4 border-b border-[#e5ddd5] bg-[#f5f1eb] sticky top-0">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm text-[#2d2a26]">Notifications</p>
                      {dashboardNotifications && dashboardNotifications.length > 0 && (
                        <span className="text-xs font-semibold text-white bg-[#9A8B7A] px-2.5 py-1 rounded-full">
                          {dashboardNotifications.length}
                        </span>
                      )}
                    </div>
                  </div>

                  {notifLoading ? (
                    <div className="px-4 py-8 text-center">
                      <p className="text-sm text-[#6b5e52]">Loading...</p>
                    </div>
                  ) : !dashboardNotifications || dashboardNotifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <p className="text-sm text-[#6b5e52]">No new notifications yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#e5ddd5]">
                      {dashboardNotifications.map((notif: any) => (
                        <button
                          key={notif.id || notif._id || notif.submissionId}
                          onClick={() => handleNotificationClick(notif)}
                          className="w-full text-left px-4 py-3 hover:bg-[#f5f1eb] transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-[#2d2a26]">{notif.title}</p>
                              <p className="text-xs text-[#6b5e52] mt-1 line-clamp-2">{notif.description}</p>
                            </div>
                            <div className="flex-shrink-0">
                              {(() => {
                                const tag = getNotificationTag(notif.type);
                                return tag ? <span className={tag.className}>{tag.label}</span> : null;
                              })()}
                            </div>
                          </div>
                          {notif.timestamp && (
                            <p className="text-xs text-[#9A8B7A] mt-2">
                              {new Date(notif.timestamp).toLocaleDateString()} {new Date(notif.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ⭐ PROFILE */}
              <div className="relative">

                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="w-10 h-10 rounded-full bg-[#9A8B7A] text-white flex items-center justify-center font-semibold text-sm shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200"
                >
                  {session?.user?.name?.[0] || "U"}
                </button>

                {/* ⭐ DROPDOWN */}
                {profileOpen && (
                  <div className="absolute right-0 mt-3 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-[fadeIn_.2s_ease]">

                    <div className="px-4 py-3 border-b bg-gray-50">
                      <p className="text-sm font-semibold text-gray-800">
                        {session?.user?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {session?.user?.email}
                      </p>
                    </div>

                    <button
                      onClick={() => signOut()}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition"
                    >
                      Logout
                    </button>

                  </div>
                )}

              </div>

            </div>

          </div>
        </div>

        {/* NOTIFICATION BAR */}
        {/* {newQuotes.length > 0 && (
          <div className="mx-10 mb-6 bg-[#9A8B7A] text-white rounded-xl shadow-sm px-6 py-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-lg">
                🔔 {newQuotes.length} New Quotes Ready!
              </p>
              <p className="text-sm text-[#F3F0ED]">
                You have {newQuotes.length} new quotes waiting for your review.
              </p>
            </div>

            <Link
              href="/agency/quotes?status=POSTED"
              className="bg-white text-[#9A8B7A] px-5 py-2 rounded-lg text-sm font-semibold"
            >
              View Quotes →
            </Link>
          </div>
        )} */}

        {/* MAIN CARD CONTAINER */}
        <div className="mx-4 md:mx-10 bg-white rounded-2xl shadow-lg flex flex-col lg:flex-row overflow-hidden h-auto lg:h-[calc(100vh-260px)]">

          {/* LEFT PIPELINE */}
          <div className="w-full lg:w-[270px] bg-[#F9F8F7] border-b lg:border-b-0 lg:border-r border-[#E5E2DF] p-4 md:p-6 flex flex-row lg:flex-col gap-2 lg:gap-0 lg:space-y-3 overflow-x-auto lg:overflow-visible shrink-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>

            {pipelineStages.map((stage) => {
              const isAll = stage.id === "ALL";
              const isActive = selectedStage === stage.id;

              const isInProgress = stage.id === "IN_PROGRESS";
              const isApproved = stage.id === "APPROVED_QUOTE";
              const isBound = stage.id === "BOUND";
              const iscansel = stage.id === "CANCELLED";

              return (
                <div key={stage.id} className="flex-shrink-0 flex items-center lg:block">
                  <button
                    onClick={() => setSelectedStage(stage.id)}
                    className={`
          w-auto lg:w-full flex justify-between items-center px-4 py-3 rounded-xl text-sm
          transition-all duration-200 whitespace-nowrap gap-4 lg:gap-0

          ${!isActive ? "hover:bg-[#F6F3F0]" : "font-semibold"}

          ${isInProgress && isActive ? "ring-2 ring-[#9A8B7A]" : ""}
          ${isApproved && isActive ? "ring-2 ring-[#9A8B7A]" : ""}
          ${isBound && isActive ? "ring-2 ring-[#9A8B7A]" : ""}
          ${iscansel && isActive ? "ring-2 ring-[#9A8B7A]" : ""}
          ${isAll && isActive ? "ring-2 ring-[#9A8B7A]" : ""}
        `}
                  >
                    {/* LEFT SIDE */}
                    <div className="flex items-center gap-2">

                      {isAll && (
                        <CircleSmall className="w-4 h-4 text-[#9A8B7A]" />
                      )}

                      {isInProgress && (
                        <Clock className="w-4 h-4 text-[#9A8B7A]" />
                      )}

                      {isApproved && (
                        <Bell className="w-4 h-4 text-[#9A8B7A]" />
                      )}

                      {isBound && (
                        <CheckCircle className="w-4 h-4 text-[#9A8B7A]" />
                      )}

                      {iscansel && (
                        <XCircle className="w-4 h-4 text-[#9A8B7A]" />
                      )}

                      <span
                        className={`
              ${isAll ? "text-[#9A8B7A]" : ""}
              ${isInProgress ? "text-[#9A8B7A]" : ""}
              ${isApproved ? "text-[#9A8B7A]" : ""}
              ${isBound ? "text-[#9A8B7A]" : ""}
              ${iscansel ? "text-[#9A8B7A]" : ""}
            `}
                      >
                        {stage.label}
                      </span>
                    </div>

                    {/* COUNT BADGE */}
                    <span
                      className={`
            text-xs px-2 py-1 rounded-md font-medium

            ${isAll ? "bg-[#EFEAE5] text-[#9A8B7A]" : ""}
            ${isInProgress ? "bg-[#EFEAE5] text-[#9A8B7A]" : ""}
            ${isApproved ? "bg-[#EFEAE5] text-[#9A8B7A]" : ""}
            ${isBound ? "bg-[#EFEAE5] text-[#9A8B7A]" : ""}
            ${iscansel ? "bg-[#EFEAE5] text-[#9A8B7A]" : ""}
          `}
                    >
                      {stage.count}
                    </span>
                  </button>

                  {isAll && (
                    <>
                      <div className="hidden lg:block my-4 border-t border-[#E5E2DF]" />
                      <div className="block lg:hidden mx-2 h-8 border-l border-[#E5E2DF]" />
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* RIGHT TABLE SECTION */}
          <div className="flex-1 flex flex-col min-h-0">

            {/* FILTER BAR */}
            <div className="p-4 md:p-6 border-b border-[#ECEAE7] flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4 shrink-0">

              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 w-full md:w-[300px] border border-[#E0DDD9] rounded-xl text-sm bg-[#F9F8F7]"
              />

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-[#E0DDD9] rounded-xl text-sm bg-[#F9F8F7] w-full md:w-auto"
              >
                <option value="ALL">All Types</option>
                <option value="SUBMITTED">New Business</option>
                <option value="ROUTED">Renewal</option>
              </select>

              <select
                value={filterProgram}
                onChange={(e) => setFilterProgram(e.target.value)}
                className="px-4 py-2 border border-[#E0DDD9] rounded-xl text-sm bg-[#F9F8F7] w-full md:w-auto"
              >
                <option value="ALL">All Programs</option>
                {Array.from(new Set(allSubmissions.map(s => s.industry))).map(ind => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>

              <select
                value={filterAgent}
                onChange={(e) => setFilterAgent(e.target.value)}
                className="px-4 py-2 border border-[#E0DDD9] rounded-xl text-sm bg-[#F9F8F7] w-full md:w-auto"
              >
                <option value="ALL">All Agents</option>
                {agentOptions.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>

              <div className="mt-2 md:mt-0 md:ml-auto text-sm text-gray-600 font-medium">
                {submissions.length} of {allSubmissions.length}
              </div>
            </div>

            {/* TABLE */}
            <div className="flex-1 overflow-auto border-t border-b border-[#ECEAE7] rounded-b-2xl">

              <table className="w-full text-sm min-w-[800px]">
                <thead className="bg-[#F9F8F7] text-[#6B6B6B] uppercase text-xs sticky top-0 z-10">
                  <tr>
                    <th className="px-4 lg:px-6 py-4 text-left">Type</th>
                    <th className="px-4 lg:px-6 py-4 text-left">App ID</th>
                    <th className="px-4 lg:px-6 py-4 text-left">Applicant Company</th>
                    <th className="px-4 lg:px-6 py-4 text-left">Program</th>
                    <th className="px-4 lg:px-6 py-4 text-left whitespace-nowrap">Effective Date</th>
                    {/* <th className="px-6 py-4 text-center">Richmond</th>
                    <th className="px-6 py-4 text-center">Kinsale</th> */}
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#ECEAE7]">
                  {submissions.map((sub) => (
                    <tr
                      key={sub._id}
                      className="hover:bg-[#F9F8F7] transition cursor-pointer"
                      onClick={() => {
                        router.push(`/agency/submissions/${sub._id}`);
                      }}
                    >
                      <td className="px-6 py-4">
                        {sub.status === "SUBMITTED" ? (
                          "New business"
                        ) : (
                          <>
                            {sub.industry === "Construction Equipment" ? "Inland Marine" :
                              sub.industry === "Apartment Building" || sub.industry === "Commercial Property" ? "Property" : (
                                sub.hasGeneral && sub.hasExcess ? "General & Excess Liability" :
                                  sub.hasExcess ? "Excess Liability" : "General Liability"
                              )}
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4 text-[#9A8B7A] font-medium">
                        {sub.submissionNumber}
                      </td>
                      <td className="px-6 py-4">{sub.clientName}</td>
                      <td className="px-6 py-4">{sub.industry}</td>
                      <td className="px-6 py-4">
                        {new Date(sub.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                      </td>

                      {/* <td className="px-6 py-4 text-center">
                        {sub.quote1Total != null ? (
                          <span className="inline-flex items-center gap-1 text-emerald-500 font-semibold">
                            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            ${sub.quote1Total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs font-medium">—</span>
                        )}
                      </td> */}

                      {/* <td className="px-6 py-4 text-center">
                        {sub.quote2Total != null ? (
                          <span className="inline-flex items-center gap-1 text-orange-500 font-semibold">
                            <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            ${sub.quote2Total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs font-medium">—</span>
                        )}
                      </td> */}
                    </tr>
                  ))}
                </tbody>
              </table>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AgencyDashboard() {

  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }>
        <AgencyDashboardContent />
      </Suspense>
    </DashboardLayout>
  );
}