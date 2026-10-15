"use client";


import BrokerSidebar from "@/components/layout/BrokerSidebar";
import DashboardLayout from "@/components/layout/DashboardLayout";
export const dynamic = 'force-dynamic';
import { Clock, Bell, CheckCircle, CircleSmall, XCircle, AlertCircle, ClipboardCheck, Search } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useRef, Suspense, useMemo } from "react";
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
  hasProfessional?: boolean;
  hasPollution?: boolean;
  effectiveDate?: string | null;
  effectiveCancellationDate?: string | null;
  cancelRequested?: boolean;
  policyNumber?: string | null;
  programId?: string | null;
  programName?: string | null;
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

let cachedAgencySubmissions: Submission[] | null = null;
let cachedAgencyStats: DashboardStats | null = null;
let cachedNewQuotes: any[] = [];
let cachedManualAudits: any[] | null = null;
let cachedSelectedStage: string = "ALL";
let cachedPipelineStages: PipelineStage[] | null = null;

function AgencyDashboardContent() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [dashboardNotifications, setDashboardNotifications] = useState<any[]>([]);
  const notificationChannel = useRef<BroadcastChannel | null>(null);
  const { data: session, status } = useSession();
  const userName = session?.user?.name || "Agent";
  const email = session?.user?.email || "";
  const agencyName = (session?.user as any)?.agencyName || "";

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

  // ── Agency detection (same logic as quote form & marketplace) ──
  const isCapco = agencyName.includes("Capital & Co") || agencyName.includes("Capco") || email.includes("capcoinsurance") || email === "admin@agency1.com" || userName.includes("Gamaty");
  const isBlueAngel = agencyName.includes("Blue Angel") || email === "admin@blueangel.com";
  const isSJJ = agencyName.includes("SJJ") || email === "admin@sjjinsurance.com";
  const isPatrickArias = agencyName.includes("Patrick Arias") || email.includes("patrickariasinsurance");
  const isTitan = agencyName.toLowerCase().includes("titan") || email.includes("solutions@titaninssolutions.com");
  const isTexas = agencyName.toLowerCase().includes("texas") || email.toLowerCase().includes("texascomm@services.com");

  // ── Hardcoded agent lists per agency ──
  const CAPCO_AGENTS = ["Eidan Gamaty", "Moshe Gamaty", "Michael Gamaty", "Yoav Anatian", "Jake Weiner", "Benjamin Solender", "Michal Kraut", "Jonathan Akwa","Juan Montoya"];
  const BLUE_ANGEL_AGENTS = ["Max Mintz"];
  const SJJ_AGENTS = ["Sam Joffe", "Nathan Gawronsky", "Jack Douek", "Will Feldsher", "Joel Gabai", "Dean Halleluyan", "Harel Fedida"];
  const PATRICK_ARIAS_AGENTS = ["Patrick Arias"];
  const TITAN_AGENTS = ["Judah Cohen"];
  const TEXAS_AGENTS = ["Eidan Gamaty", "Moshe Gamaty", "Michael Gamaty", "Yoav Anatian", "Jake Weiner", "Benjamin Solender", "Michal Kraut", "Jonathan Akwa","Juan Montoya"];

  const baseAgencyAgents = isCapco
    ? CAPCO_AGENTS
    : isBlueAngel
    ? BLUE_ANGEL_AGENTS
    : isSJJ
    ? SJJ_AGENTS
    : isPatrickArias
    ? PATRICK_ARIAS_AGENTS
    : isTitan
    ? TITAN_AGENTS
    : isTexas
    ? TEXAS_AGENTS
    : [];

  const router = useRouter();
  const searchParams = useSearchParams();
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>(() => cachedAgencySubmissions || []);
  const [notifLoading, setNotifLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats>(() => cachedAgencyStats || {
    totalSubmissions: 0,
    activeQuotes: 0,
    postedQuotes: 0,
    boundPolicies: 0,
    cancelledPolicies: 0,
  });
  const [loading, setLoading] = useState<boolean>(() => !cachedAgencySubmissions || cachedAgencySubmissions.length === 0);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("agency_selected_stage");
      if (saved && ["ALL", "IN_PROGRESS", "APPROVED_QUOTE", "BOUND", "PENDING_CANCEL", "CANCELLED", "MANUAL_AUDIT"].includes(saved)) {
        return saved;
      }
    }
    return searchParams.get("stage") || cachedSelectedStage || "ALL";
  });
  const [viewMode, setViewMode] = useState<'my' | 'agency'>('my');
  const [stageCounts, setStageCounts] = useState<Record<string, number>>({});
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterProgram, setFilterProgram] = useState<string>("ALL");
  const [filterAgent, setFilterAgent] = useState<string>("ALL");
  const [showFilters, setShowFilters] = useState(false);
  const [newQuotes, setNewQuotes] = useState<any[]>(() => cachedNewQuotes);
  const [apiAgents, setApiAgents] = useState<string[]>([]);

  // Manual Audits States
  const [manualAudits, setManualAudits] = useState<any[]>(() => cachedManualAudits || []);
  const [auditSearchQuery, setAuditSearchQuery] = useState("");
  const [auditStatusFilter, setAuditStatusFilter] = useState("ALL");
  const [auditProgramFilter, setAuditProgramFilter] = useState("ALL");

  const agentOptions = useMemo(() => {
    const agentsSet = new Set<string>();

    const isAgencyEntityName = (name: string) => {
      const lower = name.toLowerCase().trim();
      if (!lower) return true;
      if (agencyName && (lower === agencyName.toLowerCase().trim() || agencyName.toLowerCase().includes(lower))) return true;
      if (
        lower.includes("insurance services") ||
        lower.includes("insurance agency") ||
        lower.includes("capital & co") ||
        lower === "capco" ||
        lower === "blue angel" ||
        lower === "sjj insurance" ||
        lower === "titan insurance"
      ) {
        return true;
      }
      return false;
    };

    const addAgent = (name: string | null | undefined) => {
      if (!name) return;
      const clean = name.trim();
      if (!clean || isAgencyEntityName(clean)) return;
      agentsSet.add(clean);
    };

    baseAgencyAgents.forEach(addAgent);
    apiAgents.forEach(addAgent);
    allSubmissions.forEach((sub) => addAgent(sub.agentName));

    return Array.from(agentsSet).sort((a, b) => a.localeCompare(b));
  }, [baseAgencyAgents, apiAgents, allSubmissions, agencyName]);

  // Map ISC pipeline stages to real database statuses
  const stageToStatusMap: Record<string, string | string[]> = {
    "IN_PROGRESS": ["SUBMITTED", "APPROVAL_REQUESTED", "ROUTED"],
    "REQUIRES_REVIEW": "ROUTED",
    "APPROVAL_REQUESTED": "ROUTED",
    "CONDITIONALLY_APPROVED": "ROUTED",
    "APPROVED_QUOTE": ["QUOTED", "BIND_REQUESTED"],
    "PENDING_BIND": "BIND_REQUESTED",
    "INCOMPLETE_BIND": "BIND_REQUESTED",
    "READY_TO_BIND": "BIND_REQUESTED",
    "BOUND": "BOUND",
    "UNDERWRITING_DECLINED": "DECLINED",
    "CANCELLED": ["CANCELLED", "DECLINED"],
    "PENDING_CANCEL": "PENDING_CANCEL",
  };

  // Pipeline stages matching ISC (counts will be updated from real data)
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>(() => cachedPipelineStages || [
    { id: "ALL", label: "All Applications", count: 0 },
    { id: "IN_PROGRESS", label: "In Progress", count: 0 },
    { id: "APPROVED_QUOTE", label: "Approved Quote", count: 0, color: "teal" },
    { id: "BOUND", label: "Bound", count: 0 },
    { id: "PENDING_CANCEL", label: "Pending Cancel", count: 0 },
    { id: "CANCELLED", label: "Cancelled", count: 0 },
    { id: "MANUAL_AUDIT", label: "Manual Audit", count: 0 },
  ]);

  useEffect(() => {
    const stageParam = searchParams.get("stage");
    if (stageParam && ["ALL", "IN_PROGRESS", "APPROVED_QUOTE", "BOUND", "PENDING_CANCEL", "CANCELLED", "MANUAL_AUDIT"].includes(stageParam)) {
      setSelectedStage(stageParam);
      cachedSelectedStage = stageParam;
      if (typeof window !== "undefined") {
        sessionStorage.setItem("agency_selected_stage", stageParam);
        // Clean up URL so ?stage= is removed from the address bar
        window.history.replaceState(null, "", window.location.pathname);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  const fetchAgencyAgents = async () => {
    try {
      const res = await fetch(`/api/agents?t=${Date.now()}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data?.agents && Array.isArray(data.agents)) {
        const names = data.agents
          .map((a: any) => (typeof a === "string" ? a.trim() : a.name?.trim()))
          .filter(Boolean);
        setApiAgents(names);
      }
    } catch (err) {
      console.error("Failed to load agency agents:", err);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchAgencyData();
      fetchAgencyAgents();
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
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
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
      cachedAgencySubmissions = null;
      cachedAgencyStats = null;
      fetchAgencyData(true);
      router.replace("/agency/dashboard");
    }
  }, [searchParams, router]);

  const fetchAgencyData = async (forceShowLoading = false) => {
    if (forceShowLoading || !cachedAgencySubmissions || cachedAgencySubmissions.length === 0) {
      setLoading(true);
    }
    try {
      const params = new URLSearchParams();
      if (filterStartDate) params.append("startDate", filterStartDate);
      if (filterEndDate) params.append("endDate", filterEndDate);
      params.append("t", Date.now().toString());

      const [submissionsRes, quotesRes, boundRes, cancelRes, auditsRes] = await Promise.all([
        fetch(`/api/agency/submissions?${params.toString()}`),
        fetch("/api/agency/quotes?status=POSTED"),
        fetch("/api/agency/bound-policies"),
        fetch("/api/agency/cancel-request"),
        fetch(`/api/admin/audits?source=MANUAL_AUDIT&t=${Date.now()}`),
      ]);

      const submissionsData = submissionsRes.ok ? await submissionsRes.json() : { submissions: [] };
      const quotesData = quotesRes.ok ? await quotesRes.json() : { quotes: [] };
      const boundData = boundRes.ok ? await boundRes.json() : { policies: [] };
      const cancelData = cancelRes.ok ? await cancelRes.json() : { requests: [] };
      const auditsData = auditsRes.ok ? await auditsRes.json() : { audits: [] };

      const fetchedSubmissions = submissionsData.submissions || [];
      const fetchedManualAudits = auditsData.audits || [];
      cachedAgencySubmissions = fetchedSubmissions;
      cachedManualAudits = fetchedManualAudits;
      setAllSubmissions(fetchedSubmissions);
      setManualAudits(fetchedManualAudits);

      // Filter new quotes (POSTED status, created in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const newQuotesList = quotesData.quotes?.filter((q: any) => {
        const quoteDate = new Date(q.createdAt);
        return q.status === "POSTED" && quoteDate >= sevenDaysAgo;
      }) || [];
      cachedNewQuotes = newQuotesList;
      setNewQuotes(newQuotesList);

      const computedStats: DashboardStats = {
        totalSubmissions: fetchedSubmissions.length,
        activeQuotes: quotesData.quotes?.length || 0,
        postedQuotes: quotesData.quotes?.length || 0,
        boundPolicies: boundData.policies?.length || 0,
        cancelledPolicies: cancelData.requests?.filter((r: any) => r.status === "APPROVED").length || 0,
      };
      cachedAgencyStats = computedStats;
      setStats(computedStats);

      // Calculate counts for each stage
      const counts: Record<string, number> = {
        "SUBMITTED": 0,
        "APPROVAL_REQUESTED": 0,
        "ROUTED": 0,
        "QUOTED": 0,
        "BIND_REQUESTED": 0,
        "BOUND": 0,
        "CANCELLED": 0,
        "DECLINED": 0,
        "PENDING_CANCEL": 0,
      };

      fetchedSubmissions.forEach((sub: Submission) => {
        if (sub.cancelRequested) {
          counts["PENDING_CANCEL"] = (counts["PENDING_CANCEL"] || 0) + 1;
        } else if (counts[sub.status] !== undefined) {
          counts[sub.status]++;
        } else {
          counts[sub.status] = 1;
        }
      });

      const updatedPipelineStages: PipelineStage[] = [
        { id: "ALL", label: "All Applications", count: fetchedSubmissions.length },
        { id: "IN_PROGRESS", label: "In Progress", count: (counts.SUBMITTED || 0) + (counts.APPROVAL_REQUESTED || 0) + (counts.ROUTED || 0) },
        { id: "APPROVED_QUOTE", label: "Approved Quote", count: (counts.QUOTED || 0) + (counts.BIND_REQUESTED || 0), color: "teal" },
        { id: "BOUND", label: "Bound", count: counts.BOUND || 0 },
        { id: "PENDING_CANCEL", label: "Pending Cancel", count: counts.PENDING_CANCEL || 0 },
        { id: "CANCELLED", label: "Cancelled", count: (counts.CANCELLED || 0) + (counts.DECLINED || 0) },
        { id: "MANUAL_AUDIT", label: "Manual Audit", count: fetchedManualAudits.length },
      ];
      cachedPipelineStages = updatedPipelineStages;
      setPipelineStages(updatedPipelineStages);

      filterSubmissionsByStageWithData(fetchedSubmissions);
    } catch (error: any) {
      console.error("Error fetching agency dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterSubmissionsByStageWithData = (data: Submission[]) => {
    let filtered = data;

    // Filter by selected stage
    if (selectedStage !== "ALL") {
      if (selectedStage === "PENDING_CANCEL") {
        filtered = filtered.filter(sub => sub.cancelRequested);
      } else {
        const stageStatus = stageToStatusMap[selectedStage];
        if (stageStatus) {
          if (Array.isArray(stageStatus)) {
            filtered = filtered.filter(sub => !sub.cancelRequested && stageStatus.includes(sub.status));
          } else {
            filtered = filtered.filter(sub => !sub.cancelRequested && sub.status === stageStatus);
          }
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
      filtered = filtered.filter(sub => sub.agentName?.trim().toLowerCase() === filterAgent.trim().toLowerCase());
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(sub =>
        (sub.clientName && sub.clientName.toLowerCase().includes(query)) ||
        (sub.submissionNumber && String(sub.submissionNumber).includes(query)) ||
        (sub.clientEmail && sub.clientEmail.toLowerCase().includes(query)) ||
        (sub.industry && sub.industry.toLowerCase().includes(query)) ||
        (sub.subtype && sub.subtype.toLowerCase().includes(query)) ||
        (sub.policyNumber && sub.policyNumber.toLowerCase().includes(query))
      );
    }

    setSubmissions(filtered);
  };

  const filterSubmissionsByStage = () => {
    filterSubmissionsByStageWithData(allSubmissions);
  };

  const getAuditStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETE":
      case "APPROVED":
      case "FINALIZED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "UNDERWRITER_REVIEW":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "DOCS_RECEIVED":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "REQUESTED":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "CANCELLED":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const filteredManualAudits = useMemo(() => {
    return manualAudits.filter((audit) => {
      if (auditStatusFilter !== "ALL" && audit.status !== auditStatusFilter) return false;
      if (auditProgramFilter !== "ALL" && audit.program !== auditProgramFilter) return false;
      if (auditSearchQuery) {
        const q = auditSearchQuery.toLowerCase();
        const matchName = audit.namedInsured?.toLowerCase().includes(q);
        const matchPolicy = audit.policyNumber?.toLowerCase().includes(q);
        const matchAuditId = audit.auditId?.toLowerCase().includes(q);
        if (!matchName && !matchPolicy && !matchAuditId) return false;
      }
      return true;
    });
  }, [manualAudits, auditStatusFilter, auditProgramFilter, auditSearchQuery]);


  const exportToCSV = () => {
    if (submissions.length === 0) return;
    const headers = ["Submission ID", "Industry", "Subtype", "Client Name", "Client Email", "Client Phone", "Status", "State", "Files", "Effective Date", "Created Date", "Updated Date"];
    const rows = submissions.map((sub) => [
      sub.submissionNumber, sub.industry, sub.subtype, sub.clientName, sub.clientEmail, sub.clientPhone,
      sub.status, sub.state, sub.fileCount.toString(),
      sub.effectiveDate ? new Date(sub.effectiveDate).toLocaleDateString('en-US', { timeZone: 'UTC' }) : "—",
      new Date(sub.createdAt).toLocaleDateString('en-US', { timeZone: 'UTC' }),
      new Date(sub.updatedAt).toLocaleDateString('en-US', { timeZone: 'UTC' }),
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
              <div ref={profileRef} className="relative">

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
                      onClick={() => signOut({ callbackUrl: "/signin" })}
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
              const isPendingCancel = stage.id === "PENDING_CANCEL";
              const iscansel = stage.id === "CANCELLED";
              const isManualAudit = stage.id === "MANUAL_AUDIT";

              return (
                <div key={stage.id} className="flex-shrink-0 flex items-center lg:block">
                  {isManualAudit && (
                    <>
                      <div className="hidden lg:block my-4 border-t border-[#E5E2DF]" />
                      <div className="block lg:hidden mx-2 h-8 border-l border-[#E5E2DF]" />
                    </>
                  )}

                  <button
                    onClick={() => {
                      setSelectedStage(stage.id);
                      cachedSelectedStage = stage.id;
                      if (typeof window !== "undefined") {
                        sessionStorage.setItem("agency_selected_stage", stage.id);
                      }
                    }}
                    className={`
          w-auto lg:w-full flex justify-between items-center px-4 py-3 rounded-xl text-sm
          transition-all duration-200 whitespace-nowrap gap-4 lg:gap-0

          ${!isActive ? "hover:bg-[#F6F3F0]" : "font-semibold"}

          ${isInProgress && isActive ? "ring-2 ring-[#9A8B7A]" : ""}
          ${isApproved && isActive ? "ring-2 ring-[#9A8B7A]" : ""}
          ${isBound && isActive ? "ring-2 ring-[#9A8B7A]" : ""}
          ${isPendingCancel && isActive ? "ring-2 ring-[#9A8B7A]" : ""}
          ${iscansel && isActive ? "ring-2 ring-[#9A8B7A]" : ""}
          ${isManualAudit && isActive ? "ring-2 ring-[#9A8B7A]" : ""}
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

                      {isPendingCancel && (
                        <AlertCircle className="w-4 h-4 text-[#9A8B7A]" />
                      )}

                      {iscansel && (
                        <XCircle className="w-4 h-4 text-[#9A8B7A]" />
                      )}

                      {isManualAudit && (
                        <ClipboardCheck className="w-4 h-4 text-[#9A8B7A]" />
                      )}

                      <span
                        className={`
              ${isAll ? "text-[#9A8B7A]" : ""}
              ${isInProgress ? "text-[#9A8B7A]" : ""}
              ${isApproved ? "text-[#9A8B7A]" : ""}
              ${isBound ? "text-[#9A8B7A]" : ""}
              ${isPendingCancel ? "text-[#9A8B7A]" : ""}
              ${iscansel ? "text-[#9A8B7A]" : ""}
              ${isManualAudit ? "text-[#9A8B7A]" : ""}
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
            ${isPendingCancel ? "bg-[#EFEAE5] text-[#9A8B7A]" : ""}
            ${iscansel ? "bg-[#EFEAE5] text-[#9A8B7A]" : ""}
            ${isManualAudit ? "bg-[#EFEAE5] text-[#9A8B7A]" : ""}
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

            {selectedStage === "MANUAL_AUDIT" ? (
              <>
                {/* AUDITS FILTER BAR */}
                <div className="p-4 md:p-6 border-b border-[#ECEAE7] flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4 shrink-0">
                  <div className="relative w-full md:w-[320px]">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Search by insured, policy #, audit ID..."
                      value={auditSearchQuery}
                      onChange={(e) => setAuditSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 w-full border border-[#E0DDD9] rounded-xl text-sm bg-[#F9F8F7] outline-none focus:ring-1 focus:ring-[#9A8B7A]"
                    />
                  </div>

                  <select
                    value={auditStatusFilter}
                    onChange={(e) => setAuditStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-[#E0DDD9] rounded-xl text-sm bg-[#F9F8F7] w-full md:w-auto outline-none"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="REQUESTED">Requested</option>
                    <option value="DOCS_RECEIVED">Docs Received</option>
                    <option value="UNDERWRITER_REVIEW">Underwriter Review</option>
                    <option value="FINALIZED">Finalized</option>
                    <option value="COMPLETE">Complete</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>

                  <select
                    value={auditProgramFilter}
                    onChange={(e) => setAuditProgramFilter(e.target.value)}
                    className="px-4 py-2 border border-[#E0DDD9] rounded-xl text-sm bg-[#F9F8F7] w-full md:w-auto outline-none"
                  >
                    <option value="ALL">All Programs</option>
                    {Array.from(new Set(manualAudits.map((a: any) => a.program).filter(Boolean))).map((prog: any) => (
                      <option key={prog} value={prog}>{prog}</option>
                    ))}
                  </select>

                  <div className="mt-2 md:mt-0 md:ml-auto text-sm text-gray-600 font-medium">
                    {filteredManualAudits.length} of {manualAudits.length} Audits
                  </div>
                </div>

                {/* AUDITS TABLE */}
                <div className="flex-1 overflow-auto border-t border-b border-[#ECEAE7] rounded-b-2xl">
                  <table className="w-full text-sm min-w-[850px]">
                    <thead className="bg-[#F9F8F7] text-[#6B6B6B] uppercase text-xs sticky top-0 z-10">
                      <tr>
                        <th className="px-4 lg:px-6 py-4 text-left">Audit / Policy</th>
                        <th className="px-4 lg:px-6 py-4 text-left">Applicant Company</th>
                        <th className="px-4 lg:px-6 py-4 text-left">Carrier & Program</th>
                        <th className="px-4 lg:px-6 py-4 text-left">Audit Period</th>
                        <th className="px-4 lg:px-6 py-4 text-left">Documents</th>
                        <th className="px-4 lg:px-6 py-4 text-left">Status</th>
                        <th className="px-4 lg:px-6 py-4 text-left">Due Date</th>
                        <th className="px-4 lg:px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[#ECEAE7]">
                      {filteredManualAudits.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-gray-500 text-sm">
                            No manual audits found for your agency.
                          </td>
                        </tr>
                      ) : (
                        filteredManualAudits.map((audit: any) => {
                          const docsTotal = audit.documents?.length || 0;
                          const docsReceived = audit.documents?.filter((d: any) => d.status === "RECEIVED" || d.status === "VERIFIED" || !!d.fileUrl).length || 0;
                          const dueDateObj = audit.dueDate ? new Date(audit.dueDate) : null;
                          const daysLeft = dueDateObj ? Math.ceil((dueDateObj.getTime() - Date.now()) / (1000 * 3600 * 24)) : null;
                          const isOverdue = daysLeft !== null && daysLeft < 0;

                          return (
                            <tr
                              key={audit._id}
                              className="hover:bg-[#F9F8F7] transition cursor-pointer group"
                              onClick={() => {
                                if (typeof window !== "undefined") {
                                  sessionStorage.setItem("agency_selected_stage", "MANUAL_AUDIT");
                                }
                                router.push(`/agency/audits/${audit._id}`);
                              }}
                            >
                              <td className="px-4 lg:px-6 py-4">
                                <div className="font-bold text-gray-900">{audit.auditId}</div>
                                <div className="text-xs text-gray-500 font-mono mt-0.5">{audit.policyNumber || "—"}</div>
                              </td>
                              <td className="px-4 lg:px-6 py-4 font-semibold text-gray-900">
                                {audit.namedInsured || "—"}
                              </td>
                              <td className="px-4 lg:px-6 py-4">
                                <div className="font-medium text-gray-800">{audit.carrier || "Richmond National"}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{audit.program || "General Liability"}</div>
                              </td>
                              <td className="px-4 lg:px-6 py-4 text-xs text-gray-600 whitespace-nowrap">
                                {audit.auditPeriodStart ? new Date(audit.auditPeriodStart).toLocaleDateString("en-US") : "—"} – {audit.auditPeriodEnd ? new Date(audit.auditPeriodEnd).toLocaleDateString("en-US") : "—"}
                              </td>
                              <td className="px-4 lg:px-6 py-4">
                                <div className="text-xs text-gray-600 mb-1 font-medium">
                                  {docsReceived} of {docsTotal}
                                </div>
                                <div className="w-20 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className={`h-1.5 rounded-full ${docsReceived === docsTotal && docsTotal > 0 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                    style={{ width: `${docsTotal > 0 ? (docsReceived / docsTotal) * 100 : 0}%` }}
                                  ></div>
                                </div>
                              </td>
                              <td className="px-4 lg:px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getAuditStatusBadge(audit.status)}`}>
                                  {audit.status}
                                </span>
                              </td>
                              <td className="px-4 lg:px-6 py-4 text-xs">
                                {dueDateObj ? (
                                  <>
                                    <div className="font-medium text-gray-700">{dueDateObj.toLocaleDateString("en-US")}</div>
                                    <div className={`mt-0.5 text-[11px] ${isOverdue ? 'text-rose-600 font-semibold' : 'text-gray-500'}`}>
                                      {isOverdue ? `Overdue by ${Math.abs(daysLeft!)}d` : `in ${daysLeft}d`}
                                    </div>
                                  </>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                              <td className="px-4 lg:px-6 py-4 text-right">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (typeof window !== "undefined") {
                                      sessionStorage.setItem("agency_selected_stage", "MANUAL_AUDIT");
                                    }
                                    router.push(`/agency/audits/${audit._id}`);
                                  }}
                                  className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-[#E0DDD9] rounded-lg hover:bg-gray-50 shadow-sm transition"
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <>
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
                        <th className="px-4 lg:px-6 py-4 text-left whitespace-nowrap">
                          {selectedStage === "PENDING_CANCEL" ? "Effective Cancel Date" : "Effective Date"}
                        </th>
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
                                {sub.industry === "Construction Equipment" || sub.industry === "Contractors Equipment" ? "Inland Marine" :
                                  sub.industry === "Apartment Building" || sub.industry === "Commercial Property" ? "Property" :
                                  sub.industry === "Manufacturers" || (sub.industry && sub.industry.toLowerCase().includes("manufacturer")) ? "Manufacturers" :
                                  sub.industry === "Builders Risk" ? "Builders Risk" : (() => {
                                    const parts = [];
                                    if (sub.hasGeneral) parts.push("General");
                                    if (sub.hasExcess) parts.push("Excess");
                                    if (sub.hasProfessional) parts.push("Professional");
                                    if (sub.hasPollution) parts.push("Pollution");
                                    if (parts.length > 0) return parts.join(" & ") + " Liability";
                                    return "General Liability";
                                  })()}
                              </>
                            )}
                          </td>
                          <td className="px-6 py-4 text-[#9A8B7A] font-medium">
                            {sub.submissionNumber}
                          </td>
                          <td className="px-6 py-4">{sub.clientName}</td>
                          <td className="px-6 py-4">
                            {sub.industry === "Construction Equipment" ? "Contractors Equipment" : sub.industry}
                          </td>
                          <td className="px-6 py-4">
                            {selectedStage === "PENDING_CANCEL" 
                              ? (sub.effectiveCancellationDate ? new Date(sub.effectiveCancellationDate).toLocaleDateString('en-US', { timeZone: 'UTC', month: '2-digit', day: '2-digit', year: 'numeric' }) : "—")
                              : (sub.effectiveDate ? new Date(sub.effectiveDate).toLocaleDateString('en-US', { timeZone: 'UTC', month: '2-digit', day: '2-digit', year: 'numeric' }) : "—")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                </div>
              </>
            )}
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